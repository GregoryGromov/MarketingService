import { Inject } from '@nestjs/common';
import {
  Article,
  ArticleSourceVersion,
  type ArticleSourceVersionId,
  type ArticleSourceVersionKind,
} from '@marketing-service/editorial';
import { CommandHandler, EventBus, type ICommandHandler } from '@nestjs/cqrs';
import { ApprovalItem } from '../../domain/approval-item.aggregate.js';
import { Campaign } from '../../domain/campaign.aggregate.js';
import { CampaignFlowTransactionPort } from '../../ports/campaign-flow-transaction.port.js';
import { ReviewSourceIssueCommand } from './review-source-issue.command.js';

export interface ReviewSourceIssueResult {
  campaignStatus: string;
  approvalItemStatus: string;
  sourceVersionId: string | null;
}

function getLatestSourceVersionId(
  versions: { id: ArticleSourceVersionId; createdAt: Date }[],
): ArticleSourceVersionId | null {
  return [...versions].sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime()).at(-1)?.id ?? null;
}

@CommandHandler(ReviewSourceIssueCommand)
export class ReviewSourceIssueHandler
  implements ICommandHandler<ReviewSourceIssueCommand, ReviewSourceIssueResult>
{
  constructor(
    @Inject(CampaignFlowTransactionPort)
    private readonly transaction: CampaignFlowTransactionPort,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ReviewSourceIssueCommand): Promise<ReviewSourceIssueResult> {
    let approvalItem!: ApprovalItem;
    let campaign!: Campaign;
    let article: Article | null = null;
    let createdSourceVersionId: string | null = null;

    await this.transaction.run(
      async ({
        approvalItemRepository,
        campaignRepository,
        articleRepository,
        articleSourceVersionRepository,
        plannedPublicationRepository,
      }) => {
        const existingApprovalItem = await approvalItemRepository.findById(command.approvalItemId as never);
        if (!existingApprovalItem) {
          throw new Error(`Approval item ${command.approvalItemId} not found`);
        }
        approvalItem = existingApprovalItem;

        if (approvalItem.campaignId !== command.campaignId) {
          throw new Error(
            `Approval item ${command.approvalItemId} does not belong to campaign ${command.campaignId}`,
          );
        }

        if (approvalItem.type !== 'source_issue') {
          throw new Error(`Approval item ${command.approvalItemId} is not a source issue`);
        }

        if (approvalItem.status !== 'pending') {
          throw new Error(`Approval item ${command.approvalItemId} is already resolved`);
        }

        const existingCampaign = await campaignRepository.findById(command.campaignId as never);
        if (!existingCampaign) {
          throw new Error(`Campaign ${command.campaignId} not found`);
        }
        campaign = existingCampaign;

        if (!campaign.sourceArticleId) {
          throw new Error(`Campaign ${command.campaignId} has no attached source article`);
        }

        article = await articleRepository.findById(campaign.sourceArticleId as never);
        if (!article) {
          throw new Error(`Article ${campaign.sourceArticleId} not found`);
        }

        const plannedPublications = await plannedPublicationRepository.findByCampaignId(campaign.id);
        const sourceVersions = await articleSourceVersionRepository.findByArticleId(article.id);
        const latestSourceVersionId = getLatestSourceVersionId(sourceVersions);
        const currentLanguage =
          sourceVersions.at(-1)?.language ?? article.original.language ?? campaign.sourceLanguage;

        if (command.action === 'accept_fix' || command.action === 'manual_edit') {
          if (!command.content?.trim()) {
            throw new Error(`Action ${command.action} requires source content`);
          }

          const versionKind: ArticleSourceVersionKind =
            command.action === 'accept_fix' ? 'accepted_source' : 'manual_edit';

          const sourceVersion = ArticleSourceVersion.create({
            articleId: article.id,
            content: command.content,
            language: command.language ?? currentLanguage,
            kind: versionKind,
            sourceVersionId: latestSourceVersionId ?? null,
            meta: {
              approvalItemId: approvalItem.id,
              note: command.note ?? null,
              action: command.action,
            },
          });

          article.replaceOriginal(sourceVersion.content, sourceVersion.language, sourceVersion.createdAt);
          await articleRepository.save(article);
          await articleSourceVersionRepository.save(sourceVersion);
          createdSourceVersionId = sourceVersion.id;
        }

        if (command.action === 'block') {
          approvalItem.block();
          campaign.markNeedsAttention();
          plannedPublications.forEach((plannedPublication) => plannedPublication.markSourceBlocked());
        } else {
          approvalItem.resolve();
          campaign.markProducing();
          plannedPublications
            .filter((plannedPublication) => plannedPublication.status === 'source_blocked')
            .forEach((plannedPublication) => plannedPublication.markPending());
        }

        await approvalItemRepository.save(approvalItem);
        await campaignRepository.save(campaign);
        await plannedPublicationRepository.saveMany(plannedPublications);
      },
    );

    const updatedArticle = article as Article | null;
    if (updatedArticle && createdSourceVersionId) {
      this.eventBus.publishAll(updatedArticle.pullEvents());
    }
    const reviewedApprovalItem = approvalItem as ApprovalItem;
    const reviewedCampaign = campaign as Campaign;
    this.eventBus.publishAll(reviewedApprovalItem.pullEvents());
    this.eventBus.publishAll(reviewedCampaign.pullEvents());

    return {
      campaignStatus: reviewedCampaign.status,
      approvalItemStatus: reviewedApprovalItem.status,
      sourceVersionId: createdSourceVersionId,
    };
  }
}
