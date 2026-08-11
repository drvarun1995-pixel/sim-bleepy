export interface StructuredExcelEntityRow {
  date: string;
  title: string;
  speakers: string[];
  organizers: string[];
  locations: string[];
  format?: string;
}

function normalizeKeyPart(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\s*:\s*/g, ': ');
}

export function makeEventEntityKey(date: string, title: string): string {
  const normalizedDate = parseTeachingExcelDate(date) || date;
  return `${normalizeKeyPart(normalizedDate)}|${normalizeKeyPart(title)}`;
}

function normalizeDateKey(date: string): string {
  return normalizeKeyPart(parseTeachingExcelDate(date) || date);
}

export function titlesReferToSameEvent(a: string, b: string): boolean {
  const na = normalizeKeyPart(a);
  const nb = normalizeKeyPart(b);
  if (na === nb) return true;
  if (na.length < 3 || nb.length < 3) return false;
  return nb.startsWith(na) || na.startsWith(nb);
}

function findStructuredEventRow(
  event: { date: string; title: string },
  structuredEvents: StructuredExcelEventRow[]
): StructuredExcelEventRow | undefined {
  const dateKey = normalizeDateKey(event.date);
  return structuredEvents.find(
    (row) =>
      normalizeDateKey(row.date) === dateKey &&
      titlesReferToSameEvent(event.title, row.title)
  );
}

export function sortEventsByDate(events: any[]): any[] {
  return [...events].sort((a, b) => {
    const dateA = parseTeachingExcelDate(a.date) || a.date;
    const dateB = parseTeachingExcelDate(b.date) || b.date;
    if (dateA !== dateB) {
      return dateA.localeCompare(dateB);
    }
    const timeA = a.startTime || '00:00';
    const timeB = b.startTime || '00:00';
    return timeA.localeCompare(timeB);
  });
}

export function splitEntityNames(value: string): string[] {
  if (!value?.trim()) return [];

  return value
    .split(/[,;&/]+|\band\b/gi)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.replace(/^dr\.?\s+/i, (m) => m)) // keep Dr prefix as-is
    .filter((part) => part.length > 1);
}

function normalizeTypoMonth(monthPart: string): string | null {
  const tryMonth = (value: string) => {
    const num = Number(value);
    if (num >= 1 && num <= 12) {
      return value.padStart(2, '0');
    }
    return null;
  };

  if (monthPart.length === 2) {
    return tryMonth(monthPart);
  }

  if (monthPart.length === 3) {
    for (let i = 0; i < 3; i++) {
      const candidate = monthPart.slice(0, i) + monthPart.slice(i + 1);
      const valid = tryMonth(candidate);
      if (valid) return valid;
    }
  }

  return null;
}

function parseExcelDateToIso(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  // Handle common Excel typos like 15.056.27 (extra digit in month)
  const loose = trimmed.match(/^(\d{1,2})\.(\d{2,3})\.(\d{2,4})$/);
  if (loose) {
    const day = loose[1].padStart(2, '0');
    const month = normalizeTypoMonth(loose[2]);
    if (!month) return null;

    let year = loose[3];
    if (year.length === 2) {
      year = `20${year}`;
    }

    const dayNum = Number(day);
    if (dayNum >= 1 && dayNum <= 31) {
      return `${year}-${month}-${day}`;
    }
  }

  const ddmmyy = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  if (ddmmyy) {
    const day = ddmmyy[1].padStart(2, '0');
    const month = ddmmyy[2].padStart(2, '0');
    let year = ddmmyy[3];
    if (year.length === 2) {
      year = `20${year}`;
    }
    return `${year}-${month}-${day}`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

export function parseTeachingExcelDate(value: string): string | null {
  return parseExcelDateToIso(value);
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }

  cells.push(current.trim());
  return cells;
}

export function extractStructuredExcelEntities(fileText: string): Map<string, StructuredExcelEntityRow> {
  const entityMap = new Map<string, StructuredExcelEntityRow>();
  const lines = fileText.split(/\r?\n/);

  let columnIndexes: {
    date: number;
    title: number;
    format: number;
    organiser: number;
    speaker: number;
    room: number;
  } | null = null;

  const detectHeaderIndexes = (cells: string[]) => {
    const lower = cells.map((c) => c.toLowerCase().trim());
    const find = (...needles: string[]) =>
      lower.findIndex((h) => needles.some((n) => h.includes(n)));

    const date = find('date');
    const title = find('title', 'event', 'session', 'topic');
    const format = find('format');
    if (date < 0 || title < 0 || format < 0) return null;

    return {
      date,
      title,
      format,
      organiser: find('organis', 'organiz'),
      speaker: find('speaker', 'faculty', 'tutor'),
      room: find('room', 'location', 'venue'),
    };
  };

  for (const line of lines) {
    if (!line.trim() || line.startsWith('===')) continue;

    const cells = parseCsvLine(line);
    if (cells.length < 3) continue;

    if (!columnIndexes) {
      const detected = detectHeaderIndexes(cells);
      if (detected) {
        columnIndexes = detected;
        continue;
      }
    }

    const dateIdx = columnIndexes?.date ?? 0;
    const titleIdx = columnIndexes?.title ?? 1;
    const formatIdx = columnIndexes?.format ?? -1;
    const organiserIdx = columnIndexes?.organiser ?? 3;
    const speakerIdx = columnIndexes?.speaker ?? 4;
    const roomIdx = columnIndexes?.room ?? 5;

    const maybeDate = parseExcelDateToIso(cells[dateIdx] || '');
    if (!maybeDate) continue;

    const title = cells[titleIdx]?.trim();
    if (!title) continue;

    const organiser =
      organiserIdx >= 0 ? cells[organiserIdx]?.trim() || '' : cells[3]?.trim() || '';
    const speaker =
      speakerIdx >= 0 ? cells[speakerIdx]?.trim() || '' : cells[4]?.trim() || '';
    const room =
      roomIdx >= 0 ? cells[roomIdx]?.trim() || '' : cells[5]?.trim() || '';
    const format =
      formatIdx >= 0 ? cells[formatIdx]?.trim() || '' : '';

    const speakers = splitEntityNames(speaker);
    const organizers = splitEntityNames(organiser);
    const locations = splitEntityNames(room);

    if (
      speakers.length === 0 &&
      organizers.length === 0 &&
      locations.length === 0 &&
      !format
    ) {
      continue;
    }

    const key = makeEventEntityKey(maybeDate, title);
    const existing = entityMap.get(key);

    entityMap.set(key, {
      date: maybeDate,
      title,
      speakers: Array.from(new Set([...(existing?.speakers || []), ...speakers])),
      organizers: Array.from(new Set([...(existing?.organizers || []), ...organizers])),
      locations: Array.from(new Set([...(existing?.locations || []), ...locations])),
      format: format || existing?.format,
    });
  }

  return entityMap;
}

export function fixDatesInExcelText(text: string): string {
  return text.replace(
    /\b(\d{1,2})\.(0\d{2})\.(\d{2})\b/g,
    (match, day, month, year) => {
      const fixed = normalizeTypoMonth(month);
      return fixed ? `${day}.${fixed}.${year}` : match;
    }
  );
}

export interface StructuredExcelEventRow {
  date: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
}

export function extractStructuredExcelEvents(
  fileText: string
): StructuredExcelEventRow[] {
  const events: StructuredExcelEventRow[] = [];
  const lines = fileText.split(/\r?\n/);

  for (const line of lines) {
    if (!line.trim() || line.startsWith('===')) continue;

    const cells = parseCsvLine(line);
    if (cells.length < 2) continue;

    const maybeDate = parseExcelDateToIso(cells[0]);
    if (!maybeDate) continue;

    const title = cells[1]?.trim();
    if (!title) continue;

    events.push({
      date: maybeDate,
      title,
      description: cells[2]?.trim() || '',
      startTime: '12:00',
      endTime: '13:00',
    });
  }

  return events;
}

function eventRichnessScore(event: any): number {
  let score = 0;
  if (event.description?.trim()) score += 1;
  if (Array.isArray(event.speakers) && event.speakers.length > 0) score += 2;
  if (Array.isArray(event.organizers) && event.organizers.length > 0) score += 1;
  if (Array.isArray(event.locations) && event.locations.length > 0) score += 1;
  if (event.startTime && event.startTime !== '12:00') score += 1;
  return score;
}

export function dedupeEventsByKey(events: any[]): any[] {
  const result: any[] = [];

  for (const event of events) {
    const dateKey = normalizeDateKey(event.date);
    const existingIndex = result.findIndex(
      (existing) =>
        normalizeDateKey(existing.date) === dateKey &&
        titlesReferToSameEvent(existing.title, event.title)
    );

    if (existingIndex === -1) {
      result.push(event);
      continue;
    }

    const existing = result[existingIndex];
    const preferred =
      eventRichnessScore(event) > eventRichnessScore(existing) ? event : existing;
    const other = preferred === event ? existing : event;

    result[existingIndex] = {
      ...preferred,
      title:
        existing.title.length >= event.title.length ? existing.title : event.title,
      description: preferred.description?.trim()
        ? preferred.description
        : other.description,
    };
  }

  return result;
}

export function reconcileEventsWithStructuredExcel(
  aiEvents: any[],
  structuredEvents: StructuredExcelEventRow[]
): any[] {
  const reconciled = aiEvents.map((event) => {
    const structured = findStructuredEventRow(event, structuredEvents);
    if (!structured) return event;

    return {
      ...event,
      title: structured.title,
      date: structured.date,
      description: event.description?.trim() ? event.description : structured.description,
      startTime: event.startTime || structured.startTime,
      endTime: event.endTime || structured.endTime,
    };
  });

  const hasMatchingEvent = (structured: StructuredExcelEventRow) =>
    reconciled.some((event) =>
      findStructuredEventRow(event, [structured])
    );

  const missing = structuredEvents.filter((structured) => !hasMatchingEvent(structured));

  if (missing.length === 0) {
    return dedupeEventsByKey(reconciled);
  }

  return dedupeEventsByKey([
    ...reconciled,
    ...missing.map((event, index) => ({
      id: `structured-${index}-${event.date}`,
      title: event.title,
      description: event.description,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      speakers: [],
      organizers: [],
      categories: [],
      locations: [],
    })),
  ]);
}

export function mergeMissingStructuredEvents(
  aiEvents: any[],
  structuredEvents: StructuredExcelEventRow[]
): any[] {
  return reconcileEventsWithStructuredExcel(aiEvents, structuredEvents);
}

export function expandEntityNameArrays(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  const expanded: string[] = [];
  for (const value of values) {
    if (typeof value === 'string') {
      expanded.push(...splitEntityNames(value));
    }
  }
  return Array.from(new Set(expanded.map((v) => v.trim()).filter(Boolean)));
}

export function mergeStructuredEntitiesIntoEvents(
  events: any[],
  entityMap: Map<string, StructuredExcelEntityRow>
): any[] {
  if (entityMap.size === 0) return events;

  const entityRows = Array.from(entityMap.values());

  const findStructuredEntities = (event: { date: string; title: string }) => {
    const exact = entityMap.get(makeEventEntityKey(event.date, event.title));
    if (exact) return exact;

    const dateKey = normalizeDateKey(event.date);
    return entityRows.find(
      (row) =>
        normalizeDateKey(row.date) === dateKey &&
        titlesReferToSameEvent(event.title, row.title)
    );
  };

  return events.map((event) => {
    const structured = findStructuredEntities(event);

    if (!structured) {
      return {
        ...event,
        speakers: expandEntityNameArrays(event.speakers),
        organizers: expandEntityNameArrays(event.organizers),
        locations: expandEntityNameArrays(event.locations),
      };
    }

    const mergedFormat =
      (typeof event.format === 'string' && event.format.trim()) ||
      structured.format ||
      '';

    return {
      ...event,
      title: structured.title,
      speakers: Array.from(
        new Set([
          ...expandEntityNameArrays(event.speakers),
          ...structured.speakers,
        ])
      ),
      organizers: Array.from(
        new Set([
          ...expandEntityNameArrays(event.organizers),
          ...structured.organizers,
        ])
      ),
      locations: Array.from(
        new Set([
          ...expandEntityNameArrays(event.locations),
          ...structured.locations,
        ])
      ),
      ...(mergedFormat ? { format: mergedFormat } : {}),
    };
  });
}
