import { AggregateRoot, type TypedId } from '@marketing-service/shared';
export type ArticleId = TypedId<'article'>;
export type ProjectId = TypedId<'project'>;
export type ArticleStatus = 'draft' | 'ready' | 'active' | 'completed' | 'cancelled';
export interface Original {
    content: string;
    language: string;
    uploadedAt: Date;
}
export interface CreateArticleParams {
    projectId: ProjectId;
    content: string;
    language: string;
    releasePlanSnapshot?: Record<string, unknown> | null;
}
export interface ArticleProps {
    id: ArticleId;
    projectId: ProjectId;
    status: ArticleStatus;
    paused: boolean;
    releasePlanSnapshot: Record<string, unknown> | null;
    original: Original;
    createdAt: Date;
    updatedAt: Date;
}
export declare class Article extends AggregateRoot {
    readonly id: ArticleId;
    readonly projectId: ProjectId;
    status: ArticleStatus;
    paused: boolean;
    releasePlanSnapshot: Record<string, unknown> | null;
    readonly original: Original;
    readonly createdAt: Date;
    updatedAt: Date;
    private constructor();
    static create(params: CreateArticleParams): Article;
    static rehydrate(props: ArticleProps): Article;
}
//# sourceMappingURL=article.aggregate.d.ts.map