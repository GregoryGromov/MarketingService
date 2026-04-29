import {
  BadRequestException,
  type ArgumentMetadata,
  type PipeTransform,
} from '@nestjs/common';
import {
  type BaseIssue,
  type BaseSchema,
  type InferOutput,
  ValiError,
  parse,
} from 'valibot';

// Custom NestJS validation pipe for Valibot schemas
//
// Usage: @Body(new ValibotPipe(CreateArticleSchema)) dto: CreateArticleDto

export class ValibotPipe<TSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>>
  implements PipeTransform
{
  constructor(private readonly schema: TSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata): InferOutput<TSchema> {
    try {
      return parse(this.schema, value);
    } catch (error) {
      if (error instanceof ValiError) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: error.issues.map((issue) => ({
            path: issue.path?.map((segment: { key: unknown }) => String(segment.key)).join('.'),
            message: issue.message,
          })),
        });
      }

      throw error;
    }
  }
}
