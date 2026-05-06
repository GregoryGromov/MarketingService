var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AddAdaptationHandler } from './use-cases/add-adaptation/add-adaptation.handler.js';
import { AddTranslationHandler } from './use-cases/add-translation/add-translation.handler.js';
import { ApproveAdaptationHandler } from './use-cases/approve-adaptation/approve-adaptation.handler.js';
import { ApproveTranslationHandler } from './use-cases/approve-translation/approve-translation.handler.js';
import { CreateArticleHandler } from './use-cases/create-article/create-article.handler.js';
import { EditAdaptationHandler } from './use-cases/edit-adaptation/edit-adaptation.handler.js';
import { EditTranslationHandler } from './use-cases/edit-translation/edit-translation.handler.js';
import { GenerateAdaptationHandler } from './use-cases/generate-adaptation/generate-adaptation.handler.js';
import { GenerateTranslationHandler } from './use-cases/generate-translation/generate-translation.handler.js';
import { GetArticleHandler } from './use-cases/get-article/get-article.handler.js';
import { ReviseAdaptationSelectionHandler } from './use-cases/revise-adaptation-selection/revise-adaptation-selection.handler.js';
import { SelectAdaptationVersionHandler } from './use-cases/select-adaptation-version/select-adaptation-version.handler.js';
import { PublishTelegramMessageHandler } from './use-cases/publish-telegram-message/publish-telegram-message.handler.js';
let EditorialModule = class EditorialModule {
};
EditorialModule = __decorate([
    Module({
        imports: [CqrsModule],
        providers: [
            AddAdaptationHandler,
            AddTranslationHandler,
            ApproveAdaptationHandler,
            ApproveTranslationHandler,
            CreateArticleHandler,
            EditAdaptationHandler,
            EditTranslationHandler,
            GenerateAdaptationHandler,
            GenerateTranslationHandler,
            GetArticleHandler,
            PublishTelegramMessageHandler,
            ReviseAdaptationSelectionHandler,
            SelectAdaptationVersionHandler,
            // TODO: register domain checkers from domain/ (TranslationReadinessChecker)
            // TODO: register sagas from use-cases/ (on-adaptation-approved, etc.)
            //
            // Repositories and LLM adapter are NOT here — they live in
            // @marketing-service/infrastructure and are bound (port → adapter) there
        ],
        exports: [],
    })
], EditorialModule);
export { EditorialModule };
//# sourceMappingURL=editorial.module.js.map