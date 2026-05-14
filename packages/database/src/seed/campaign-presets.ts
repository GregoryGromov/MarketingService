import { inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {
  campaignPresetPublications,
  campaignPresets,
  type NewCampaignPresetPublicationRow,
  type NewCampaignPresetRow,
} from '../index.js';

declare const process: {
  env: Record<string, string | undefined>;
  exitCode?: number;
};

declare const console: {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};

interface SeedPublication {
  id: string;
  dayOffset: number;
  localTime: string;
  channel: string;
  language: string;
  publicationType: string;
  style: string;
  position: number;
}

interface SeedPreset {
  id: string;
  name: string;
  description: string;
  sourceLanguage: string;
  sourceType: string;
  publications: SeedPublication[];
}

const SYSTEM_CAMPAIGN_PRESETS: SeedPreset[] = [
  {
    id: 'campaign_preset_market_insight',
    name: 'Market Insight',
    description:
      'Turns one source longread into an insight-led sequence for Telegram, X, and community follow-up.',
    sourceLanguage: 'en',
    sourceType: 'market_insight',
    publications: [
      {
        id: 'campaign_preset_publication_market_insight_telegram_en_d0_p1',
        dayOffset: 0,
        localTime: '09:00',
        channel: 'channel_telegram',
        language: 'en',
        publicationType: 'long_post',
        style: 'analytical',
        position: 1,
      },
      {
        id: 'campaign_preset_publication_market_insight_x_en_d0_p2',
        dayOffset: 0,
        localTime: '12:30',
        channel: 'channel_x',
        language: 'en',
        publicationType: 'thread',
        style: 'sharp',
        position: 2,
      },
      {
        id: 'campaign_preset_publication_market_insight_discord_en_d0_p3',
        dayOffset: 0,
        localTime: '17:00',
        channel: 'channel_discord',
        language: 'en',
        publicationType: 'community_post',
        style: 'concise',
        position: 3,
      },
      {
        id: 'campaign_preset_publication_market_insight_telegram_es_d1_p4',
        dayOffset: 1,
        localTime: '09:00',
        channel: 'channel_telegram',
        language: 'es',
        publicationType: 'long_post',
        style: 'analytical',
        position: 4,
      },
      {
        id: 'campaign_preset_publication_market_insight_telegram_ru_d1_p5',
        dayOffset: 1,
        localTime: '18:00',
        channel: 'channel_telegram',
        language: 'ru',
        publicationType: 'long_post',
        style: 'analytical',
        position: 5,
      },
    ],
  },
  {
    id: 'campaign_preset_product_update',
    name: 'Product Update',
    description:
      'Ships a clear product announcement with short social and community follow-ups across the first 24 hours.',
    sourceLanguage: 'en',
    sourceType: 'product_update',
    publications: [
      {
        id: 'campaign_preset_publication_product_update_telegram_en_d0_p1',
        dayOffset: 0,
        localTime: '10:00',
        channel: 'channel_telegram',
        language: 'en',
        publicationType: 'announcement',
        style: 'clear',
        position: 1,
      },
      {
        id: 'campaign_preset_publication_product_update_x_en_d0_p2',
        dayOffset: 0,
        localTime: '11:30',
        channel: 'channel_x',
        language: 'en',
        publicationType: 'single_post',
        style: 'direct',
        position: 2,
      },
      {
        id: 'campaign_preset_publication_product_update_discord_en_d0_p3',
        dayOffset: 0,
        localTime: '15:00',
        channel: 'channel_discord',
        language: 'en',
        publicationType: 'community_post',
        style: 'supportive',
        position: 3,
      },
      {
        id: 'campaign_preset_publication_product_update_telegram_es_d1_p4',
        dayOffset: 1,
        localTime: '09:30',
        channel: 'channel_telegram',
        language: 'es',
        publicationType: 'announcement',
        style: 'clear',
        position: 4,
      },
      {
        id: 'campaign_preset_publication_product_update_telegram_ru_d1_p5',
        dayOffset: 1,
        localTime: '16:00',
        channel: 'channel_telegram',
        language: 'ru',
        publicationType: 'announcement',
        style: 'clear',
        position: 5,
      },
    ],
  },
  {
    id: 'campaign_preset_launch_burst',
    name: 'Launch Burst',
    description:
      'Runs a tighter launch cadence with announcement, social proof, and community touchpoints over three days.',
    sourceLanguage: 'en',
    sourceType: 'launch_brief',
    publications: [
      {
        id: 'campaign_preset_publication_launch_burst_telegram_en_d0_p1',
        dayOffset: 0,
        localTime: '08:30',
        channel: 'channel_telegram',
        language: 'en',
        publicationType: 'launch_announcement',
        style: 'bold',
        position: 1,
      },
      {
        id: 'campaign_preset_publication_launch_burst_x_en_d0_p2',
        dayOffset: 0,
        localTime: '09:15',
        channel: 'channel_x',
        language: 'en',
        publicationType: 'thread',
        style: 'energetic',
        position: 2,
      },
      {
        id: 'campaign_preset_publication_launch_burst_discord_en_d0_p3',
        dayOffset: 0,
        localTime: '13:00',
        channel: 'channel_discord',
        language: 'en',
        publicationType: 'community_post',
        style: 'hype',
        position: 3,
      },
      {
        id: 'campaign_preset_publication_launch_burst_telegram_es_d1_p4',
        dayOffset: 1,
        localTime: '10:00',
        channel: 'channel_telegram',
        language: 'es',
        publicationType: 'launch_announcement',
        style: 'bold',
        position: 4,
      },
      {
        id: 'campaign_preset_publication_launch_burst_x_es_d1_p5',
        dayOffset: 1,
        localTime: '18:00',
        channel: 'channel_x',
        language: 'es',
        publicationType: 'single_post',
        style: 'energetic',
        position: 5,
      },
      {
        id: 'campaign_preset_publication_launch_burst_telegram_ru_d2_p6',
        dayOffset: 2,
        localTime: '10:00',
        channel: 'channel_telegram',
        language: 'ru',
        publicationType: 'launch_announcement',
        style: 'bold',
        position: 6,
      },
    ],
  },
  {
    id: 'campaign_preset_thought_leadership',
    name: 'Thought Leadership',
    description:
      'Builds an authority sequence from one opinionated longread into editorial and discussion-ready outputs.',
    sourceLanguage: 'en',
    sourceType: 'thought_leadership',
    publications: [
      {
        id: 'campaign_preset_publication_thought_leadership_telegram_en_d0_p1',
        dayOffset: 0,
        localTime: '09:00',
        channel: 'channel_telegram',
        language: 'en',
        publicationType: 'editorial_post',
        style: 'authoritative',
        position: 1,
      },
      {
        id: 'campaign_preset_publication_thought_leadership_x_en_d0_p2',
        dayOffset: 0,
        localTime: '14:00',
        channel: 'channel_x',
        language: 'en',
        publicationType: 'thread',
        style: 'opinionated',
        position: 2,
      },
      {
        id: 'campaign_preset_publication_thought_leadership_telegram_es_d1_p3',
        dayOffset: 1,
        localTime: '11:00',
        channel: 'channel_telegram',
        language: 'es',
        publicationType: 'editorial_post',
        style: 'authoritative',
        position: 3,
      },
      {
        id: 'campaign_preset_publication_thought_leadership_telegram_ru_d2_p4',
        dayOffset: 2,
        localTime: '09:00',
        channel: 'channel_telegram',
        language: 'ru',
        publicationType: 'editorial_post',
        style: 'authoritative',
        position: 4,
      },
      {
        id: 'campaign_preset_publication_thought_leadership_discord_en_d2_p5',
        dayOffset: 2,
        localTime: '17:00',
        channel: 'channel_discord',
        language: 'en',
        publicationType: 'community_prompt',
        style: 'discussion',
        position: 5,
      },
    ],
  },
  {
    id: 'campaign_preset_community_roundup',
    name: 'Community Roundup',
    description:
      'Packages one source article into a weekly-style community digest with a short social teaser.',
    sourceLanguage: 'en',
    sourceType: 'community_roundup',
    publications: [
      {
        id: 'campaign_preset_publication_community_roundup_discord_en_d0_p1',
        dayOffset: 0,
        localTime: '09:00',
        channel: 'channel_discord',
        language: 'en',
        publicationType: 'roundup',
        style: 'friendly',
        position: 1,
      },
      {
        id: 'campaign_preset_publication_community_roundup_telegram_en_d0_p2',
        dayOffset: 0,
        localTime: '11:00',
        channel: 'channel_telegram',
        language: 'en',
        publicationType: 'roundup',
        style: 'digest',
        position: 2,
      },
      {
        id: 'campaign_preset_publication_community_roundup_x_en_d0_p3',
        dayOffset: 0,
        localTime: '13:00',
        channel: 'channel_x',
        language: 'en',
        publicationType: 'single_post',
        style: 'teaser',
        position: 3,
      },
      {
        id: 'campaign_preset_publication_community_roundup_telegram_es_d1_p4',
        dayOffset: 1,
        localTime: '09:00',
        channel: 'channel_telegram',
        language: 'es',
        publicationType: 'roundup',
        style: 'digest',
        position: 4,
      },
    ],
  },
];

function toPresetRow(preset: SeedPreset, now: Date): NewCampaignPresetRow {
  return {
    id: preset.id,
    name: preset.name,
    description: preset.description,
    sourceLanguage: preset.sourceLanguage,
    sourceType: preset.sourceType,
    isActive: true,
    isSystem: true,
    createdAt: now,
    updatedAt: now,
  };
}

function toPublicationRow(
  presetId: string,
  publication: SeedPublication,
  now: Date,
): NewCampaignPresetPublicationRow {
  return {
    id: publication.id,
    presetId,
    dayOffset: publication.dayOffset,
    localTime: publication.localTime,
    channel: publication.channel,
    language: publication.language,
    publicationType: publication.publicationType,
    style: publication.style,
    position: publication.position,
    createdAt: now,
  };
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to seed campaign presets.');
  }

  const client = postgres(databaseUrl);
  const db = drizzle(client, {
    schema: {
      campaignPresets,
      campaignPresetPublications,
    },
  });

  try {
    await db.transaction(async (tx) => {
      const now = new Date();
      const presetIds = SYSTEM_CAMPAIGN_PRESETS.map((preset) => preset.id);

      for (const preset of SYSTEM_CAMPAIGN_PRESETS) {
        await tx
          .insert(campaignPresets)
          .values(toPresetRow(preset, now))
          .onConflictDoUpdate({
            target: campaignPresets.id,
            set: {
              name: preset.name,
              description: preset.description,
              sourceLanguage: preset.sourceLanguage,
              sourceType: preset.sourceType,
              isActive: true,
              isSystem: true,
              updatedAt: now,
            },
          });
      }

      await tx
        .delete(campaignPresetPublications)
        .where(inArray(campaignPresetPublications.presetId, presetIds));

      const publicationRows = SYSTEM_CAMPAIGN_PRESETS.flatMap((preset) =>
        preset.publications.map((publication) => toPublicationRow(preset.id, publication, now)),
      );

      if (publicationRows.length > 0) {
        await tx.insert(campaignPresetPublications).values(publicationRows);
      }
    });
  } finally {
    await client.end({ timeout: 5 });
  }

  console.log(
    `Seeded ${SYSTEM_CAMPAIGN_PRESETS.length} campaign presets and ${SYSTEM_CAMPAIGN_PRESETS.reduce((count, preset) => count + preset.publications.length, 0)} preset publications.`,
  );

  for (const preset of SYSTEM_CAMPAIGN_PRESETS) {
    console.log(`- ${preset.name}: ${preset.publications.length} publications`);
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
