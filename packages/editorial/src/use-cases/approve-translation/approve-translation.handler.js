var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { CommandHandler, EventBus } from '@nestjs/cqrs';
import { TranslationRepository } from '../../domain/translation.repository.js';
import { ApproveTranslationCommand } from './approve-translation.command.js';
let ApproveTranslationHandler = class ApproveTranslationHandler {
    translationRepository;
    eventBus;
    constructor(translationRepository, eventBus) {
        this.translationRepository = translationRepository;
        this.eventBus = eventBus;
    }
    async execute(command) {
        const translation = await this.translationRepository.findById(command.translationId);
        if (!translation || translation.adaptationId !== command.adaptationId) {
            throw new Error(`Translation ${command.translationId} not found for adaptation ${command.adaptationId}`);
        }
        translation.approve();
        await this.translationRepository.save(translation);
        this.eventBus.publishAll(translation.pullEvents());
    }
};
ApproveTranslationHandler = __decorate([
    CommandHandler(ApproveTranslationCommand),
    __metadata("design:paramtypes", [TranslationRepository,
        EventBus])
], ApproveTranslationHandler);
export { ApproveTranslationHandler };
//# sourceMappingURL=approve-translation.handler.js.map