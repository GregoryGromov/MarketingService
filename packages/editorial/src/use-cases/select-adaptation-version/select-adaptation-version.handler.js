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
import { ChannelAdaptationRepository } from '../../domain/channel-adaptation.repository.js';
import { AdaptationVersionRepository } from '../../domain/adaptation-version.repository.js';
import { SelectAdaptationVersionCommand } from './select-adaptation-version.command.js';
let SelectAdaptationVersionHandler = class SelectAdaptationVersionHandler {
    channelAdaptationRepository;
    adaptationVersionRepository;
    constructor(channelAdaptationRepository, adaptationVersionRepository) {
        this.channelAdaptationRepository = channelAdaptationRepository;
        this.adaptationVersionRepository = adaptationVersionRepository;
    }
    async execute(command) {
        const adaptation = await this.channelAdaptationRepository.findById(command.adaptationId);
        if (!adaptation || adaptation.articleId !== command.articleId) {
            throw new Error(`Adaptation ${command.adaptationId} not found in article ${command.articleId}`);
        }
        const version = await this.adaptationVersionRepository.findById(command.versionId);
        if (!version || version.adaptationId !== adaptation.id) {
            throw new Error(`Version ${command.versionId} not found in adaptation ${command.adaptationId}`);
        }
        adaptation.selectVersion(version.id, version.content);
        await this.channelAdaptationRepository.save(adaptation);
    }
};
SelectAdaptationVersionHandler = __decorate([
    CommandHandler(SelectAdaptationVersionCommand),
    __metadata("design:paramtypes", [ChannelAdaptationRepository,
        AdaptationVersionRepository])
], SelectAdaptationVersionHandler);
export { SelectAdaptationVersionHandler };
//# sourceMappingURL=select-adaptation-version.handler.js.map