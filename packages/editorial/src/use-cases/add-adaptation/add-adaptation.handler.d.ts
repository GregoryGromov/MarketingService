import { EventBus, type ICommandHandler } from '@nestjs/cqrs';
import { type AdaptationId } from '../../domain/channel-adaptation.entity.js';
import { ArticleRepository } from '../../domain/article.repository.js';
import { ChannelAdaptationRepository } from '../../domain/channel-adaptation.repository.js';
import { AddAdaptationCommand } from './add-adaptation.command.js';
export declare class AddAdaptationHandler implements ICommandHandler<AddAdaptationCommand, AdaptationId> {
    private readonly articleRepository;
    private readonly channelAdaptationRepository;
    private readonly eventBus;
    constructor(articleRepository: ArticleRepository, channelAdaptationRepository: ChannelAdaptationRepository, eventBus: EventBus);
    execute(command: AddAdaptationCommand): Promise<AdaptationId>;
}
//# sourceMappingURL=add-adaptation.handler.d.ts.map