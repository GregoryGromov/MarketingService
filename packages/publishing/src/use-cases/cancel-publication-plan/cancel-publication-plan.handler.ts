import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { PublicationRepository } from '../../domain/publication.repository.js';
import { PublicationPlanRepository } from '../../domain/publication-plan.repository.js';
import { CancelPublicationPlanCommand } from './cancel-publication-plan.command.js';

@CommandHandler(CancelPublicationPlanCommand)
export class CancelPublicationPlanHandler
  implements ICommandHandler<CancelPublicationPlanCommand, { id: string; status: 'cancelled' }>
{
  constructor(
    @Inject(PublicationPlanRepository)
    private readonly publicationPlanRepository: PublicationPlanRepository,
    @Inject(PublicationRepository)
    private readonly publicationRepository: PublicationRepository,
  ) {}

  async execute(command: CancelPublicationPlanCommand): Promise<{ id: string; status: 'cancelled' }> {
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
      throw new Error('Published publication plan cannot be cancelled');
    }

    if (linkedPublication?.status === 'publishing') {
      throw new Error('Publication is being delivered right now and cannot be cancelled');
    }

    if (linkedPublication) {
      await this.publicationRepository.deleteById(linkedPublication.id);
    }

    await this.publicationPlanRepository.deleteById(plan.id);

    return {
      id: plan.id,
      status: 'cancelled',
    };
  }
}
