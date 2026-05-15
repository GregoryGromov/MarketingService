import { describe, expect, it } from 'vitest';
import { CreateCampaignHandler } from './create-campaign.handler.js';
import { CreateCampaignCommand } from './create-campaign.command.js';
import { createCampaignTestContext } from '../../testing/campaign-test-harness.js';
import {
  createPresetFixture,
  createProjectFixture,
} from '../../testing/campaign-test-fixtures.js';

describe('CreateCampaignHandler', () => {
  it('materializes planned publications from the selected preset', async () => {
    const context = createCampaignTestContext();
    const project = createProjectFixture();
    const preset = createPresetFixture({
      publications: [
        {
          dayOffset: 1,
          localTime: '12:30',
          channel: 'channel_x',
          language: 'es',
          publicationType: 'thread',
          style: 'bold',
          position: 2,
        },
        {
          dayOffset: 0,
          localTime: '09:15',
          channel: 'channel_telegram',
          language: 'en',
          publicationType: 'post',
          style: 'insight',
          position: 1,
        },
      ],
    });

    await context.repositories.projects.save(project);
    await context.repositories.presets.save(preset);

    const handler = new CreateCampaignHandler(context.transaction, context.eventBus);
    const result = await handler.execute(
      new CreateCampaignCommand(
        project.id,
        preset.id,
        'Campaign Alpha',
        new Date('2026-05-14T00:00:00.000Z'),
      ),
    );

    const campaign = await context.repositories.campaigns.findById(result.campaignId);
    const plannedPublications = (
      await context.repositories.plannedPublications.findByCampaignId(result.campaignId as never)
    ).sort((left, right) => left.scheduledFor.getTime() - right.scheduledFor.getTime());

    expect(campaign).not.toBeNull();
    expect(campaign?.name).toBe('Campaign Alpha');
    expect(plannedPublications).toHaveLength(2);
    expect(result.plannedPublicationIds).toHaveLength(2);

    expect(plannedPublications[0]).toMatchObject({
      channel: 'channel_telegram',
      language: 'en',
      publicationType: 'post',
      style: 'insight',
      status: 'pending',
      dayOffset: 0,
      localTime: '09:15',
    });
    expect(plannedPublications[0]?.scheduledFor.toISOString()).toBe(
      '2026-05-14T09:15:00.000Z',
    );

    expect(plannedPublications[1]).toMatchObject({
      channel: 'channel_x',
      language: 'es',
      publicationType: 'thread',
      style: 'bold',
      status: 'pending',
      dayOffset: 1,
      localTime: '12:30',
    });
    expect(plannedPublications[1]?.scheduledFor.toISOString()).toBe(
      '2026-05-15T12:30:00.000Z',
    );
  });

  it('materializes campaign-specific planned publication overrides without mutating the preset', async () => {
    const context = createCampaignTestContext();
    const project = createProjectFixture();
    const preset = createPresetFixture({
      publications: [
        {
          dayOffset: 0,
          localTime: '08:30',
          channel: 'channel_telegram',
          language: 'en',
          publicationType: 'launch_announcement',
          style: 'bold',
          position: 1,
        },
        {
          dayOffset: 1,
          localTime: '18:00',
          channel: 'channel_x',
          language: 'es',
          publicationType: 'single_post',
          style: 'sharp',
          position: 2,
        },
      ],
    });

    await context.repositories.projects.save(project);
    await context.repositories.presets.save(preset);

    const originalPresetPublications = preset.publications.map((publication) => ({
      id: publication.id,
      dayOffset: publication.dayOffset,
      localTime: publication.localTime,
      channel: publication.channel,
      language: publication.language,
      publicationType: publication.publicationType,
      style: publication.style,
    }));

    const handler = new CreateCampaignHandler(context.transaction, context.eventBus);
    const result = await handler.execute(
      new CreateCampaignCommand(
        project.id,
        preset.id,
        'Launch Burst Custom',
        new Date('2026-05-15T00:00:00.000Z'),
        undefined,
        null,
        [
          {
            presetPublicationId: preset.publications[1]!.id,
            dayOffset: 1,
            localTime: '18:00',
            channel: 'channel_x',
            language: 'es',
            publicationType: 'single_post',
            style: 'sharp',
          },
          {
            presetPublicationId: preset.publications[0]!.id,
            dayOffset: 2,
            localTime: '10:45',
            channel: 'channel_discord',
            language: 'ru',
            publicationType: 'community_post',
            style: 'concise',
          },
        ],
      ),
    );

    const plannedPublications = (
      await context.repositories.plannedPublications.findByCampaignId(result.campaignId as never)
    ).sort((left, right) => left.dayOffset - right.dayOffset);

    expect(plannedPublications).toHaveLength(2);
    expect(plannedPublications[0]).toMatchObject({
      presetPublicationId: preset.publications[1]!.id,
      dayOffset: 1,
      localTime: '18:00',
      channel: 'channel_x',
      language: 'es',
      publicationType: 'single_post',
      style: 'sharp',
    });
    expect(plannedPublications[1]).toMatchObject({
      presetPublicationId: preset.publications[0]!.id,
      dayOffset: 2,
      localTime: '10:45',
      channel: 'channel_discord',
      language: 'ru',
      publicationType: 'community_post',
      style: 'concise',
    });
    expect(plannedPublications[1]?.scheduledFor.toISOString()).toBe(
      '2026-05-17T10:45:00.000Z',
    );

    expect(
      preset.publications.map((publication) => ({
        id: publication.id,
        dayOffset: publication.dayOffset,
        localTime: publication.localTime,
        channel: publication.channel,
        language: publication.language,
        publicationType: publication.publicationType,
        style: publication.style,
      })),
    ).toEqual(originalPresetPublications);
  });

  it('allows adding campaign-only planned publications without mutating the preset', async () => {
    const context = createCampaignTestContext();
    const project = createProjectFixture();
    const preset = createPresetFixture({
      publications: [
        {
          dayOffset: 0,
          localTime: '08:30',
          channel: 'channel_telegram',
          language: 'en',
          publicationType: 'launch_announcement',
          style: 'bold',
          position: 1,
        },
      ],
    });

    await context.repositories.projects.save(project);
    await context.repositories.presets.save(preset);

    const handler = new CreateCampaignHandler(context.transaction, context.eventBus);
    const result = await handler.execute(
      new CreateCampaignCommand(
        project.id,
        preset.id,
        'Launch Burst Extended',
        new Date('2026-05-15T00:00:00.000Z'),
        undefined,
        null,
        [
          {
            presetPublicationId: preset.publications[0]!.id,
            dayOffset: 0,
            localTime: '08:30',
            channel: 'channel_telegram',
            language: 'en',
            publicationType: 'launch_announcement',
            style: 'bold',
          },
          {
            presetPublicationId: null,
            dayOffset: 3,
            localTime: '14:20',
            channel: 'channel_x',
            language: 'en',
            publicationType: 'thread',
            style: 'teaser',
          },
        ],
      ),
    );

    const plannedPublications = (
      await context.repositories.plannedPublications.findByCampaignId(result.campaignId as never)
    ).sort((left, right) => left.scheduledFor.getTime() - right.scheduledFor.getTime());

    expect(plannedPublications).toHaveLength(2);
    expect(plannedPublications[0]).toMatchObject({
      presetPublicationId: preset.publications[0]!.id,
      channel: 'channel_telegram',
      localTime: '08:30',
    });
    expect(plannedPublications[1]).toMatchObject({
      presetPublicationId: null,
      dayOffset: 3,
      localTime: '14:20',
      channel: 'channel_x',
      language: 'en',
      publicationType: 'thread',
      style: 'teaser',
      status: 'pending',
    });
    expect(plannedPublications[1]?.scheduledFor.toISOString()).toBe(
      '2026-05-18T14:20:00.000Z',
    );
    expect(preset.publications).toHaveLength(1);
  });

  it('allows removing preset publications from the campaign-specific plan without mutating the preset', async () => {
    const context = createCampaignTestContext();
    const project = createProjectFixture();
    const preset = createPresetFixture({
      publications: [
        {
          dayOffset: 0,
          localTime: '08:30',
          channel: 'channel_telegram',
          language: 'en',
          publicationType: 'launch_announcement',
          style: 'bold',
          position: 1,
        },
        {
          dayOffset: 0,
          localTime: '09:15',
          channel: 'channel_x',
          language: 'en',
          publicationType: 'thread',
          style: 'sharp',
          position: 2,
        },
      ],
    });

    await context.repositories.projects.save(project);
    await context.repositories.presets.save(preset);

    const handler = new CreateCampaignHandler(context.transaction, context.eventBus);
    const result = await handler.execute(
      new CreateCampaignCommand(
        project.id,
        preset.id,
        'Launch Burst Reduced',
        new Date('2026-05-15T00:00:00.000Z'),
        undefined,
        null,
        [
          {
            presetPublicationId: preset.publications[0]!.id,
            dayOffset: 0,
            localTime: '08:30',
            channel: 'channel_telegram',
            language: 'en',
            publicationType: 'launch_announcement',
            style: 'bold',
          },
        ],
      ),
    );

    const plannedPublications = await context.repositories.plannedPublications.findByCampaignId(
      result.campaignId as never,
    );

    expect(plannedPublications).toHaveLength(1);
    expect(plannedPublications[0]).toMatchObject({
      presetPublicationId: preset.publications[0]!.id,
      channel: 'channel_telegram',
    });
    expect(preset.publications).toHaveLength(2);
  });
});
