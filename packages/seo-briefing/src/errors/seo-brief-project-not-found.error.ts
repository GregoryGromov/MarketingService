export class SeoBriefProjectNotFoundError extends Error {
  constructor(public readonly projectId: string) {
    super(`SEO brief project not found: ${projectId}`);
    this.name = 'SeoBriefProjectNotFoundError';
  }
}
