import type { ArticleId, ChannelId, ProjectId } from '@marketing-service/editorial';
import type {
  PlannedPublicationId,
  PublicationPlan,
  PublicationPlanId,
} from './publication-plan.aggregate.js';

export abstract class PublicationPlanRepository {
  abstract findById(id: PublicationPlanId): Promise<PublicationPlan | null>;
  abstract findByArticleId(articleId: ArticleId): Promise<PublicationPlan[]>;
  abstract findByPlannedPublicationId(
    plannedPublicationId: PlannedPublicationId,
  ): Promise<PublicationPlan | null>;
  abstract findByProjectId(
    projectId: ProjectId,
    range?: { from?: Date | null; to?: Date | null },
  ): Promise<PublicationPlan[]>;
  abstract findByLogicalKey(
    articleId: ArticleId,
    channelId: ChannelId,
    targetLanguage: string,
    publishAt: Date,
  ): Promise<PublicationPlan | null>;
  abstract save(plan: PublicationPlan): Promise<void>;
  abstract deleteById(id: PublicationPlanId): Promise<void>;
}
