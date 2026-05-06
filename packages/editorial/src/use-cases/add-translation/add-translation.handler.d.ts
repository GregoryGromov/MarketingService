import { EventBus, type ICommandHandler } from '@nestjs/cqrs';
import { ChannelAdaptationRepository } from '../../domain/channel-adaptation.repository.js';
import { type TranslationId } from '../../domain/translation.aggregate.js';
import { TranslationRepository } from '../../domain/translation.repository.js';
import { AddTranslationCommand } from './add-translation.command.js';
export declare class AddTranslationHandler implements ICommandHandler<AddTranslationCommand, TranslationId> {
    private readonly channelAdaptationRepository;
    private readonly translationRepository;
    private readonly eventBus;
    constructor(channelAdaptationRepository: ChannelAdaptationRepository, translationRepository: TranslationRepository, eventBus: EventBus);
    execute(command: AddTranslationCommand): Promise<TranslationId>;
}
//# sourceMappingURL=add-translation.handler.d.ts.map