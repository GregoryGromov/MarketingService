import { AggregateRoot, createDomainEvent, generateId, } from '@marketing-service/shared';
export class ChannelAdaptation extends AggregateRoot {
    id;
    articleId;
    channelId;
    displayName;
    promptInstructions;
    sourceLanguage;
    status;
    adaptedContent;
    selectedVersionId;
    approvedVersionId;
    createdAt;
    updatedAt;
    constructor(id, articleId, channelId, displayName, promptInstructions, sourceLanguage, status, adaptedContent, selectedVersionId, approvedVersionId, createdAt, updatedAt) {
        super();
        this.id = id;
        this.articleId = articleId;
        this.channelId = channelId;
        this.displayName = displayName;
        this.promptInstructions = promptInstructions;
        this.sourceLanguage = sourceLanguage;
        this.status = status;
        this.adaptedContent = adaptedContent;
        this.selectedVersionId = selectedVersionId;
        this.approvedVersionId = approvedVersionId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    static create(params) {
        const now = new Date();
        const adaptation = new ChannelAdaptation(generateId('adaptation'), params.articleId, params.channelId, params.displayName, params.promptInstructions, params.sourceLanguage, 'pending', null, null, null, now, now);
        adaptation.addEvent(createDomainEvent({
            eventName: 'AdaptationAdded',
            aggregateId: adaptation.id,
        }));
        return adaptation;
    }
    static rehydrate(props) {
        return new ChannelAdaptation(props.id, props.articleId, props.channelId, props.displayName, props.promptInstructions, props.sourceLanguage, props.status, props.adaptedContent, props.selectedVersionId, props.approvedVersionId, props.createdAt, props.updatedAt);
    }
    markGenerated(versionId, adaptedContent) {
        this.adaptedContent = adaptedContent;
        this.selectedVersionId = versionId;
        this.status = 'generated';
        this.updatedAt = new Date();
        this.addEvent(createDomainEvent({
            eventName: 'AdaptationGenerated',
            aggregateId: this.id,
        }));
    }
    edit(versionId, adaptedContent) {
        this.adaptedContent = adaptedContent;
        this.selectedVersionId = versionId;
        this.status = 'edited';
        this.updatedAt = new Date();
        this.addEvent(createDomainEvent({
            eventName: 'AdaptationEdited',
            aggregateId: this.id,
        }));
    }
    selectVersion(versionId, adaptedContent) {
        this.selectedVersionId = versionId;
        this.adaptedContent = adaptedContent;
        this.updatedAt = new Date();
    }
    approve() {
        if (this.status !== 'generated' && this.status !== 'edited') {
            throw new Error(`Cannot approve adaptation from status "${this.status}"`);
        }
        if (!this.selectedVersionId || !this.adaptedContent) {
            throw new Error('Cannot approve adaptation without selected version');
        }
        this.approvedVersionId = this.selectedVersionId;
        this.status = 'approved';
        this.updatedAt = new Date();
        this.addEvent(createDomainEvent({
            eventName: 'AdaptationApproved',
            aggregateId: this.id,
        }));
    }
    markOutdated() {
        this.status = 'outdated';
        this.approvedVersionId = null;
        this.updatedAt = new Date();
    }
    resetToPending() {
        this.status = 'pending';
        this.selectedVersionId = null;
        this.approvedVersionId = null;
        this.adaptedContent = null;
        this.updatedAt = new Date();
    }
}
//# sourceMappingURL=channel-adaptation.entity.js.map