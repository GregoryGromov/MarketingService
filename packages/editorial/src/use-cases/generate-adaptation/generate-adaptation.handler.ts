import { CommandHandler, EventBus, type ICommandHandler } from '@nestjs/cqrs';
import { AdaptationVersionRepository } from '../../domain/adaptation-version.repository.js';
import { AdaptationVersion } from '../../domain/adaptation-version.entity.js';
import { AdaptationGeneratorPort } from '../../ports/adaptation-generator.port.js';
import { ArticleRepository } from '../../domain/article.repository.js';
import { ChannelAdaptationRepository } from '../../domain/channel-adaptation.repository.js';
import { GenerateAdaptationCommand } from './generate-adaptation.command.js';

@CommandHandler(GenerateAdaptationCommand)
export class GenerateAdaptationHandler
  implements ICommandHandler<GenerateAdaptationCommand, string>
{
  constructor(
    private readonly articleRepository: ArticleRepository,
    private readonly channelAdaptationRepository: ChannelAdaptationRepository,
    private readonly adaptationVersionRepository: AdaptationVersionRepository,
    private readonly adaptationGenerator: AdaptationGeneratorPort,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: GenerateAdaptationCommand): Promise<string> {
    const adaptation = await this.channelAdaptationRepository.findById(command.adaptationId);

    if (!adaptation || adaptation.articleId !== command.articleId) {
      throw new Error(`Adaptation ${command.adaptationId} not found in article ${command.articleId}`);
    }

    const article = await this.articleRepository.findById(command.articleId);

    if (!article) {
      throw new Error(`Article ${command.articleId} not found`);
    }

    const adaptedContent = await this.adaptationGenerator.generate({
      originalContent: article.original.content,
      sourceLanguage: article.original.language,
      channelId: adaptation.channelId,
      displayName: adaptation.displayName,
      promptInstructions: adaptation.promptInstructions,
    });

    const version = AdaptationVersion.create({
      adaptationId: adaptation.id,
      content: adaptedContent,
      kind: 'generated',
      sourceVersionId: adaptation.selectedVersionId,
    });

    await this.adaptationVersionRepository.save(version);
    adaptation.markGenerated(version.id, adaptedContent);

    await this.channelAdaptationRepository.save(adaptation);
    this.eventBus.publishAll(adaptation.pullEvents());

    return adaptedContent;
  }
}
