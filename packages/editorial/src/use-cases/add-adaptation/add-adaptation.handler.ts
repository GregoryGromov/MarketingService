import { CommandHandler, EventBus, type ICommandHandler } from '@nestjs/cqrs';
import {
  ChannelAdaptation,
  type AdaptationId,
} from '../../domain/channel-adaptation.entity.js';
import { ArticleRepository } from '../../domain/article.repository.js';
import { ChannelAdaptationRepository } from '../../domain/channel-adaptation.repository.js';
import { AddAdaptationCommand } from './add-adaptation.command.js';

@CommandHandler(AddAdaptationCommand)
export class AddAdaptationHandler
  implements ICommandHandler<AddAdaptationCommand, AdaptationId>
{
  constructor(
    private readonly articleRepository: ArticleRepository,
    private readonly channelAdaptationRepository: ChannelAdaptationRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: AddAdaptationCommand): Promise<AdaptationId> {
    const article = await this.articleRepository.findById(command.articleId);

    if (!article) {
      throw new Error(`Article ${command.articleId} not found`);
    }

    const existingAdaptation = await this.channelAdaptationRepository.findByArticleIdAndChannelId(
      command.articleId,
      command.channelId,
    );

    if (existingAdaptation) {
      throw new Error(
        `Article ${command.articleId} already has adaptation for channel ${command.channelId}`,
      );
    }

    const adaptation = ChannelAdaptation.create({
      articleId: article.id,
      channelId: command.channelId,
      displayName: command.displayName,
      promptInstructions: command.promptInstructions,
      sourceLanguage: article.original.language,
    });

    await this.channelAdaptationRepository.save(adaptation);
    this.eventBus.publishAll(adaptation.pullEvents());

    return adaptation.id;
  }
}
