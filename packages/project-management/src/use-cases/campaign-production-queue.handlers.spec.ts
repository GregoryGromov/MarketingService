import { describe, expect, it } from 'vitest';
import { Campaign, PlannedPublication } from '../index.js';
import { RunCampaignStage1Command } from './run-campaign-stage-1/run-campaign-stage-1.command.js';
import { RunCampaignStage1Handler } from './run-campaign-stage-1/run-campaign-stage-1.enqueue-handler.js';
import { RunCampaignStage2Command } from './run-campaign-stage-2/run-campaign-stage-2.command.js';
import { RunCampaignStage2Handler } from './run-campaign-stage-2/run-campaign-stage-2.enqueue-handler.js';
import { createCampaignTestContext } from '../testing/campaign-test-harness.js';
import {
  attachSourceToCampaign,
  createPresetFixture,
  createProjectFixture,
} from '../testing/campaign-test-fixtures.js';

describe('Campaign production queue handlers', () => {
  it('enqueues Stage 1 work instead of running it inline', async () => {
    const context = createCampaignTestContext();
    const project = createProjectFixture();
    const preset = createPresetFixture();
    const campaign = Campaign.create({
      projectId: project.id,
      presetId: preset.id,
      name: 'Stage 1 Queue',
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
      language: 'en',
      publicationType: 'post',
      style: 'insight',
      publishMode: 'auto_publish',
    });

    await context.repositories.projects.save(project);
    await context.repositories.presets.save(preset);
    await context.repositories.campaigns.save(campaign);
    await context.repositories.plannedPublications.save(plannedPublication);
    await attachSourceToCampaign(context, campaign, {
      content: 'Stage 1 source',
      language: 'en',
    });

    const handler = new RunCampaignStage1Handler(
      context.transaction,
      context.jobs,
      context.eventBus,
    );
    const result = await handler.execute(new RunCampaignStage1Command(campaign.id));

    expect(result.status).toBe('queued');
    expect(result.pendingPublicationCount).toBe(1);
    expect(context.jobs.stage1Jobs).toEqual([
      {
        campaignId: campaign.id,
        workflowRunId: result.workflowRunId,
      },
    ]);
  });

  it('enqueues Stage 2 work instead of running it inline', async () => {
    const context = createCampaignTestContext();
    const project = createProjectFixture();
    const preset = createPresetFixture();
    const campaign = Campaign.create({
      projectId: project.id,
      presetId: preset.id,
      name: 'Stage 2 Queue',
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
      language: 'es',
      publicationType: 'thread',
      style: 'bold',
      publishMode: 'auto_publish',
    });
    plannedPublication.markTranslating();

    await context.repositories.projects.save(project);
    await context.repositories.presets.save(preset);
    await context.repositories.campaigns.save(campaign);
    await context.repositories.plannedPublications.save(plannedPublication);

    const handler = new RunCampaignStage2Handler(
      context.transaction,
      context.jobs,
      context.eventBus,
    );
    const result = await handler.execute(new RunCampaignStage2Command(campaign.id));

    expect(result.status).toBe('queued');
    expect(result.translatingPublicationCount).toBe(1);
    expect(context.jobs.stage2Jobs).toEqual([
      {
        campaignId: campaign.id,
        workflowRunId: result.workflowRunId,
      },
    ]);
  });
});
