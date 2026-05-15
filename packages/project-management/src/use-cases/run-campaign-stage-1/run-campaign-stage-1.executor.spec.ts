import { describe, expect, it } from 'vitest';
import { Campaign, PlannedPublication, WorkflowRun } from '../../index.js';
import { RunCampaignStage1Executor } from './run-campaign-stage-1.handler.js';
import { createCampaignTestContext } from '../../testing/campaign-test-harness.js';
import {
  attachSourceToCampaign,
  createPresetFixture,
  createProjectFixture,
} from '../../testing/campaign-test-fixtures.js';

function failedStage1QualityResult() {
  return {
    outcome: 'failed' as const,
    summary: 'Needs revision',
    reasons: [
      {
        code: 'too_literal',
        severity: 'high' as const,
        message: 'Content is too literal',
        excerpt: null,
        suggestion: 'Rewrite for channel tone',
      },
    ],
    suggestedFix: {
      summary: 'Make it more native',
      instructions: ['Rewrite the hook', 'Shorten the CTA'],
    },
  };
}

function passedStage1QualityResult() {
  return {
    outcome: 'passed' as const,
    summary: 'Looks good',
    reasons: [],
    suggestedFix: null,
  };
}

describe('RunCampaignStage1Executor', () => {
  it('retries failed adaptations and moves the publication into translating on success', async () => {
    const context = createCampaignTestContext();
    const project = createProjectFixture();
    const preset = createPresetFixture();
    const campaign = Campaign.create({
      projectId: project.id,
      presetId: preset.id,
      name: 'Stage 1 Retry',
      startDate: new Date('2026-05-14T00:00:00.000Z'),
      sourceLanguage: 'en',
    });
    campaign.markProducing();

    const plannedPublication = PlannedPublication.create({
      campaignId: campaign.id,
      presetPublicationId: preset.publications[0]?.id ?? null,
      dayOffset: 0,
      localTime: '09:00',
      scheduledFor: new Date('2026-05-14T09:00:00.000Z'),
      channel: 'channel_telegram',
      language: 'es',
      publicationType: 'post',
      style: 'insight',
      publishMode: 'auto_publish',
    });
    const workflowRun = WorkflowRun.create({
      campaignId: campaign.id,
      currentStep: 'stage_1_adaptation',
    });

    await context.repositories.projects.save(project);
    await context.repositories.presets.save(preset);
    await context.repositories.campaigns.save(campaign);
    await context.repositories.plannedPublications.save(plannedPublication);
    await context.repositories.workflowRuns.save(workflowRun);
    const { article } = await attachSourceToCampaign(context, campaign, {
      content: 'Long source article',
      language: 'en',
    });

    context.aiGateway.adaptationGenerationResults.push({
      content: 'First draft adaptation',
    });
    context.aiGateway.adaptationRevisionResults.push({
      content: 'Improved adaptation after retry',
    });
    context.aiGateway.adaptationQualityResults.push(
      failedStage1QualityResult(),
      passedStage1QualityResult(),
    );

    const executor = new RunCampaignStage1Executor(
      context.transaction,
      context.aiGateway,
      context.eventBus,
    );
    const result = await executor.execute(campaign.id, workflowRun.id);

    const updatedCampaign = await context.repositories.campaigns.findById(campaign.id);
    const updatedWorkflowRun = await context.repositories.workflowRuns.findById(workflowRun.id);
    const updatedPublication = await context.repositories.plannedPublications.findById(
      plannedPublication.id,
    );
    const adaptations = await context.repositories.adaptations.findByArticleId(article.id);
    const adaptation = adaptations[0];
    const adaptationVersions = adaptation
      ? await context.repositories.adaptationVersions.findByAdaptationId(adaptation.id)
      : [];
    const qualityChecks = await context.repositories.qualityChecks.findByCampaignId(campaign.id);

    expect(result.outcome).toBe('completed');
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      attempts: 2,
      status: 'translating',
      approvalItemId: null,
    });
    expect(updatedCampaign?.status).toBe('producing');
    expect(updatedWorkflowRun?.status).toBe('completed');
    expect(updatedPublication?.status).toBe('translating');
    expect(adaptation?.status).toBe('approved');
    expect(adaptationVersions).toHaveLength(2);
    expect(qualityChecks).toHaveLength(2);
  });

  it('creates an approval item after exhausting all Stage 1 retries', async () => {
    const context = createCampaignTestContext();
    const project = createProjectFixture();
    const preset = createPresetFixture();
    const campaign = Campaign.create({
      projectId: project.id,
      presetId: preset.id,
      name: 'Stage 1 Failure',
      startDate: new Date('2026-05-14T00:00:00.000Z'),
      sourceLanguage: 'en',
    });
    campaign.markProducing();

    const plannedPublication = PlannedPublication.create({
      campaignId: campaign.id,
      presetPublicationId: preset.publications[0]?.id ?? null,
      dayOffset: 0,
      localTime: '09:00',
      scheduledFor: new Date('2026-05-14T09:00:00.000Z'),
      channel: 'channel_x',
      language: 'en',
      publicationType: 'thread',
      style: 'bold',
      publishMode: 'auto_publish',
    });
    const workflowRun = WorkflowRun.create({
      campaignId: campaign.id,
      currentStep: 'stage_1_adaptation',
    });

    await context.repositories.projects.save(project);
    await context.repositories.presets.save(preset);
    await context.repositories.campaigns.save(campaign);
    await context.repositories.plannedPublications.save(plannedPublication);
    await context.repositories.workflowRuns.save(workflowRun);
    const { article } = await attachSourceToCampaign(context, campaign, {
      content: 'Another long source',
      language: 'en',
    });

    context.aiGateway.adaptationGenerationResults.push({
      content: 'Draft 1',
    });
    context.aiGateway.adaptationRevisionResults.push(
      { content: 'Draft 2' },
      { content: 'Draft 3' },
      { content: 'Draft 4' },
      { content: 'Draft 5' },
    );
    for (let index = 0; index < 5; index += 1) {
      context.aiGateway.adaptationQualityResults.push(failedStage1QualityResult());
    }

    const executor = new RunCampaignStage1Executor(
      context.transaction,
      context.aiGateway,
      context.eventBus,
    );
    const result = await executor.execute(campaign.id, workflowRun.id);

    const updatedCampaign = await context.repositories.campaigns.findById(campaign.id);
    const updatedWorkflowRun = await context.repositories.workflowRuns.findById(workflowRun.id);
    const updatedPublication = await context.repositories.plannedPublications.findById(
      plannedPublication.id,
    );
    const approvals = await context.repositories.approvals.findByCampaignId(campaign.id);
    const adaptations = await context.repositories.adaptations.findByArticleId(article.id);
    const adaptation = adaptations[0];
    const adaptationVersions = adaptation
      ? await context.repositories.adaptationVersions.findByAdaptationId(adaptation.id)
      : [];
    const qualityChecks = await context.repositories.qualityChecks.findByCampaignId(campaign.id);

    expect(result.outcome).toBe('needs_attention');
    expect(result.items[0]).toMatchObject({
      attempts: 5,
      status: 'stage_1_failed',
    });
    expect(updatedCampaign?.status).toBe('needs_attention');
    expect(updatedWorkflowRun?.status).toBe('failed');
    expect(updatedPublication?.status).toBe('stage_1_failed');
    expect(adaptationVersions).toHaveLength(5);
    expect(qualityChecks).toHaveLength(5);
    expect(approvals).toHaveLength(1);
    expect(approvals[0]).toMatchObject({
      type: 'adaptation_quality_exception',
      status: 'pending',
      plannedPublicationId: plannedPublication.id,
    });
  });
});
