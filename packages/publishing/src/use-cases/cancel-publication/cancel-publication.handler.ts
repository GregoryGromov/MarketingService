import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ArticleRepository } from '@marketing-service/editorial';
import { PublicationRepository } from '../../domain/publication.repository.js';
import { CancelPublicationCommand } from './cancel-publication.command.js';

@CommandHandler(CancelPublicationCommand)
export class CancelPublicationHandler
  implements ICommandHandler<CancelPublicationCommand, { id: string; status: 'cancelled' }>
{
  constructor(
    @Inject(PublicationRepository)
    private readonly publicationRepository: PublicationRepository,
    @Inject(ArticleRepository)
    private readonly articleRepository: ArticleRepository,
  ) {}

  async execute(command: CancelPublicationCommand): Promise<{ id: string; status: 'cancelled' }> {
    const publication = await this.publicationRepository.findById(command.publicationId);
    if (!publication) {
      throw new Error(`Publication ${command.publicationId} not found`);
    }

    if (publication.status === 'published') {
      throw new Error('Published publication cannot be cancelled');
    }

    const article = await this.articleRepository.findById(publication.articleId);
    if (!article) {
      throw new Error(`Article ${publication.articleId} not found`);
    }

    article.removePublicationIntent(publication.channelId, publication.targetLanguage);

    await this.articleRepository.save(article);
    await this.publicationRepository.deleteById(publication.id);

    return {
      id: publication.id,
      status: 'cancelled',
    };
  }
}
