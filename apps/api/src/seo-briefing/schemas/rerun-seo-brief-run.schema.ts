import * as v from 'valibot';

export const RerunSeoBriefRunSchema = v.object({
  seoProductBalance: v.optional(
    v.nullish(
      v.object({
        seoWeight: v.optional(v.nullish(v.pipe(v.number(), v.minValue(0), v.maxValue(1)))),
        productWeight: v.optional(v.nullish(v.pipe(v.number(), v.minValue(0), v.maxValue(1)))),
      }),
    ),
  ),
});

export type RerunSeoBriefRunDto = v.InferOutput<typeof RerunSeoBriefRunSchema>;
