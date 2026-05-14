import { Inject } from '@nestjs/common';
import { Article, ArticleSourceVersion } from '@marketing-service/editorial';
import { CommandHandler, EventBus, type ICommandHandler } from '@nestjs/cqrs';
import { CampaignArtifact } from '../../domain/campaign-artifact.entity.js';
import { Campaign } from '../../domain/campaign.aggregate.js';
import { CampaignFlowTransactionPort } from '../../ports/campaign-flow-transaction.port.js';
import { AttachCampaignSourceCommand } from './attach-campaign-source.command.js';

const CANONICAL_SOURCE_ARTICLE_ROLE = 'canonical_source_article';

export interface AttachCampaignSourceResult {
  articleId: string;
  sourceVersionId: string;
  artifactId: string;
}

@CommandHandler(AttachCampaignSourceCommand)
export class AttachCampaignSourceHandler
  implements ICommandHandler<AttachCampaignSourceCommand, AttachCampaignSourceResult>
{
  constructor(
    @Inject(CampaignFlowTransactionPort)
    private readonly transaction: CampaignFlowTransactionPort,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: AttachCampaignSourceCommand): Promise<AttachCampaignSourceResult> {
    let campaign!: Campaign;
    let article!: Article;
    let sourceVersion!: ArticleSourceVersion;
    let artifact!: CampaignArtifact;

    await this.transaction.run(
      async ({
        campaignRepository,
        campaignArtifactRepository,
        articleRepository,
        articleSourceVersionRepository,
      }) => {
        const existingCampaign = await campaignRepository.findById(command.campaignId as never);
        if (!existingCampaign) {
          throw new Error(`Campaign ${command.campaignId} not found`);
        }
        campaign = existingCampaign;

        if (campaign.sourceArticleId) {
          throw new Error(`Campaign ${command.campaignId} already has a source article`);
        }

        const existingArtifacts = await campaignArtifactRepository.findByCampaignIdAndRole(
          campaign.id,
          CANONICAL_SOURCE_ARTICLE_ROLE,
        );
        if (existingArtifacts.length > 0) {
          throw new Error(`Campaign ${command.campaignId} already has a canonical source artifact`);
        }

        article = Article.create({
          projectId: campaign.projectId,
          content: command.content,
          language: command.language,
        });

        sourceVersion = ArticleSourceVersion.create({
          articleId: article.id,
          content: command.content,
          language: command.language,
          kind: 'original',
          meta: {
            campaignId: campaign.id,
            source: 'campaign_attach',
          },
        });

        artifact = CampaignArtifact.create({
          campaignId: campaign.id,
          artifactType: 'article',
          artifactId: article.id,
          role: CANONICAL_SOURCE_ARTICLE_ROLE,
        });

        campaign.attachSourceArticle(article.id);

        await articleRepository.save(article);
        await articleSourceVersionRepository.save(sourceVersion);
        await campaignArtifactRepository.save(artifact);
        await campaignRepository.save(campaign);
      },
    );

    this.eventBus.publishAll(article.pullEvents());
    this.eventBus.publishAll(campaign.pullEvents());

    return {
      articleId: article.id,
      sourceVersionId: sourceVersion.id,
      artifactId: artifact.id,
    };
  }
}
