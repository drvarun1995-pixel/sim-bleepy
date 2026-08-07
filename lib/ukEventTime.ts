const UK_TIMEZONE = "Europe/London";

function normalizeTime(time: string): { hours: number; minutes: number; seconds: number } {
  const parts = time.trim().split(":");
  return {
    hours: parseInt(parts[0] || "0", 10) || 0,
    minutes: parseInt(parts[1] || "0", 10) || 0,
    seconds: parseInt(parts[2] || "0", 10) || 0,
  };
}

function getLondonWallClockUtcMs(utcMs: number): number {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: UK_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(new Date(utcMs));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parseInt(parts.find((part) => part.type === type)?.value || "0", 10);

  let hour = get("hour");
  if (hour === 24) {
    hour = 0;
  }

  return Date.UTC(get("year"), get("month") - 1, get("day"), hour, get("minute"), get("second"));
}

/**
 * Convert a UK wall-clock date + time (as stored on events) to a UTC Date.
 * Example: 2026-08-07 + 12:00 in BST -> 2026-08-07T11:00:00.000Z
 */
export function ukEventDateTimeToUtc(date: string, time: string): Date {
  const [year, month, day] = date.split("-").map((value) => parseInt(value, 10));
  const { hours, minutes, seconds } = normalizeTime(time);

  const targetLocalMs = Date.UTC(year, month - 1, day, hours, minutes, seconds);
  let utcMs = targetLocalMs;

  for (let attempt = 0; attempt < 5; attempt++) {
    const londonMs = getLondonWallClockUtcMs(utcMs);
    const diff = targetLocalMs - londonMs;
    if (diff === 0) {
      break;
    }
    utcMs += diff;
  }

  return new Date(utcMs);
}

/**
 * Parse datetime-local strings or ISO strings into UTC.
 * Datetime-local values are interpreted as UK wall clock (Europe/London).
 */
export function parseScanWindowInput(value: string): Date {
  const trimmed = value.trim();
  if (!trimmed) {
    return new Date(NaN);
  }

  const datetimeLocalMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}(?::\d{2})?)$/);
  if (datetimeLocalMatch) {
    return ukEventDateTimeToUtc(datetimeLocalMatch[1], datetimeLocalMatch[2]);
  }

  return new Date(trimmed);
}

/**
 * Format a UTC instant for datetime-local inputs, shown in UK time.
 */
export function utcToDatetimeLocalInUK(date: Date): string {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: UK_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value || "00";

  let hour = get("hour");
  if (hour === "24") {
    hour = "00";
  }

  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`;
}

export function addMinutesUkEvent(date: string, time: string, minutes: number): Date {
  const utc = ukEventDateTimeToUtc(date, time);
  return new Date(utc.getTime() + minutes * 60 * 1000);
}
