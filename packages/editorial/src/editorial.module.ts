import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

@Module({
  imports: [CqrsModule],
  providers: [
    // TODO: register command/query handlers from use-cases/
    // TODO: register domain checkers from domain/ (TranslationReadinessChecker)
    // TODO: register sagas from use-cases/ (on-adaptation-approved, etc.)
    //
    // Repositories and LLM adapter are NOT here — they live in
    // @marketing-service/infrastructure and are bound (port → adapter) there
  ],
  exports: [],
})
export class EditorialModule {}
