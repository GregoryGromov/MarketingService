import {
  AdaptationVersion,
  Article,
  ArticleSourceVersion,
  ChannelAdaptation,
  Translation,
  TranslationVersion,
  type ArticleSourceVersionKind,
  type ChannelId,
} from '@marketing-service/editorial';
import {
  CampaignArtifact,
  CampaignPreset,
  CampaignPresetPublication,
  Project,
  type Campaign,
  type PlannedPublication,
} from '../index.js';
import type { CampaignTestContext } from './campaign-test-harness.js';

const CANONICAL_SOURCE_ARTICLE_ROLE = 'canonical_source_article';
const STAGE_1_BASE_ADAPTATION_ROLE = 'stage_1_base_adaptation';

export function createProjectFixture(name = 'Test Project'): Project {
  return Project.create({ name });
}

export function createPresetFixture(
  params: {
    name?: string;
    sourceLanguage?: string;
    publications?: Array<{
      dayOffset?: number;
      localTime?: string;
      channel?: string;
      language?: string;
      publicationType?: string;
      style?: string;
      position?: number;
    }>;
  } = {},
): CampaignPreset {
  const preset = CampaignPreset.create({
    name: params.name ?? 'Preset',
    description: 'Fixture preset',
    sourceLanguage: params.sourceLanguage ?? 'en',
    sourceType: 'longread',
  });

  const publications = (params.publications ?? [
    {
      dayOffset: 0,
      localTime: '09:00',
      channel: 'channel_telegram',
      language: params.sourceLanguage ?? 'en',
      publicationType: 'post',
      style: 'insight',
      position: 1,
    },
  ]).map((publication, index) =>
    CampaignPresetPublication.create({
      presetId: preset.id,
      dayOffset: publication.dayOffset ?? 0,
      localTime: publication.localTime ?? '09:00',
      channel: publication.channel ?? 'channel_telegram',
      language: publication.language ?? params.sourceLanguage ?? 'en',
      publicationType: publication.publicationType ?? 'post',
      style: publication.style ?? 'insight',
      position: publication.position ?? index + 1,
    }),
  );

  preset.replacePublications(publications);
  return preset;
}

export async function attachSourceToCampaign(
  context: CampaignTestContext,
  campaign: Campaign,
  params: {
    content?: string;
    language?: string;
    kind?: ArticleSourceVersionKind;
  } = {},
): Promise<{
  article: Article;
  sourceVersion: ArticleSourceVersion;
  artifact: CampaignArtifact;
}> {
  const article = Article.create({
    projectId: campaign.projectId,
    content: params.content ?? 'Source content',
    language: params.language ?? campaign.sourceLanguage,
  });
  const sourceVersion = ArticleSourceVersion.create({
    articleId: article.id,
    content: params.content ?? 'Source content',
    language: params.language ?? campaign.sourceLanguage,
    kind: params.kind ?? 'original',
  });
  const artifact = CampaignArtifact.create({
    campaignId: campaign.id,
    artifactType: 'article',
    artifactId: article.id,
    role: CANONICAL_SOURCE_ARTICLE_ROLE,
  });

  campaign.attachSourceArticle(article.id);
  await context.repositories.articles.save(article);
  await context.repositories.articleSourceVersions.save(sourceVersion);
  await context.repositories.artifacts.save(artifact);
  await context.repositories.campaigns.save(campaign);

  return { article, sourceVersion, artifact };
}

export async function attachApprovedAdaptation(
  context: CampaignTestContext,
  params: {
    campaign: Campaign;
    article: Article;
    plannedPublication: PlannedPublication;
    content?: string;
    sourceLanguage?: string;
  },
): Promise<{
  adaptation: ChannelAdaptation;
  adaptationVersion: AdaptationVersion;
  artifact: CampaignArtifact;
}> {
  const adaptation = ChannelAdaptation.create({
    articleId: params.article.id,
    channelId: params.plannedPublication.channel as ChannelId,
    displayName: 'Stage 1 Adaptation',
    promptInstructions: null,
    sourceLanguage: params.sourceLanguage ?? params.article.original.language,
  });
  const adaptationVersion = AdaptationVersion.create({
    adaptationId: adaptation.id,
    content: params.content ?? 'Approved adaptation',
    kind: 'generated',
    meta: {
      plannedPublicationId: params.plannedPublication.id,
    },
  });

  adaptation.markGenerated(adaptationVersion.id, adaptationVersion.content);
  adaptation.approve();

  const artifact = CampaignArtifact.create({
    campaignId: params.campaign.id,
    plannedPublicationId: params.plannedPublication.id,
    artifactType: 'adaptation',
    artifactId: adaptation.id,
    role: STAGE_1_BASE_ADAPTATION_ROLE,
  });

  await context.repositories.adaptations.save(adaptation);
  await context.repositories.adaptationVersions.save(adaptationVersion);
  await context.repositories.artifacts.save(artifact);

  return { adaptation, adaptationVersion, artifact };
}

export async function attachApprovedTranslation(
  context: CampaignTestContext,
  params: {
    adaptation: ChannelAdaptation;
    targetLanguage: string;
    content?: string;
  },
): Promise<{
    translation: Translation;
    translationVersion: TranslationVersion;
  }> {
  const translation = Translation.create({
    adaptationId: params.adaptation.id,
    sourceLanguage: params.adaptation.sourceLanguage,
    targetLanguage: params.targetLanguage,
  });
  const translationVersion = TranslationVersion.create({
    translationId: translation.id,
    content: params.content ?? 'Approved translation',
    kind: 'generated',
  });

  translation.markGenerated(translationVersion.content);
  translation.approve();

  await context.repositories.translations.save(translation);
  await context.repositories.translationVersions.save(translationVersion);

  return { translation, translationVersion };
}
