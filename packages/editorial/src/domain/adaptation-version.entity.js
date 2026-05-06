import { generateId } from '@marketing-service/shared';
export class AdaptationVersion {
    id;
    adaptationId;
    content;
    kind;
    sourceVersionId;
    meta;
    createdAt;
    constructor(id, adaptationId, content, kind, sourceVersionId, meta, createdAt) {
        this.id = id;
        this.adaptationId = adaptationId;
        this.content = content;
        this.kind = kind;
        this.sourceVersionId = sourceVersionId;
        this.meta = meta;
        this.createdAt = createdAt;
    }
    static create(params) {
        return new AdaptationVersion(generateId('adaptation_version'), params.adaptationId, params.content, params.kind, params.sourceVersionId ?? null, params.meta ?? null, new Date());
    }
    static rehydrate(props) {
        return new AdaptationVersion(props.id, props.adaptationId, props.content, props.kind, props.sourceVersionId, props.meta, props.createdAt);
    }
}
//# sourceMappingURL=adaptation-version.entity.js.map