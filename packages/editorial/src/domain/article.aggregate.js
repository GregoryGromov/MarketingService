import { AggregateRoot, createDomainEvent, generateId, } from '@marketing-service/shared';
export class Article extends AggregateRoot {
    id;
    projectId;
    status;
    paused;
    releasePlanSnapshot;
    original;
    createdAt;
    updatedAt;
    constructor(id, projectId, status, paused, releasePlanSnapshot, original, createdAt, updatedAt) {
        super();
        this.id = id;
        this.projectId = projectId;
        this.status = status;
        this.paused = paused;
        this.releasePlanSnapshot = releasePlanSnapshot;
        this.original = original;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    static create(params) {
        const now = new Date();
        const article = new Article(generateId('article'), params.projectId, 'draft', false, params.releasePlanSnapshot ?? null, {
            content: params.content,
            language: params.language,
            uploadedAt: now,
        }, now, now);
        article.addEvent(createDomainEvent({
            eventName: 'ArticleCreated',
            aggregateId: article.id,
        }));
        return article;
    }
    static rehydrate(props) {
        return new Article(props.id, props.projectId, props.status, props.paused, props.releasePlanSnapshot, props.original, props.createdAt, props.updatedAt);
    }
}
//# sourceMappingURL=article.aggregate.js.map