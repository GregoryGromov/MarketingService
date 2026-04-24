// Exception filter: maps neverthrow domain errors → HTTP responses
//
// TODO: implement @Catch() ExceptionFilter
//   DomainError → 422 Unprocessable Entity
//   NotFoundError → 404
//   etc.
