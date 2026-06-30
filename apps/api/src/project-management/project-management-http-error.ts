import {
  BadRequestException,
  ConflictException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';

const NOT_FOUND_PATTERNS = [
  /\bproject\b .* not found/i,
  /\bcampaign\b .* not found/i,
  /\bcampaign preset\b .* not found/i,
  /\bapproval item\b .* not found/i,
  /\barticle\b .* not found/i,
  /\bworkflow run\b .* not found/i,
  /\bplanned publication\b .* not found/i,
];

const BAD_REQUEST_PATTERNS = [
  /\bdoes not belong to campaign\b/i,
  /\bis not a source issue\b/i,
  /\brequires source content\b/i,
  /\bplanned publication override\b/i,
  /\bcampaign plan cannot be empty\b/i,
  /\bmust use hh:mm format\b/i,
  /\bmust use a valid 24-hour time\b/i,
  /\bdayoffset must be an integer\b/i,
  /\bsource image\b/i,
  /\bcoverimageurl must be a valid https url\b/i,
  /\bcannot be acknowledged\b/i,
];

const CONFLICT_PATTERNS = [
  /\bis not draft and cannot be deleted\b/i,
  /\balready has\b/i,
  /\balready resolved\b/i,
  /\balready has an active workflow run\b/i,
  /\bis inactive\b/i,
  /\bcannot be approved for publishing\b/i,
  /\bstill has \d+ pending approval inbox items\b/i,
  /\bhas no attached source article\b/i,
  /\bhas no source article\b/i,
  /\bhas no planned publications\b/i,
  /\bhas no planned publications waiting for stage [12]\b/i,
  /\bis not ready for stage [12]\b/i,
  /\bis not ready for final approval\b/i,
  /\bis already linked to a different\b/i,
];

export function rethrowProjectManagementHttpError(error: unknown): never {
  if (error instanceof HttpException) {
    throw error;
  }

  const message = error instanceof Error ? error.message : 'Internal server error';

  if (NOT_FOUND_PATTERNS.some((pattern) => pattern.test(message))) {
    throw new NotFoundException(message);
  }

  if (BAD_REQUEST_PATTERNS.some((pattern) => pattern.test(message))) {
    throw new BadRequestException(message);
  }

  if (CONFLICT_PATTERNS.some((pattern) => pattern.test(message))) {
    throw new ConflictException(message);
  }

  throw error;
}
