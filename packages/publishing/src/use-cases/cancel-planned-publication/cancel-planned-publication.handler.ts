import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ArticleRepository } from '@marketing-service/editorial';
import { PublicationRepository } from '../../domain/publication.repository.js';
import { CancelPlannedPublicationCommand } from './cancel-planned-publication.command.js';

@CommandHandler(CancelPlannedPublicationCommand)
export class CancelPlannedPublicationHandler
  implements ICommandHandler<CancelPlannedPublicationCommand, { status: 'cancelled' }>
{
  constructor(
    @Inject(ArticleRepository)
    private readonly articleRepository: ArticleRepository,
    @Inject(PublicationRepository)
    private readonly publicationRepository: PublicationRepository,
  ) {}

  async execute(command: CancelPlannedPublicationCommand): Promise<{ status: 'cancelled' }> {
    const article = await this.articleRepository.findById(command.articleId);
    if (!article) {
      throw new Error(`Article ${command.articleId} not found`);
    }

    const targetLanguage = command.targetLanguage.trim().toLowerCase();
    const publications = await this.publicationRepository.findByArticleId(command.articleId);
    const publication = publications.find((item) =>
      item.channelId === command.channelId &&
      item.targetLanguage.toLowerCase() === targetLanguage,
    ) ?? null;

    if (publication?.status === 'published') {
      throw new Error('Published publication cannot be cancelled');
    }

    if (publication?.status === 'publishing') {
      throw new Error('Publication is being delivered right now and cannot be cancelled');
    }

    article.removePublicationIntent(command.channelId, targetLanguage);
    await this.articleRepository.save(article);

    if (publication) {
      await this.publicationRepository.deleteById(publication.id);
    }

    return { status: 'cancelled' };
  }
}
