var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { CommandHandler } from '@nestjs/cqrs';
import { AdaptationVersion } from '../../domain/adaptation-version.entity.js';
import { AdaptationVersionRepository } from '../../domain/adaptation-version.repository.js';
import { ChannelAdaptationRepository } from '../../domain/channel-adaptation.repository.js';
import { EventBus } from '@nestjs/cqrs';
import { AdaptationGeneratorPort } from '../../ports/adaptation-generator.port.js';
import { ReviseAdaptationSelectionCommand } from './revise-adaptation-selection.command.js';
let ReviseAdaptationSelectionHandler = class ReviseAdaptationSelectionHandler {
    channelAdaptationRepository;
    adaptationVersionRepository;
    adaptationGenerator;
    eventBus;
    constructor(channelAdaptationRepository, adaptationVersionRepository, adaptationGenerator, eventBus) {
        this.channelAdaptationRepository = channelAdaptationRepository;
        this.adaptationVersionRepository = adaptationVersionRepository;
        this.adaptationGenerator = adaptationGenerator;
        this.eventBus = eventBus;
    }
    async execute(command) {
        const adaptation = await this.channelAdaptationRepository.findById(command.adaptationId);
        if (!adaptation || adaptation.articleId !== command.articleId) {
            throw new Error(`Adaptation ${command.adaptationId} not found in article ${command.articleId}`);
        }
        if (!command.selectedText.trim()) {
            throw new Error('Selected text is required');
        }
        if (!command.instruction.trim()) {
            throw new Error('Instruction is required');
        }
        const revisedContent = await this.adaptationGenerator.reviseSelection({
            fullContent: command.currentContent,
            selectedText: command.selectedText,
            sourceLanguage: adaptation.sourceLanguage,
            channelId: adaptation.channelId,
            displayName: adaptation.displayName,
            promptInstructions: adaptation.promptInstructions,
            instruction: command.instruction,
        });
        const version = AdaptationVersion.create({
            adaptationId: adaptation.id,
            content: revisedContent,
            kind: 'ai_revision',
            sourceVersionId: adaptation.selectedVersionId,
            meta: {
                instruction: command.instruction,
                selectedText: command.selectedText,
            },
        });
        await this.adaptationVersionRepository.save(version);
        adaptation.edit(version.id, revisedContent);
        await this.channelAdaptationRepository.save(adaptation);
        this.eventBus.publishAll(adaptation.pullEvents());
        return revisedContent;
    }
};
ReviseAdaptationSelectionHandler = __decorate([
    CommandHandler(ReviseAdaptationSelectionCommand),
    __metadata("design:paramtypes", [ChannelAdaptationRepository,
        AdaptationVersionRepository,
        AdaptationGeneratorPort,
        EventBus])
], ReviseAdaptationSelectionHandler);
export { ReviseAdaptationSelectionHandler };
//# sourceMappingURL=revise-adaptation-selection.handler.js.map