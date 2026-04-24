import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

@Module({
  imports: [CqrsModule],
  providers: [
    // TODO: register command/query handlers from use-cases/
    // TODO: register domain checkers from domain/ (PublicationCompletenessChecker)
    // TODO: register sagas from use-cases/ (on-article-scheduled, etc.)
    //
    // Repositories and channel adapters are NOT here — they live in
    // @marketing-service/infrastructure and are bound (port → adapter) there
  ],
  exports: [],
})
export class PublishingModule {}
