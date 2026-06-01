import * as v from 'valibot';

export const CreateSeoBriefRunSchema = v.object({
  projectId: v.optional(v.nullish(v.pipe(v.string(), v.trim(), v.minLength(1)))),
  topicSeed: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(240)),
  market: v.object({
    country: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(120)),
    language: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(64)),
    locationName: v.optional(
      v.nullish(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(120))),
    ),
  }),
  audience: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(1000)),
  keywordExpansionPrompt: v.optional(
    v.nullish(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(8000))),
  ),
  product: v.object({
    name: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(120)),
    description: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(4000)),
  }),
  keyMessage: v.optional(
    v.nullish(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(2000))),
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
