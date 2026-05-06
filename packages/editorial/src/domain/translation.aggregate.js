import { AggregateRoot, createDomainEvent, generateId, } from '@marketing-service/shared';
export class Translation extends AggregateRoot {
    id;
    adaptationId;
    sourceLanguage;
    targetLanguage;
    status;
    translatedContent;
    createdAt;
    updatedAt;
    constructor(id, adaptationId, sourceLanguage, targetLanguage, status, translatedContent, createdAt, updatedAt) {
        super();
        this.id = id;
        this.adaptationId = adaptationId;
        this.sourceLanguage = sourceLanguage;
        this.targetLanguage = targetLanguage;
        this.status = status;
        this.translatedContent = translatedContent;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    static create(params) {
        const now = new Date();
        const translation = new Translation(generateId('translation'), params.adaptationId, params.sourceLanguage, params.targetLanguage, 'pending', null, now, now);
        translation.addEvent(createDomainEvent({
            eventName: 'TranslationAdded',
            aggregateId: translation.id,
        }));
        return translation;
    }
    static rehydrate(props) {
        return new Translation(props.id, props.adaptationId, props.sourceLanguage, props.targetLanguage, props.status, props.translatedContent, props.createdAt, props.updatedAt);
    }
    markGenerated(translatedContent) {
        this.translatedContent = translatedContent;
        this.status = 'generated';
        this.updatedAt = new Date();
        this.addEvent(createDomainEvent({
            eventName: 'TranslationGenerated',
            aggregateId: this.id,
        }));
    }
    edit(translatedContent) {
        this.translatedContent = translatedContent;
        this.status = 'edited';
        this.updatedAt = new Date();
        this.addEvent(createDomainEvent({
            eventName: 'TranslationEdited',
            aggregateId: this.id,
        }));
    }
    approve() {
        if (this.status !== 'generated' && this.status !== 'edited') {
            throw new Error(`Cannot approve translation from status "${this.status}"`);
        }
        if (!this.translatedContent) {
            throw new Error('Cannot approve translation without content');
        }
        this.status = 'approved';
        this.updatedAt = new Date();
        this.addEvent(createDomainEvent({
            eventName: 'TranslationApproved',
            aggregateId: this.id,
        }));
    }
    markOutdated() {
        this.status = 'outdated';
        this.updatedAt = new Date();
    }
    resetToPending() {
        this.status = 'pending';
        this.translatedContent = null;
        this.updatedAt = new Date();
    }
}
//# sourceMappingURL=translation.aggregate.js.map