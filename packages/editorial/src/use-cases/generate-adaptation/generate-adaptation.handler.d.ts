import { EventBus, type ICommandHandler } from '@nestjs/cqrs';
import { AdaptationVersionRepository } from '../../domain/adaptation-version.repository.js';
import { AdaptationGeneratorPort } from '../../ports/adaptation-generator.port.js';
import { ArticleRepository } from '../../domain/article.repository.js';
import { ChannelAdaptationRepository } from '../../domain/channel-adaptation.repository.js';
import { GenerateAdaptationCommand } from './generate-adaptation.command.js';
export declare class GenerateAdaptationHandler implements ICommandHandler<GenerateAdaptationCommand, string> {
    private readonly articleRepository;
    private readonly channelAdaptationRepository;
    private readonly adaptationVersionRepository;
    private readonly adaptationGenerator;
    private readonly eventBus;
    constructor(articleRepository: ArticleRepository, channelAdaptationRepository: ChannelAdaptationRepository, adaptationVersionRepository: AdaptationVersionRepository, adaptationGenerator: AdaptationGeneratorPort, eventBus: EventBus);
    execute(command: GenerateAdaptationCommand): Promise<string>;
}
//# sourceMappingURL=generate-adaptation.handler.d.ts.map