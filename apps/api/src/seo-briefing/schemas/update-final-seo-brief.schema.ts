import * as v from 'valibot';

export const UpdateFinalSeoBriefSchema = v.object({
  briefPayload: v.pipe(
    v.unknown(),
    v.check(
      (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value),
      'briefPayload must be a JSON object',
    ),
  ),
});

export type UpdateFinalSeoBriefDto = v.InferOutput<typeof UpdateFinalSeoBriefSchema>;
