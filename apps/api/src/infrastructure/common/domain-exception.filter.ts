import {
  ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();

      response.status(status).send(payload);
      return;
    }

    const isDev = process.env.NODE_ENV !== 'production';
    const message =
      exception instanceof Error ? exception.message : 'Internal server error';
    const cause =
      exception instanceof Error && exception.cause instanceof Error
        ? {
            message: exception.cause.message,
            stack: exception.cause.stack,
          }
        : exception instanceof Error && exception.cause
          ? exception.cause
          : undefined;

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message,
      path: request.url,
      ...(isDev && exception instanceof Error ? { stack: exception.stack, cause } : {}),
    });
  }
}
