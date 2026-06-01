import * as v from 'valibot';

export const SeoBriefControlNoteSchema = v.object({
  reason: v.optional(v.nullish(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(2000)))),
});

export type SeoBriefControlNoteDto = v.InferOutput<typeof SeoBriefControlNoteSchema>;
