export class SeoBriefRerunStageNotAllowedError extends Error {
  constructor(public readonly stage: string) {
    super(`SEO brief rerun stage ${stage} is not allowed`);
    this.name = 'SeoBriefRerunStageNotAllowedError';
  }
}
