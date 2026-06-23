const MOSCOW_UTC_OFFSET_MINUTES = 180;
const MOSCOW_UTC_OFFSET_MS = MOSCOW_UTC_OFFSET_MINUTES * 60 * 1000;
const MOSCOW_UTC_OFFSET_HOURS = MOSCOW_UTC_OFFSET_MINUTES / 60;

export interface MoscowDateParts {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
}

export function parseLocalTimeToken(localTime: string): {
  hours: number;
  minutes: number;
} {
  const [hoursToken, minutesToken] = localTime.split(':');
  const hours = Number.parseInt(hoursToken ?? '0', 10);
  const minutes = Number.parseInt(minutesToken ?? '0', 10);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    throw new Error(`Invalid local time "${localTime}"`);
  }

  return { hours, minutes };
}

export function getMoscowDateParts(value: Date): MoscowDateParts {
  const shifted = new Date(value.getTime() + MOSCOW_UTC_OFFSET_MS);

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hours: shifted.getUTCHours(),
    minutes: shifted.getUTCMinutes(),
  };
}

export function createDateFromMoscowParts(parts: MoscowDateParts): Date {
  return new Date(
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hours - MOSCOW_UTC_OFFSET_HOURS,
      parts.minutes,
      0,
      0,
    ),
  );
}

export function materializeMoscowDateTime(
  baseDate: Date,
  dayOffset: number,
  localTime: string,
): Date {
  const baseParts = getMoscowDateParts(baseDate);
  const { hours, minutes } = parseLocalTimeToken(localTime);

  return createDateFromMoscowParts({
    year: baseParts.year,
    month: baseParts.month,
    day: baseParts.day + dayOffset,
    hours,
    minutes,
  });
}

export function toMoscowLocalTimeToken(date: Date): string {
  const parts = getMoscowDateParts(date);
  return `${String(parts.hours).padStart(2, '0')}:${String(parts.minutes).padStart(2, '0')}`;
}

export function toMoscowDayOffset(startDate: Date, publishAt: Date): number {
  const start = createDateFromMoscowParts({
    ...getMoscowDateParts(startDate),
    hours: 0,
    minutes: 0,
  });
  const publish = createDateFromMoscowParts({
    ...getMoscowDateParts(publishAt),
    hours: 0,
    minutes: 0,
  });

  return Math.round((publish.getTime() - start.getTime()) / 86400000);
}
