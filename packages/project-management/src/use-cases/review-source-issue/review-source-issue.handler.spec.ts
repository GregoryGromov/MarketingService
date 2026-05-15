import { describe, expect, it } from 'vitest';
import { ApprovalItem, Campaign, PlannedPublication } from '../../index.js';
import { ReviewSourceIssueCommand } from './review-source-issue.command.js';
import { ReviewSourceIssueHandler } from './review-source-issue.handler.js';
import { createCampaignTestContext } from '../../testing/campaign-test-harness.js';
import {
  attachSourceToCampaign,
  createPresetFixture,
  createProjectFixture,
} from '../../testing/campaign-test-fixtures.js';

describe('ReviewSourceIssueHandler', () => {
  it('creates a new source version, updates the canonical article, and clears the blocked state', async () => {
    const context = createCampaignTestContext();
    const project = createProjectFixture();
    const preset = createPresetFixture();
    const campaign = Campaign.create({
      projectId: project.id,
      presetId: preset.id,
      name: 'Source Review Campaign',
      startDate: new Date('2026-05-14T00:00:00.000Z'),
      sourceLanguage: 'en',
    });
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

    plannedPublication.markSourceBlocked();

    await context.repositories.projects.save(project);
    await context.repositories.presets.save(preset);
    await context.repositories.campaigns.save(campaign);
    await context.repositories.plannedPublications.save(plannedPublication);

    const { article } = await attachSourceToCampaign(context, campaign, {
      content: 'Original source',
      language: 'en',
    });

    const approvalItem = ApprovalItem.create({
      projectId: project.id,
      campaignId: campaign.id,
      artifactType: 'article',
      artifactId: article.id,
      type: 'source_issue',
      severity: 'high',
      title: 'Source needs review',
      details: {
        summary: 'Fix the source',
      },
    });

    await context.repositories.approvals.save(approvalItem);

    const handler = new ReviewSourceIssueHandler(context.transaction, context.eventBus);
    const result = await handler.execute(
      new ReviewSourceIssueCommand(
        campaign.id,
        approvalItem.id,
        'manual_edit',
        'Rewritten canonical source',
        'en',
        'Approved by editor',
      ),
    );

    const updatedCampaign = await context.repositories.campaigns.findById(campaign.id);
    const updatedApprovalItem = await context.repositories.approvals.findById(approvalItem.id);
    const updatedArticle = await context.repositories.articles.findById(article.id);
    const sourceVersions = await context.repositories.articleSourceVersions.findByArticleId(
      article.id,
    );
    const updatedPublication = await context.repositories.plannedPublications.findById(
      plannedPublication.id,
    );

    expect(result.approvalItemStatus).toBe('resolved');
    expect(result.campaignStatus).toBe('producing');
    expect(result.sourceVersionId).not.toBeNull();

    expect(updatedCampaign?.status).toBe('producing');
    expect(updatedApprovalItem?.status).toBe('resolved');
    expect(updatedPublication?.status).toBe('pending');
    expect(updatedArticle?.original.content).toBe('Rewritten canonical source');
    expect(sourceVersions).toHaveLength(2);

    const latestVersion = [...sourceVersions].sort(
      (left, right) => left.createdAt.getTime() - right.createdAt.getTime(),
    )[1];

    expect(latestVersion?.kind).toBe('manual_edit');
    expect(latestVersion?.content).toBe('Rewritten canonical source');
    expect(latestVersion?.sourceVersionId).toBe(sourceVersions[0]?.id);
  });
});
