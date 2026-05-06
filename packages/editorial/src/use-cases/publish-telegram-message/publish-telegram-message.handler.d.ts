import { type ICommandHandler } from '@nestjs/cqrs';
import { ChannelAdaptationRepository } from '../../domain/channel-adaptation.repository.js';
import { TranslationRepository } from '../../domain/translation.repository.js';
import { TelegramPublisherPort, type PublishTelegramMessageResult } from '../../ports/telegram-publisher.port.js';
import { PublishTelegramMessageCommand } from './publish-telegram-message.command.js';
export declare class PublishTelegramMessageHandler implements ICommandHandler<PublishTelegramMessageCommand, PublishTelegramMessageResult> {
    private readonly channelAdaptationRepository;
    private readonly translationRepository;
    private readonly telegramPublisher;
    constructor(channelAdaptationRepository: ChannelAdaptationRepository, translationRepository: TranslationRepository, telegramPublisher: TelegramPublisherPort);
    execute(command: PublishTelegramMessageCommand): Promise<PublishTelegramMessageResult>;
}
//# sourceMappingURL=publish-telegram-message.handler.d.ts.map