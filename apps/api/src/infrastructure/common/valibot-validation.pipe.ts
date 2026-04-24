// Custom NestJS validation pipe for Valibot schemas
//
// Usage: @Body(new ValibotPipe(CreateArticleSchema)) dto: CreateArticleDto
//
// TODO: implement ValibotPipe<T extends BaseSchema>
//   transform(value, metadata):
//     try { return parse(schema, value) }
//     catch (e) { throw new BadRequestException({ errors: e.issues }) }
