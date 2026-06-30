import { SEO_BRIEF_RERUNNABLE_STAGES } from '@marketing-service/seo-briefing';
import * as v from 'valibot';

export const RerunSeoBriefStageSchema = v.object({
  stage: v.picklist(SEO_BRIEF_RERUNNABLE_STAGES),
  seoProductBalance: v.optional(
    v.nullish(
      v.object({
        seoWeight: v.optional(v.nullish(v.pipe(v.number(), v.minValue(0), v.maxValue(1)))),
        productWeight: v.optional(v.nullish(v.pipe(v.number(), v.minValue(0), v.maxValue(1)))),
      }),
    ),
  ),
});

export type RerunSeoBriefStageDto = v.InferOutput<typeof RerunSeoBriefStageSchema>;
