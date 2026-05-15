import { describe, expect, it } from 'vitest';
import { Campaign } from '../../index.js';
import { StartCampaignProductionCommand } from './start-campaign-production.command.js';
import { StartCampaignProductionHandler } from './start-campaign-production.handler.js';
import { createCampaignTestContext } from '../../testing/campaign-test-harness.js';
import {
  attachSourceToCampaign,
  createPresetFixture,
  createProjectFixture,
} from '../../testing/campaign-test-fixtures.js';

describe('StartCampaignProductionHandler', () => {
  it('creates a workflow run and enqueues source checking instead of running AI inline', async () => {
    const context = createCampaignTestContext();
    const project = createProjectFixture();
    const preset = createPresetFixture();
    const campaign = Campaign.create({
      projectId: project.id,
      presetId: preset.id,
      name: 'Queue Source Check',
      startDate: new Date('2026-05-14T00:00:00.000Z'),
      sourceLanguage: 'en',
    });

    await context.repositories.projects.save(project);
    await context.repositories.presets.save(preset);
    await context.repositories.campaigns.save(campaign);
    await attachSourceToCampaign(context, campaign, {
      content: 'Queue this source',
      language: 'en',
    });

    const handler = new StartCampaignProductionHandler(
      context.transaction,
      context.jobs,
      context.eventBus,
    );
    const result = await handler.execute(new StartCampaignProductionCommand(campaign.id));

    const updatedCampaign = await context.repositories.campaigns.findById(campaign.id);
    const workflowRuns = await context.repositories.workflowRuns.findByCampaignId(campaign.id);

    expect(result.status).toBe('queued');
    expect(result.jobId).toBe('job-1');
    expect(updatedCampaign?.status).toBe('source_checking');
    expect(workflowRuns).toHaveLength(1);
    expect(workflowRuns[0]).toMatchObject({
      status: 'running',
      currentStep: 'source_check',
    });
    expect(context.jobs.sourceChecks).toEqual([
      {
        campaignId: campaign.id,
        workflowRunId: workflowRuns[0]?.id,
      },
    ]);
    expect(context.aiGateway.sourceValidationResults).toHaveLength(0);
  });
});
