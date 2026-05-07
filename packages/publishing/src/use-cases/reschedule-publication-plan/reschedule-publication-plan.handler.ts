import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { PublicationPlanRepository } from '../../domain/publication-plan.repository.js';
import { PublicationRepository } from '../../domain/publication.repository.js';
import { ReschedulePublicationPlanCommand } from './reschedule-publication-plan.command.js';

@CommandHandler(ReschedulePublicationPlanCommand)
export class ReschedulePublicationPlanHandler
  implements ICommandHandler<ReschedulePublicationPlanCommand, { id: string; publishAt: Date }>
{
  constructor(
    @Inject(PublicationPlanRepository)
    private readonly publicationPlanRepository: PublicationPlanRepository,
    @Inject(PublicationRepository)
    private readonly publicationRepository: PublicationRepository,
  ) {}

  async execute(
    command: ReschedulePublicationPlanCommand,
  ): Promise<{ id: string; publishAt: Date }> {
    const plan = await this.publicationPlanRepository.findById(command.planId);
    if (!plan) {
      throw new Error(`Publication plan ${command.planId} not found`);
    }

    const publications = await this.publicationRepository.findByArticleId(plan.articleId);
    const linkedPublication = publications.find((item) =>
      item.channelId === plan.channelId &&
      item.targetLanguage.toLowerCase() === plan.targetLanguage.toLowerCase() &&
      item.publishAt.getTime() === plan.publishAt.getTime(),
    ) ?? null;

    if (linkedPublication?.status === 'published') {
      throw new Error('Published publication cannot be rescheduled');
    }

    if (linkedPublication?.status === 'publishing') {
      throw new Error('Publication is being delivered right now and cannot be rescheduled');
    }

    plan.reschedule(command.publishAt);
    await this.publicationPlanRepository.save(plan);

    if (linkedPublication) {
      linkedPublication.reschedule(command.publishAt);
      await this.publicationRepository.save(linkedPublication);
    }

    return {
      id: plan.id,
      publishAt: plan.publishAt,
    };
  }
}
