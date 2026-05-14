import { Inject, Injectable } from '@nestjs/common';
import {
  CampaignFlowTransactionPort,
  ApprovalItem,
  type Campaign,
  type CampaignFlowTransactionContext,
  type PlannedPublication,
} from '@marketing-service/project-management';
import {
  PublicationOutcomePort,
  type SyncPublishingLinkRemovedParams,
  type SyncPublicationOutcomeParams,
} from '@marketing-service/publishing';

function buildPublishingFailureTitle(params: {
  channel: string;
  language: string;
}): string {
  return `Publishing failed for ${params.channel} ${params.language.toUpperCase()}`;
}

@Injectable()
export class PublicationOutcomeDrizzlePort extends PublicationOutcomePort {
  constructor(
    @Inject(CampaignFlowTransactionPort)
    private readonly transaction: CampaignFlowTransactionPort,
  ) {
    super();
  }

  async syncPublicationOutcome(params: SyncPublicationOutcomeParams): Promise<void> {
    if (!params.plannedPublicationId) {
      return;
    }
    const plannedPublicationId = params.plannedPublicationId;

    await this.transaction.run(
      async ({
        approvalItemRepository,
        campaignRepository,
        plannedPublicationRepository,
      }) => {
        const plannedPublication = await plannedPublicationRepository.findById(
          plannedPublicationId,
        );
        if (!plannedPublication) {
          throw new Error(
            `Planned publication ${plannedPublicationId} not found for publication ${params.publicationId}`,
          );
        }

        const campaign = await campaignRepository.findById(plannedPublication.campaignId);
        if (!campaign) {
          throw new Error(
            `Campaign ${plannedPublication.campaignId} not found for planned publication ${plannedPublication.id}`,
          );
        }

        const pendingPublishingIssues = (
          await approvalItemRepository.findByCampaignIdAndStatus(campaign.id, 'pending')
        ).filter(
          (item) =>
            item.type === 'publishing_exception' &&
            item.plannedPublicationId === plannedPublication.id,
        );

        if (params.status === 'failed') {
          plannedPublication.markFailed();

          if (pendingPublishingIssues.length === 0) {
            const approvalItem = ApprovalItem.create({
              projectId: campaign.projectId,
              campaignId: campaign.id,
              plannedPublicationId: plannedPublication.id,
              artifactType: 'publication',
              artifactId: params.publicationId,
              type: 'publishing_exception',
              severity: 'high',
              title: buildPublishingFailureTitle({
                channel: plannedPublication.channel,
                language: plannedPublication.language,
              }),
              details: {
                publicationId: params.publicationId,
                publishAt: params.publishAt,
                externalAccountRef: params.externalAccountRef,
                externalPostId: params.externalPostId,
                errorMessage: params.errorMessage,
              },
            });

            await approvalItemRepository.save(approvalItem);
          }
        } else if (params.status === 'published') {
          plannedPublication.markPublished();
          await this.resolveApprovalItems(approvalItemRepository, pendingPublishingIssues);
        } else if (params.status === 'scheduled' || params.status === 'publishing') {
          plannedPublication.markPublicationScheduled();
        } else {
          throw new Error(
            `Unsupported publication status "${params.status}" for publication ${params.publicationId}`,
          );
        }

        await plannedPublicationRepository.save(plannedPublication);
        await this.updateCampaignStatus({
          approvalItemRepository,
          campaignRepository,
          plannedPublicationRepository,
          campaign,
        });
      },
    );
  }

  async syncPublishingLinkRemoved(
    params: SyncPublishingLinkRemovedParams,
  ): Promise<void> {
    if (!params.plannedPublicationId) {
      return;
    }
    const plannedPublicationId = params.plannedPublicationId;

    await this.transaction.run(
      async ({
        approvalItemRepository,
        campaignRepository,
        plannedPublicationRepository,
      }) => {
        const plannedPublication = await plannedPublicationRepository.findById(
          plannedPublicationId,
        );
        if (!plannedPublication) {
          throw new Error(
            `Planned publication ${plannedPublicationId} not found for publishing link removal`,
          );
        }

        const campaign = await campaignRepository.findById(plannedPublication.campaignId);
        if (!campaign) {
          throw new Error(
            `Campaign ${plannedPublication.campaignId} not found for planned publication ${plannedPublication.id}`,
          );
        }

        plannedPublication.markReady();
        await plannedPublicationRepository.save(plannedPublication);

        const pendingPublishingIssues = (
          await approvalItemRepository.findByCampaignIdAndStatus(campaign.id, 'pending')
        ).filter(
          (item) =>
            item.type === 'publishing_exception' &&
            item.plannedPublicationId === plannedPublication.id,
        );

        await this.resolveApprovalItems(approvalItemRepository, pendingPublishingIssues);
        await this.updateCampaignStatus({
          approvalItemRepository,
          campaignRepository,
          plannedPublicationRepository,
          campaign,
        });
      },
    );
  }

  private async resolveApprovalItems(
    approvalItemRepository: CampaignFlowTransactionContext['approvalItemRepository'],
    items: ApprovalItem[],
  ): Promise<void> {
    for (const item of items) {
      item.resolve();
      await approvalItemRepository.save(item);
    }
  }

  private async updateCampaignStatus(params: {
    approvalItemRepository: CampaignFlowTransactionContext['approvalItemRepository'];
    campaignRepository: CampaignFlowTransactionContext['campaignRepository'];
    plannedPublicationRepository: CampaignFlowTransactionContext['plannedPublicationRepository'];
    campaign: Campaign;
  }): Promise<void> {
    const campaignPublications = await params.plannedPublicationRepository.findByCampaignId(
      params.campaign.id,
    );
    const pendingPublishingIssues = (
      await params.approvalItemRepository.findByCampaignIdAndStatus(
        params.campaign.id,
        'pending',
      )
    ).filter((item) => item.type === 'publishing_exception');

    if (this.allPublicationsTerminal(campaignPublications)) {
      params.campaign.complete();
    } else if (
      pendingPublishingIssues.length > 0 ||
      campaignPublications.some((publication) => publication.status === 'failed')
    ) {
      params.campaign.markNeedsAttention();
    } else if (this.hasPublishingActivity(campaignPublications)) {
      params.campaign.markPublishing();
    } else if (params.campaign.finalApprovedAt) {
      params.campaign.markApprovedForPublishing();
    } else if (campaignPublications.every((publication) => publication.status === 'ready')) {
      params.campaign.markReadyForFinalApproval();
    } else {
      params.campaign.markProducing();
    }

    await params.campaignRepository.save(params.campaign);
  }

  private allPublicationsTerminal(publications: PlannedPublication[]): boolean {
    return publications.every(
      (publication) =>
        publication.status === 'published' || publication.status === 'exported',
    );
  }

  private hasPublishingActivity(publications: PlannedPublication[]): boolean {
    return publications.some(
      (publication) =>
        publication.status === 'publication_scheduled' ||
        publication.status === 'published' ||
        publication.status === 'exported',
    );
  }
}
