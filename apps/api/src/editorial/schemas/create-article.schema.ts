import * as v from 'valibot';

export const CreateArticleSchema = v.object({
  projectId: v.pipe(v.string(), v.minLength(1)),
  content: v.pipe(v.string(), v.minLength(1)),
  language: v.pipe(v.string(), v.length(2)),
  releasePlanSnapshot: v.optional(v.nullable(v.record(v.string(), v.unknown()))),
});

export type CreateArticleDto = v.InferOutput<typeof CreateArticleSchema>;
