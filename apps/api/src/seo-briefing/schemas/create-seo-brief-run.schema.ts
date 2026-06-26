import * as v from 'valibot';

const OptionalTextListSchema = v.optional(
  v.nullish(v.array(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(500)))),
);
const PromptInstructionOverridesSchema = v.optional(
  v.nullish(v.record(v.string(), v.pipe(v.string(), v.trim(), v.maxLength(8000)))),
);

const OptionalHttpsUrlSchema = v.optional(
  v.nullish(
    v.pipe(
      v.string(),
      v.trim(),
      v.minLength(1),
      v.maxLength(2048),
      v.check((value) => {
        try {
          return new URL(value).protocol === 'https:';
        } catch {
          return false;
        }
      }, 'coverImageUrl must be a valid HTTPS URL'),
    ),
  ),
);

export const CreateSeoBriefRunSchema = v.object({
  projectId: v.optional(v.nullish(v.pipe(v.string(), v.trim(), v.minLength(1)))),
  aiModelMode: v.optional(v.nullish(v.picklist(['flash', 'pro', 'pro_thinking']))),
  workflowMode: v.optional(v.nullish(v.picklist(['manual', 'auto_until_selection']))),
  topicHint: v.optional(v.nullish(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(2000)))),
  topicSeed: v.optional(v.nullish(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(2000)))),
  hypothesesCount: v.optional(v.nullish(v.pipe(v.number(), v.minValue(1), v.maxValue(100)))),
  serpEnrichmentCount: v.optional(v.nullish(v.pipe(v.number(), v.minValue(1), v.maxValue(100)))),
  requestTimeoutMs: v.optional(
    v.nullish(v.pipe(v.number(), v.minValue(30_000), v.maxValue(900_000))),
  ),
  coverImageUrl: OptionalHttpsUrlSchema,
  deepSeekPricing: v.optional(
    v.nullish(
      v.object({
        inputUsdPerMillionTokens: v.pipe(v.number(), v.minValue(0), v.maxValue(1000)),
        outputUsdPerMillionTokens: v.pipe(v.number(), v.minValue(0), v.maxValue(1000)),
      }),
    ),
  ),
  competitorKeywordsJsonId: v.optional(
    v.nullish(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(240))),
  ),
  market: v.object({
    country: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(120)),
    language: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(64)),
    locationName: v.optional(
      v.nullish(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(120))),
    ),
  }),
  audience: v.optional(v.nullish(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(1000)))),
  userPains: OptionalTextListSchema,
  userScenarios: OptionalTextListSchema,
  keywordExpansionPrompt: v.optional(
    v.nullish(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(8000))),
  ),
  promptInstructionOverrides: PromptInstructionOverridesSchema,
  product: v.optional(
    v.nullish(
      v.object({
        name: v.optional(v.nullish(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(120)))),
        description: v.optional(
          v.nullish(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(4000))),
        ),
      }),
    ),
  ),
  keyMessage: v.optional(
    v.nullish(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(2000))),
  ),
  knownCompetitors: v.optional(
    v.nullish(
      v.object({
        mustInclude: OptionalTextListSchema,
        optional: OptionalTextListSchema,
        exclude: OptionalTextListSchema,
      }),
    ),
  ),
  brandConstraints: OptionalTextListSchema,
  claimsConstraints: OptionalTextListSchema,
  approvedFacts: OptionalTextListSchema,
  forbiddenClaims: OptionalTextListSchema,
  bannedPhrases: OptionalTextListSchema,
  requiredPhrases: OptionalTextListSchema,
  preferredAngle: v.optional(
    v.nullish(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(2000))),
  ),
  excludedTopics: OptionalTextListSchema,
  campaignContext: v.optional(
    v.nullish(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(8000))),
  ),
  audienceShift: v.optional(
    v.nullish(
      v.object({
        before: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(2000)),
        after: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(2000)),
      }),
    ),
  ),
  cta: v.optional(v.nullish(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(240)))),
  seoProductBalance: v.optional(
    v.nullish(
      v.object({
        seoWeight: v.pipe(v.number(), v.minValue(0), v.maxValue(1)),
        productWeight: v.pipe(v.number(), v.minValue(0), v.maxValue(1)),
      }),
    ),
  ),
});

export type CreateSeoBriefRunDto = v.InferOutput<typeof CreateSeoBriefRunSchema>;
