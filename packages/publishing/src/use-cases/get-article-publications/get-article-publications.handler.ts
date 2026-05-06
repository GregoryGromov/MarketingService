import { Inject } from '@nestjs/common';
import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import { PublicationRepository } from '../../domain/publication.repository.js';
import { GetArticlePublicationsQuery } from './get-article-publications.query.js';

export interface GetArticlePublicationsResultItem {
  id: string;
  articleId: string;
  adaptationId: string;
  channelId: string;
  displayName: string;
  targetLanguage: string;
  publishAt: Date;
  status: string;
  telegramChatId: string | null;
  telegramMessageId: string | null;
  publishedAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@QueryHandler(GetArticlePublicationsQuery)
export class GetArticlePublicationsHandler
  implements IQueryHandler<GetArticlePublicationsQuery, GetArticlePublicationsResultItem[]>
{
  constructor(
    @Inject(PublicationRepository)
    private readonly publicationRepository: PublicationRepository,
  ) {}

  async execute(query: GetArticlePublicationsQuery): Promise<GetArticlePublicationsResultItem[]> {
    const publications = await this.publicationRepository.findByArticleId(query.articleId);

    return publications.map((publication) => ({
      id: publication.id,
      articleId: publication.articleId,
      adaptationId: publication.adaptationId,
      channelId: publication.channelId,
      displayName: publication.displayName,
      targetLanguage: publication.targetLanguage,
      publishAt: publication.publishAt,
      status: publication.status,
      telegramChatId: publication.telegramChatId,
      telegramMessageId: publication.telegramMessageId,
      publishedAt: publication.publishedAt,
      errorMessage: publication.errorMessage,
      createdAt: publication.createdAt,
      updatedAt: publication.updatedAt,
    }));
  }
}
