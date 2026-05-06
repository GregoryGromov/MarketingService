import { EventBus, type ICommandHandler } from '@nestjs/cqrs';
import { AdaptationVersionRepository } from '../../domain/adaptation-version.repository.js';
import { ChannelAdaptationRepository } from '../../domain/channel-adaptation.repository.js';
import { ApproveAdaptationCommand } from './approve-adaptation.command.js';
export declare class ApproveAdaptationHandler implements ICommandHandler<ApproveAdaptationCommand, void> {
    private readonly channelAdaptationRepository;
    private readonly adaptationVersionRepository;
    private readonly eventBus;
    constructor(channelAdaptationRepository: ChannelAdaptationRepository, adaptationVersionRepository: AdaptationVersionRepository, eventBus: EventBus);
    execute(command: ApproveAdaptationCommand): Promise<void>;
}
//# sourceMappingURL=approve-adaptation.handler.d.ts.map