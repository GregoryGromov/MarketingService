import { EventBus, type ICommandHandler } from '@nestjs/cqrs';
import { AdaptationVersionRepository } from '../../domain/adaptation-version.repository.js';
import { ChannelAdaptationRepository } from '../../domain/channel-adaptation.repository.js';
import { EditAdaptationCommand } from './edit-adaptation.command.js';
export declare class EditAdaptationHandler implements ICommandHandler<EditAdaptationCommand, void> {
    private readonly channelAdaptationRepository;
    private readonly adaptationVersionRepository;
    private readonly eventBus;
    constructor(channelAdaptationRepository: ChannelAdaptationRepository, adaptationVersionRepository: AdaptationVersionRepository, eventBus: EventBus);
    execute(command: EditAdaptationCommand): Promise<void>;
}
//# sourceMappingURL=edit-adaptation.handler.d.ts.map