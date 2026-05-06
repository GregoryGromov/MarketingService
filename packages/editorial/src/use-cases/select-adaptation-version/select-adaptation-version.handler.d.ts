import { type ICommandHandler } from '@nestjs/cqrs';
import { ChannelAdaptationRepository } from '../../domain/channel-adaptation.repository.js';
import { AdaptationVersionRepository } from '../../domain/adaptation-version.repository.js';
import { SelectAdaptationVersionCommand } from './select-adaptation-version.command.js';
export declare class SelectAdaptationVersionHandler implements ICommandHandler<SelectAdaptationVersionCommand, void> {
    private readonly channelAdaptationRepository;
    private readonly adaptationVersionRepository;
    constructor(channelAdaptationRepository: ChannelAdaptationRepository, adaptationVersionRepository: AdaptationVersionRepository);
    execute(command: SelectAdaptationVersionCommand): Promise<void>;
}
//# sourceMappingURL=select-adaptation-version.handler.d.ts.map