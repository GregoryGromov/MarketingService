export interface PublishTelegramMessageParams {
    language: string;
    text: string;
}
export interface PublishTelegramMessageResult {
    chatId: string;
    messageId: number;
}
export declare abstract class TelegramPublisherPort {
    abstract publishMessage(params: PublishTelegramMessageParams): Promise<PublishTelegramMessageResult>;
}
//# sourceMappingURL=telegram-publisher.port.d.ts.map