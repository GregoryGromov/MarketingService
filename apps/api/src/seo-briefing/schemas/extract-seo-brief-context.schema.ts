import * as v from 'valibot';

export const ExtractSeoBriefContextSchema = v.object({
  aiModelMode: v.optional(v.nullish(v.picklist(['flash', 'pro', 'pro_thinking']))),
  contextText: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(30_000)),
  requestTimeoutMs: v.optional(
    v.nullish(v.pipe(v.number(), v.minValue(30_000), v.maxValue(900_000))),
  ),
});

export type ExtractSeoBriefContextDto = v.InferOutput<typeof ExtractSeoBriefContextSchema>;
