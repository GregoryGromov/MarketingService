import { EventBus, type ICommandHandler } from '@nestjs/cqrs';
import { ChannelAdaptationRepository } from '../../domain/channel-adaptation.repository.js';
import { TranslationRepository } from '../../domain/translation.repository.js';
import { TranslationGeneratorPort } from '../../ports/translation-generator.port.js';
import { GenerateTranslationCommand } from './generate-translation.command.js';
export declare class GenerateTranslationHandler implements ICommandHandler<GenerateTranslationCommand, string> {
    private readonly channelAdaptationRepository;
    private readonly translationRepository;
    private readonly translationGenerator;
    private readonly eventBus;
    constructor(channelAdaptationRepository: ChannelAdaptationRepository, translationRepository: TranslationRepository, translationGenerator: TranslationGeneratorPort, eventBus: EventBus);
    execute(command: GenerateTranslationCommand): Promise<string>;
}
//# sourceMappingURL=generate-translation.handler.d.ts.map