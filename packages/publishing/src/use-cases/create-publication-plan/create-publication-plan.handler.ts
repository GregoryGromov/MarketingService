import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ArticleRepository } from '@marketing-service/editorial';
import { PublicationPlan } from '../../domain/publication-plan.aggregate.js';
import { PublicationPlanRepository } from '../../domain/publication-plan.repository.js';
import { CreatePublicationPlanCommand } from './create-publication-plan.command.js';

@CommandHandler(CreatePublicationPlanCommand)
export class CreatePublicationPlanHandler
  implements ICommandHandler<CreatePublicationPlanCommand, { id: string }>
{
  constructor(
    @Inject(ArticleRepository)
    private readonly articleRepository: ArticleRepository,
    @Inject(PublicationPlanRepository)
    private readonly publicationPlanRepository: PublicationPlanRepository,
  ) {}

  async execute(command: CreatePublicationPlanCommand): Promise<{ id: string }> {
    const article = await this.articleRepository.findById(command.articleId);
    if (!article) {
      throw new Error(`Article ${command.articleId} not found`);
    }

    const existing = await this.publicationPlanRepository.findByLogicalKey(
      article.id,
      command.channelId,
      command.targetLanguage,
      command.publishAt,
    );

    if (existing) {
      return { id: existing.id };
    }

    const plan = PublicationPlan.create({
      articleId: article.id,
      projectId: article.projectId,
      channelId: command.channelId,
      targetLanguage: command.targetLanguage,
      publishAt: command.publishAt,
    });

    await this.publicationPlanRepository.save(plan);
    return { id: plan.id };
  }
}
