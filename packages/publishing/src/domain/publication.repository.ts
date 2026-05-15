import type { AdaptationId, ArticleId, ChannelId, ProjectId } from '@marketing-service/editorial';
import type {
  PlannedPublicationId,
  Publication,
  PublicationId,
} from './publication.aggregate.js';

export abstract class PublicationRepository {
  abstract findById(id: PublicationId): Promise<Publication | null>;
  abstract findByArticleId(articleId: ArticleId): Promise<Publication[]>;
  abstract findByProjectId(
    projectId: ProjectId,
    options?: {
      from?: Date | null;
      to?: Date | null;
    },
  ): Promise<Publication[]>;
  abstract findByPlannedPublicationId(
    plannedPublicationId: PlannedPublicationId,
  ): Promise<Publication | null>;
  abstract findByLogicalKey(
    articleId: ArticleId,
    adaptationId: AdaptationId,
    channelId: ChannelId,
    targetLanguage: string,
  ): Promise<Publication | null>;
  abstract findDue(now: Date, limit?: number): Promise<Publication[]>;
  abstract deleteById(id: PublicationId): Promise<void>;
  abstract save(publication: Publication): Promise<void>;
}
