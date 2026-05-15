import { describe, expect, it } from 'vitest';
import { Campaign, PlannedPublication, WorkflowRun } from '../../index.js';
import { RunCampaignStage2Executor } from './run-campaign-stage-2.handler.js';
import { createCampaignTestContext } from '../../testing/campaign-test-harness.js';
import {
  attachApprovedAdaptation,
  createPresetFixture,
  createProjectFixture,
} from '../../testing/campaign-test-fixtures.js';
import { Article } from '@marketing-service/editorial';

function failedStage2QualityResult() {
  return {
    outcome: 'failed' as const,
    summary: 'Translation drifts from source',
    reasons: [
      {
        code: 'semantic_drift',
        severity: 'high' as const,
        message: 'Meaning changed',
        excerpt: null,
        suggestion: 'Stay closer to the source',
      },
    ],
    suggestedFix: {
      summary: 'Align the message',
      instructions: ['Restore the original claim', 'Keep the CTA short'],
    },
  };
}

function passedStage2QualityResult() {
  return {
    outcome: 'passed' as const,
    summary: 'Translation is faithful',
    reasons: [],
    suggestedFix: null,
  };
}

describe('RunCampaignStage2Executor', () => {
  it('retries translation fidelity checks until the publication becomes ready', async () => {
    const context = createCampaignTestContext();
    const project = createProjectFixture();
    const preset = createPresetFixture();
    const campaign = Campaign.create({
      projectId: project.id,
      presetId: preset.id,
      name: 'Stage 2 Retry',
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
    plannedPublication.markTranslating();

    const workflowRun = WorkflowRun.create({
      campaignId: campaign.id,
      currentStep: 'stage_2_translation',
    });
    const article = Article.create({
      projectId: project.id,
      content: 'Canonical article',
      language: 'en',
    });

    await context.repositories.projects.save(project);
    await context.repositories.presets.save(preset);
    await context.repositories.campaigns.save(campaign);
    await context.repositories.plannedPublications.save(plannedPublication);
    await context.repositories.workflowRuns.save(workflowRun);
    await context.repositories.articles.save(article);
    const { adaptation } = await attachApprovedAdaptation(context, {
      campaign,
      article,
      plannedPublication,
      content: 'Approved stage 1 adaptation',
      sourceLanguage: 'en',
    });

    context.aiGateway.translationGenerationResults.push({
      content: 'Primer borrador',
    });
    context.aiGateway.translationRevisionResults.push({
      content: 'Version final fiel',
    });
    context.aiGateway.translationQualityResults.push(
      failedStage2QualityResult(),
      passedStage2QualityResult(),
    );

    const executor = new RunCampaignStage2Executor(
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
    const translations = await context.repositories.translations.findByAdaptationId(adaptation.id);
    const translation = translations[0];
    const translationVersions = translation
      ? await context.repositories.translationVersions.findByTranslationId(translation.id)
      : [];
    const qualityChecks = await context.repositories.qualityChecks.findByCampaignId(campaign.id);

    expect(result.outcome).toBe('completed');
    expect(result.items[0]).toMatchObject({
      attempts: 2,
      status: 'ready',
      approvalItemId: null,
    });
    expect(updatedCampaign?.status).toBe('ready_for_final_approval');
    expect(updatedWorkflowRun?.status).toBe('completed');
    expect(updatedPublication?.status).toBe('ready');
    expect(translation?.status).toBe('approved');
    expect(translationVersions).toHaveLength(2);
    expect(qualityChecks).toHaveLength(2);
  });
});
