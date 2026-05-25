import {
  type AdaptationId,
  ChannelAdaptationRepository,
  DiscordPublisherPort,
  TelegramPublisherPort,
  TranslationRepository,
  XPublisherPort,
} from '@marketing-service/editorial';
import { Inject, Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PublicationRepository } from '../domain/publication.repository.js';
import type { Publication } from '../domain/publication.aggregate.js';
import { PublicationOutcomePort } from '../ports/publication-outcome.port.js';

@Injectable()
export class PublicationSchedulerService implements OnModuleInit, OnModuleDestroy {
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    @Inject(PublicationRepository)
    private readonly publicationRepository: PublicationRepository,
    @Inject(ChannelAdaptationRepository)
    private readonly channelAdaptationRepository: ChannelAdaptationRepository,
    @Inject(TranslationRepository)
    private readonly translationRepository: TranslationRepository,
    @Inject(DiscordPublisherPort)
    private readonly discordPublisher: DiscordPublisherPort,
    @Inject(TelegramPublisherPort)
    private readonly telegramPublisher: TelegramPublisherPort,
    @Inject(XPublisherPort)
    private readonly xPublisher: XPublisherPort,
    @Inject(PublicationOutcomePort)
    private readonly publicationOutcomePort: PublicationOutcomePort,
  ) {}

  onModuleInit(): void {
    this.timer = setInterval(() => {
      void this.processDuePublications();
    }, 2_000);

    void this.processDuePublications();
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async processDuePublications(): Promise<void> {
    if (this.running) {
      return;
    }

    this.running = true;

    try {
      const duePublications = await this.publicationRepository.findDue(new Date(), 20);

      for (const publication of duePublications) {
        try {
          publication.markPublishing();
          await this.publicationRepository.save(publication);
          await this.syncPublicationOutcome(publication);

          await this.publish(publication);
          await this.publicationRepository.save(publication);
          await this.syncPublicationOutcome(publication);
        } catch (error) {
          publication.markFailed(error instanceof Error ? error.message : String(error));
          await this.publicationRepository.save(publication);
          await this.syncPublicationOutcome(publication);
        }
      }
    } finally {
      this.running = false;
    }
  }

  private async publish(publication: {
    adaptationId: AdaptationId;
    channelId: string;
    targetLanguage: string;
    markPublished: (params: { telegramChatId: string; telegramMessageId: string }) => void;
  }): Promise<void> {
    const text = await this.resolvePublishableText(
      publication.adaptationId,
      publication.targetLanguage,
      publication.channelId,
    );

    if (publication.channelId === 'channel_telegram') {
      const published = await this.telegramPublisher.publishMessage({
        language: publication.targetLanguage,
        text,
      });

      publication.markPublished({
        telegramChatId: published.chatId,
        telegramMessageId: String(published.messageId),
      });
      return;
    }

    if (publication.channelId === 'channel_discord') {
      const published = await this.discordPublisher.publishMessage({ text });
      const discordAccountRef =
        published.guildId && published.channelId
          ? `${published.guildId}/${published.channelId}`
          : published.channelId ?? 'discord-webhook';

      publication.markPublished({
        telegramChatId: discordAccountRef,
        telegramMessageId: published.messageId ?? 'discord-message',
      });
      return;
    }

    if (publication.channelId === 'channel_x') {
      const published = await this.xPublisher.publishMessage({ text });

      publication.markPublished({
        telegramChatId: published.screenName ?? 'x-user',
        telegramMessageId: published.tweetId,
      });
      return;
    }

    if (publication.channelId === 'channel_blog') {
      publication.markPublished({
        telegramChatId: 'blog',
        telegramMessageId: `blog-${publication.adaptationId}-${publication.targetLanguage}`,
      });
      return;
    }

    throw new Error(`Channel ${publication.channelId} is not supported for scheduled publishing`);
  }

  private async resolvePublishableText(
    adaptationId: AdaptationId,
    targetLanguage: string,
    expectedChannelId: string,
  ): Promise<string> {
    const adaptation = await this.channelAdaptationRepository.findById(adaptationId);

    if (!adaptation) {
      throw new Error(`Adaptation ${adaptationId} not found`);
    }

    if (adaptation.channelId !== expectedChannelId) {
      throw new Error(
        `Adaptation ${adaptation.id} belongs to ${adaptation.channelId} and cannot be published to ${expectedChannelId}`,
      );
    }

    if (targetLanguage.toLowerCase() === adaptation.sourceLanguage.toLowerCase()) {
      if (adaptation.status !== 'approved' || !adaptation.adaptedContent) {
        throw new Error(`Adaptation ${adaptation.id} is not approved for publishing`);
      }

      return adaptation.adaptedContent;
    }

    const translation = await this.translationRepository.findByAdaptationIdAndTargetLanguage(
      adaptation.id,
      targetLanguage,
    );

    if (!translation) {
      throw new Error(`Translation ${targetLanguage} not found for adaptation ${adaptation.id}`);
    }

    if (translation.status !== 'approved' || !translation.translatedContent) {
      throw new Error(
        `Translation ${translation.id} (${targetLanguage}) is not approved for publishing`,
      );
    }

    return translation.translatedContent;
  }

  private async syncPublicationOutcome(publication: Publication): Promise<void> {
    await this.publicationOutcomePort.syncPublicationOutcome({
      publicationId: publication.id,
      plannedPublicationId: publication.plannedPublicationId,
      status: publication.status,
      publishAt: publication.publishAt,
      externalAccountRef: publication.telegramChatId,
      externalPostId: publication.telegramMessageId,
      publishedAt: publication.publishedAt,
      errorMessage: publication.errorMessage,
    });
  }
}
