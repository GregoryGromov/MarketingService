import { type ICommandHandler } from '@nestjs/cqrs';
import { AdaptationVersionRepository } from '../../domain/adaptation-version.repository.js';
import { ChannelAdaptationRepository } from '../../domain/channel-adaptation.repository.js';
import { EventBus } from '@nestjs/cqrs';
import { AdaptationGeneratorPort } from '../../ports/adaptation-generator.port.js';
import { ReviseAdaptationSelectionCommand } from './revise-adaptation-selection.command.js';
export declare class ReviseAdaptationSelectionHandler implements ICommandHandler<ReviseAdaptationSelectionCommand, string> {
    private readonly channelAdaptationRepository;
    private readonly adaptationVersionRepository;
    private readonly adaptationGenerator;
    private readonly eventBus;
    constructor(channelAdaptationRepository: ChannelAdaptationRepository, adaptationVersionRepository: AdaptationVersionRepository, adaptationGenerator: AdaptationGeneratorPort, eventBus: EventBus);
    execute(command: ReviseAdaptationSelectionCommand): Promise<string>;
}
//# sourceMappingURL=revise-adaptation-selection.handler.d.ts.map