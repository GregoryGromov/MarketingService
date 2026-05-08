import { ChannelAdaptationRepository } from '@marketing-service/editorial';
import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { Publication } from '../../domain/publication.aggregate.js';
import { PublicationRepository } from '../../domain/publication.repository.js';
import { ScheduleXPublicationCommand } from './schedule-x-publication.command.js';

@CommandHandler(ScheduleXPublicationCommand)
export class ScheduleXPublicationHandler
  implements ICommandHandler<ScheduleXPublicationCommand, { id: string; status: string }>
{
  constructor(
    @Inject(ChannelAdaptationRepository)
    private readonly channelAdaptationRepository: ChannelAdaptationRepository,
    @Inject(PublicationRepository)
    private readonly publicationRepository: PublicationRepository,
  ) {}

  async execute(command: ScheduleXPublicationCommand): Promise<{ id: string; status: string }> {
    const adaptation = await this.channelAdaptationRepository.findById(command.adaptationId);

    if (!adaptation || adaptation.articleId !== command.articleId) {
      throw new Error(
        `Adaptation ${command.adaptationId} not found in article ${command.articleId}`,
      );
    }

    if (adaptation.channelId !== 'channel_x') {
      throw new Error(
        `Adaptation ${adaptation.id} belongs to ${adaptation.channelId} and cannot be scheduled for X`,
      );
    }

    const targetLanguage = command.targetLanguage.trim().toLowerCase();

    const existing = await this.publicationRepository.findByLogicalKey(
      command.articleId,
      adaptation.id,
      adaptation.channelId,
      targetLanguage,
    );

    if (existing) {
      existing.reschedule(command.publishAt);
      await this.publicationRepository.save(existing);
      return { id: existing.id, status: existing.status };
    }

    const publication = Publication.create({
      articleId: command.articleId,
      adaptationId: adaptation.id,
      channelId: adaptation.channelId,
      displayName: adaptation.displayName,
      targetLanguage,
      publishAt: command.publishAt,
    });

    await this.publicationRepository.save(publication);
    return { id: publication.id, status: publication.status };
  }
}
