import { describe, expect, it } from 'vitest';
import { ApprovalItem, Campaign, PlannedPublication } from '../../index.js';
import { ApproveCampaignForPublishingCommand } from './approve-campaign-for-publishing.command.js';
import { ApproveCampaignForPublishingHandler } from './approve-campaign-for-publishing.handler.js';
import { createCampaignTestContext } from '../../testing/campaign-test-harness.js';
import {
  attachApprovedAdaptation,
  attachSourceToCampaign,
  createPresetFixture,
  createProjectFixture,
} from '../../testing/campaign-test-fixtures.js';

async function seedReadyCampaign(context: ReturnType<typeof createCampaignTestContext>) {
  const project = createProjectFixture();
  const preset = createPresetFixture();
  const campaign = Campaign.create({
    projectId: project.id,
    presetId: preset.id,
    name: 'Final Approval Campaign',
    startDate: new Date('2026-05-14T00:00:00.000Z'),
    sourceLanguage: 'en',
  });
  campaign.markReadyForFinalApproval();

  const plannedPublication = PlannedPublication.create({
    campaignId: campaign.id,
    presetPublicationId: preset.publications[0]?.id ?? null,
    dayOffset: 0,
    localTime: '09:00',
    scheduledFor: new Date('2026-05-14T09:00:00.000Z'),
    channel: 'channel_telegram',
    language: 'en',
    publicationType: 'post',
    style: 'insight',
    publishMode: 'auto_publish',
  });
  plannedPublication.markReady();

  await context.repositories.projects.save(project);
  await context.repositories.presets.save(preset);
  await context.repositories.campaigns.save(campaign);
  await context.repositories.plannedPublications.save(plannedPublication);
    const { article } = await attachSourceToCampaign(context, campaign, {
    content: 'Final source article',
    language: 'en',
  });
  const { adaptation } = await attachApprovedAdaptation(context, {
    campaign,
    article,
    plannedPublication,
    content: 'Approved adaptation for publishing',
    sourceLanguage: 'en',
  });

  return { project, preset, campaign, plannedPublication, article, adaptation };
}

describe('ApproveCampaignForPublishingHandler', () => {
  it('blocks final approval while inbox items are still pending', async () => {
    const context = createCampaignTestContext();
    const { campaign, plannedPublication, adaptation } = await seedReadyCampaign(context);

    const approvalItem = ApprovalItem.create({
      projectId: campaign.projectId,
      campaignId: campaign.id,
      plannedPublicationId: plannedPublication.id,
      artifactType: 'adaptation',
      artifactId: adaptation.id,
      type: 'adaptation_quality_exception',
      severity: 'high',
      title: 'Manual review required',
      details: {
        reason: 'Needs approval',
      },
    });
    await context.repositories.approvals.save(approvalItem);

    const handler = new ApproveCampaignForPublishingHandler(
      context.transaction,
      context.eventBus,
    );

    await expect(
      handler.execute(new ApproveCampaignForPublishingCommand(campaign.id)),
    ).rejects.toThrow(/pending approval inbox items/i);
  });

  it('creates scheduled publications only after final approval passes all gating rules', async () => {
    const context = createCampaignTestContext();
    const { campaign, plannedPublication } = await seedReadyCampaign(context);

    const handler = new ApproveCampaignForPublishingHandler(
      context.transaction,
      context.eventBus,
    );
    const result = await handler.execute(
      new ApproveCampaignForPublishingCommand(campaign.id),
    );

    const updatedCampaign = await context.repositories.campaigns.findById(campaign.id);
    const updatedPublication = await context.repositories.plannedPublications.findById(
      plannedPublication.id,
    );
    const scheduledRecord = await context.publishing.findScheduledPublication(
      plannedPublication.id,
    );

    expect(result.scheduledPublicationIds).toHaveLength(1);
    expect(result.exportPlanIds).toHaveLength(0);
    expect(updatedCampaign?.status).toBe('publishing');
    expect(updatedCampaign?.finalApprovedAt).not.toBeNull();
    expect(updatedPublication?.status).toBe('publication_scheduled');
    expect(scheduledRecord).not.toBeNull();
    expect(scheduledRecord?.plannedPublicationId).toBe(plannedPublication.id);
  });
});
