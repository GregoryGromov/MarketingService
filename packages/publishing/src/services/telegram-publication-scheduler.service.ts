import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  type AdaptationId,
  type ArticleId,
  ArticleRepository,
  ChannelAdaptationRepository,
  DiscordPublisherPort,
  TelegramPublisherPort,
  TranslationRepository,
  XPublisherPort,
} from '@marketing-service/editorial';
import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import type { Publication } from '../domain/publication.aggregate.js';
import { PublicationRepository } from '../domain/publication.repository.js';
import {
  BlogPublisherPort,
  type PublishBlogArticleTranslation,
} from '../ports/blog-publisher.port.js';
import { PublicationOutcomePort } from '../ports/publication-outcome.port.js';

@Injectable()
export class PublicationSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PublicationSchedulerService.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    @Inject(PublicationRepository)
    private readonly publicationRepository: PublicationRepository,
    @Inject(ChannelAdaptationRepository)
    private readonly channelAdaptationRepository: ChannelAdaptationRepository,
    @Inject(ArticleRepository)
    private readonly articleRepository: ArticleRepository,
    @Inject(TranslationRepository)
    private readonly translationRepository: TranslationRepository,
    @Inject(DiscordPublisherPort)
    private readonly discordPublisher: DiscordPublisherPort,
    @Inject(TelegramPublisherPort)
    private readonly telegramPublisher: TelegramPublisherPort,
    @Inject(XPublisherPort)
    private readonly xPublisher: XPublisherPort,
    @Inject(BlogPublisherPort)
    private readonly blogPublisher: BlogPublisherPort,
    @Inject(PublicationOutcomePort)
    private readonly publicationOutcomePort: PublicationOutcomePort,
  ) {}

  onModuleInit(): void {
    if (process.env.PUBLICATION_SCHEDULER_ENABLED !== 'true') {
      this.logger.log(
        'Publication scheduler disabled. Set PUBLICATION_SCHEDULER_ENABLED=true to enable it.',
      );
      return;
    }

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
      const processedPublicationIds = new Set<string>();

      for (const blogGroup of this.groupBlogPublications(duePublications)) {
        for (const publication of blogGroup) {
          processedPublicationIds.add(publication.id);
        }

        try {
          for (const publication of blogGroup) {
            publication.markPublishing();
            await this.publicationRepository.save(publication);
            await this.syncPublicationOutcome(publication);
          }

          await this.publishBlogGroup(blogGroup);

          for (const publication of blogGroup) {
            await this.publicationRepository.save(publication);
            await this.syncPublicationOutcome(publication);
          }
        } catch (error) {
          for (const publication of blogGroup) {
            await this.markPublicationFailed(publication, error);
          }
        }
      }

      for (const publication of duePublications) {
        if (processedPublicationIds.has(publication.id)) {
          continue;
        }

        try {
          publication.markPublishing();
          await this.publicationRepository.save(publication);
          await this.syncPublicationOutcome(publication);

          await this.publish(publication);
          await this.publicationRepository.save(publication);
          await this.syncPublicationOutcome(publication);
        } catch (error) {
          await this.markPublicationFailed(publication, error);
        }
      }
    } catch (error) {
      this.logger.error('Failed to process due publications', error);
    } finally {
      this.running = false;
    }
  }

  private async markPublicationFailed(publication: Publication, error: unknown): Promise<void> {
    publication.markFailed(error instanceof Error ? error.message : String(error));
    try {
      await this.publicationRepository.save(publication);
      await this.syncPublicationOutcome(publication);
    } catch (saveError) {
      this.logger.error(`Failed to persist publication failure for ${publication.id}`, saveError);
    }
  }

  private async publish(publication: {
    id: string;
    articleId: ArticleId;
    adaptationId: AdaptationId;
    channelId: string;
    targetLanguage: string;
    markPublished: (params: { telegramChatId: string; telegramMessageId: string }) => void;
    publishingTarget: 'test' | 'production';
  }): Promise<void> {
    const text = await this.resolvePublishableText(
      publication.adaptationId,
      publication.targetLanguage,
      publication.channelId,
    );
    const imagePath = await this.resolvePublishableImagePath(
      publication.articleId,
      publication.channelId,
    );

    if (publication.channelId === 'channel_telegram') {
      const published = await this.telegramPublisher.publishMessage({
        language: publication.targetLanguage,
        text,
        imagePath,
        publishingTarget: publication.publishingTarget,
      });

      publication.markPublished({
        telegramChatId: published.chatId,
        telegramMessageId: String(published.messageId),
      });
      return;
    }

    if (publication.channelId === 'channel_discord') {
      const published = await this.discordPublisher.publishMessage({
        text,
        imagePath,
        publishingTarget: publication.publishingTarget,
      });
      const discordAccountRef =
        published.guildId && published.channelId
          ? `${published.guildId}/${published.channelId}`
          : (published.channelId ?? 'discord-webhook');

      publication.markPublished({
        telegramChatId: discordAccountRef,
        telegramMessageId: published.messageId ?? 'discord-message',
      });
      return;
    }

    if (publication.channelId === 'channel_x') {
      const published = await this.xPublisher.publishMessage({
        text,
        imagePath,
        publishingTarget: publication.publishingTarget,
        requestId: publication.id,
      });

      publication.markPublished({
        telegramChatId: published.screenName ?? 'x-user',
        telegramMessageId: published.tweetId,
      });
      return;
    }

    throw new Error(`Channel ${publication.channelId} is not supported for scheduled publishing`);
  }

  private groupBlogPublications(publications: Publication[]): Publication[][] {
    const groups = new Map<string, Publication[]>();
    for (const publication of publications) {
      if (publication.channelId !== 'channel_blog') {
        continue;
      }
      const group = groups.get(publication.articleId) ?? [];
      group.push(publication);
      groups.set(publication.articleId, group);
    }
    return [...groups.values()];
  }

  private async publishBlogGroup(publications: Publication[]): Promise<void> {
    const firstPublication = publications[0];
    if (!firstPublication) {
      return;
    }

    const article = await this.articleRepository.findById(firstPublication.articleId);
    if (!article) {
      throw new Error(`Article ${firstPublication.articleId} not found`);
    }

    const coverImageUrl = this.resolveBlogCoverImageUrl(article.defaultCoverUrl);
    const fallbackTitle = extractMarkdownTitle(article.original.content) ?? 'Blog article';
    const translationsByLocale = new Map<string, PublishBlogArticleTranslation>();

    for (const publication of publications) {
      const bodyMd = await this.resolvePublishableText(
        publication.adaptationId,
        publication.targetLanguage,
        publication.channelId,
      );
      const locale = normalizeBlogLocale(publication.targetLanguage);
      translationsByLocale.set(locale, {
        locale,
        title: extractMarkdownTitle(bodyMd) ?? fallbackTitle,
        excerpt: extractExcerpt(bodyMd),
        bodyMd,
      });
    }

    const translations = [...translationsByLocale.values()];
    if (translations.length === 0) {
      throw new Error('Blog publishing requires at least one translation');
    }

    const result = await this.blogPublisher.publishArticle({
      articleId: deterministicUuid(`editorial-blog:${article.id}`),
      status: 'published',
      coverImageUrl,
      translations,
    });

    for (const publication of publications) {
      const locale = normalizeBlogLocale(publication.targetLanguage);
      publication.markPublished({
        telegramChatId: 'blog',
        telegramMessageId:
          result.localizedUrls[locale] ??
          result.url ??
          `blog-${result.articleId}-${publication.targetLanguage}`,
      });
    }
  }

  private resolveBlogCoverImageUrl(defaultCoverUrl: string | null): string {
    const value = defaultCoverUrl?.trim();
    if (value?.startsWith('https://')) {
      return value;
    }

    const fallback = process.env.BLOG_DEFAULT_COVER_IMAGE_URL?.trim();
    if (fallback?.startsWith('https://')) {
      return fallback;
    }

    throw new Error(
      'Blog publishing requires an HTTPS cover image URL. Set article.defaultCoverUrl or BLOG_DEFAULT_COVER_IMAGE_URL.',
    );
  }

  private async resolvePublishableImagePath(
    articleId: ArticleId,
    channelId: string,
  ): Promise<string | null> {
    const article = await this.articleRepository.findById(articleId);
    const originalPath = article?.defaultCoverUrl?.trim();
    if (!originalPath) {
      return null;
    }

    const variantPath = join(dirname(originalPath), `${channelId}.jpg`);
    if (existsSync(variantPath)) {
      return variantPath;
    }

    return existsSync(originalPath) ? originalPath : null;
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

function deterministicUuid(input: string): string {
  const hex = createHash('sha256').update(input).digest('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `5${hex.slice(13, 16)}`,
    ((Number.parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80).toString(16) + hex.slice(18, 20),
    hex.slice(20, 32),
  ].join('-');
}

function normalizeBlogLocale(value: string): string {
  const normalized = value.trim().toLowerCase().replace('_', '-');
  const aliases: Record<string, string> = {
    english: 'en',
    filipino: 'tl',
    indonesian: 'id',
    japanese: 'ja',
    javanese: 'jv',
    pidgin: 'pcm',
    portuguese: 'pt',
    punjabi: 'pa',
    tagalog: 'tl',
    yoruba: 'yo',
  };
  const locale = aliases[normalized] ?? normalized;
  const supported = new Set([
    'en',
    'pt',
    'id',
    'es',
    'vi',
    'ur',
    'tl',
    'pcm',
    'ha',
    'pa',
    'yo',
    'jv',
    'ps',
    'zu',
    'tr',
    'ar',
    'ru',
    'hi',
    'ja',
    'ko',
    'fr',
    'de',
    'it',
    'nl',
    'ms',
    'th',
    'af',
    'xh',
    'ig',
    'pl',
    'ro',
  ]);
  if (!supported.has(locale)) {
    throw new Error(`Unsupported Blog locale: ${value}`);
  }
  return locale;
}

function extractMarkdownTitle(markdown: string): string | null {
  const lines = markdown.split(/\r?\n/);
  for (const line of lines) {
    const cleaned = line
      .replace(/^#{1,6}\s+/, '')
      .replace(/[*_`[\]()]/g, '')
      .trim();
    if (cleaned) {
      return cleaned.slice(0, 200);
    }
  }
  return null;
}

function extractExcerpt(markdown: string): string | null {
  const text = markdown
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/!\[[^\]]*]\([^)]*\)/g, '')
    .replace(/\[[^\]]*]\([^)]*\)/g, '')
    .replace(/[*_`>#-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text ? text.slice(0, 500) : null;
}
