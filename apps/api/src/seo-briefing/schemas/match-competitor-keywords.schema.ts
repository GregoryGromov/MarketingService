import * as v from 'valibot';

export const MatchCompetitorKeywordsSchema = v.object({
  mode: v.optional(v.picklist(['algorithmic', 'ai']), 'algorithmic'),
});

export type MatchCompetitorKeywordsDto = v.InferOutput<typeof MatchCompetitorKeywordsSchema>;
