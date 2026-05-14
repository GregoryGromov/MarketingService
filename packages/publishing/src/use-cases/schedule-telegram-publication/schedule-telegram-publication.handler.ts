import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ChannelAdaptationRepository } from '@marketing-service/editorial';
import { Publication } from '../../domain/publication.aggregate.js';
import { PublicationRepository } from '../../domain/publication.repository.js';
import { PublicationOutcomePort } from '../../ports/publication-outcome.port.js';
import { ScheduleTelegramPublicationCommand } from './schedule-telegram-publication.command.js';

@CommandHandler(ScheduleTelegramPublicationCommand)
export class ScheduleTelegramPublicationHandler
  implements ICommandHandler<ScheduleTelegramPublicationCommand, { id: string; status: string }>
{
  constructor(
    @Inject(ChannelAdaptationRepository)
    private readonly channelAdaptationRepository: ChannelAdaptationRepository,
    @Inject(PublicationRepository)
    private readonly publicationRepository: PublicationRepository,
    @Inject(PublicationOutcomePort)
    private readonly publicationOutcomePort: PublicationOutcomePort,
  ) {}

  async execute(
    command: ScheduleTelegramPublicationCommand,
  ): Promise<{ id: string; status: string }> {
    const adaptation = await this.channelAdaptationRepository.findById(command.adaptationId);

    if (!adaptation || adaptation.articleId !== command.articleId) {
      throw new Error(`Adaptation ${command.adaptationId} not found in article ${command.articleId}`);
    }

    if (adaptation.channelId !== 'channel_telegram') {
      throw new Error(
        `Adaptation ${adaptation.id} belongs to ${adaptation.channelId} and cannot be scheduled for Telegram`,
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
      await this.syncPublicationOutcome(existing);
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
    await this.syncPublicationOutcome(publication);
    return { id: publication.id, status: publication.status };
  }

  private async syncPublicationOutcome(publication: Publication): Promise<void> {
    await this.publicationOutcomePort.syncPublicationOutcome({
      publicationId: publication.id,
      plannedPublicationId: publication.plannedPublicationId,
      status: publication.status,
      publishAt: publication.publishAt,
      externalAccountRef: publication.telegramChatId,
      externalPostId: publication.telegramMessageId,
      publishedAt: publication.publishedAt,
      errorMessage: publication.errorMessage,
    });
  }
}
