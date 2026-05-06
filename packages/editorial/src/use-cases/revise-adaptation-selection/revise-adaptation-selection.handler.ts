import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { AdaptationVersion } from '../../domain/adaptation-version.entity.js';
import { AdaptationVersionRepository } from '../../domain/adaptation-version.repository.js';
import { ChannelAdaptationRepository } from '../../domain/channel-adaptation.repository.js';
import { EventBus } from '@nestjs/cqrs';
import { AdaptationGeneratorPort } from '../../ports/adaptation-generator.port.js';
import { ReviseAdaptationSelectionCommand } from './revise-adaptation-selection.command.js';

@CommandHandler(ReviseAdaptationSelectionCommand)
export class ReviseAdaptationSelectionHandler
  implements ICommandHandler<ReviseAdaptationSelectionCommand, string>
{
  constructor(
    private readonly channelAdaptationRepository: ChannelAdaptationRepository,
    private readonly adaptationVersionRepository: AdaptationVersionRepository,
    private readonly adaptationGenerator: AdaptationGeneratorPort,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ReviseAdaptationSelectionCommand): Promise<string> {
    const adaptation = await this.channelAdaptationRepository.findById(command.adaptationId);

    if (!adaptation || adaptation.articleId !== command.articleId) {
      throw new Error(`Adaptation ${command.adaptationId} not found in article ${command.articleId}`);
    }

    if (!command.selectedText.trim()) {
      throw new Error('Selected text is required');
    }

    if (!command.instruction.trim()) {
      throw new Error('Instruction is required');
    }

    const revisedContent = await this.adaptationGenerator.reviseSelection({
      fullContent: command.currentContent,
      selectedText: command.selectedText,
      sourceLanguage: adaptation.sourceLanguage,
      channelId: adaptation.channelId,
      displayName: adaptation.displayName,
      promptInstructions: adaptation.promptInstructions,
      instruction: command.instruction,
    });

    const version = AdaptationVersion.create({
      adaptationId: adaptation.id,
      content: revisedContent,
      kind: 'ai_revision',
      sourceVersionId: adaptation.selectedVersionId,
      meta: {
        instruction: command.instruction,
        selectedText: command.selectedText,
      },
    });

    await this.adaptationVersionRepository.save(version);
    adaptation.edit(version.id, revisedContent);
    await this.channelAdaptationRepository.save(adaptation);
    this.eventBus.publishAll(adaptation.pullEvents());

    return revisedContent;
  }
}
