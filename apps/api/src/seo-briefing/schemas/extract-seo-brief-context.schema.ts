import * as v from 'valibot';

export const ExtractSeoBriefContextSchema = v.object({
  aiModelMode: v.optional(v.nullish(v.picklist(['flash', 'pro', 'pro_thinking']))),
  contextText: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(30_000)),
});

export type ExtractSeoBriefContextDto = v.InferOutput<typeof ExtractSeoBriefContextSchema>;
