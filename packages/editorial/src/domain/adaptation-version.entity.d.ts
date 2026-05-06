import { type TypedId } from '@marketing-service/shared';
import type { AdaptationId } from './channel-adaptation.entity.js';
export type AdaptationVersionId = TypedId<'adaptation_version'>;
export type AdaptationVersionKind = 'generated' | 'ai_revision' | 'manual_edit';
export interface CreateAdaptationVersionParams {
    adaptationId: AdaptationId;
    content: string;
    kind: AdaptationVersionKind;
    sourceVersionId?: AdaptationVersionId | null;
    meta?: Record<string, unknown> | null;
}
export interface AdaptationVersionProps {
    id: AdaptationVersionId;
    adaptationId: AdaptationId;
    content: string;
    kind: AdaptationVersionKind;
    sourceVersionId: AdaptationVersionId | null;
    meta: Record<string, unknown> | null;
    createdAt: Date;
}
export declare class AdaptationVersion {
    readonly id: AdaptationVersionId;
    readonly adaptationId: AdaptationId;
    readonly content: string;
    readonly kind: AdaptationVersionKind;
    readonly sourceVersionId: AdaptationVersionId | null;
    readonly meta: Record<string, unknown> | null;
    readonly createdAt: Date;
    private constructor();
    static create(params: CreateAdaptationVersionParams): AdaptationVersion;
    static rehydrate(props: AdaptationVersionProps): AdaptationVersion;
}
//# sourceMappingURL=adaptation-version.entity.d.ts.map