export interface BulkEntityOption {
  id: string;
  name: string;
  role?: string;
}

export interface UnmatchedEntityItem {
  name: string;
  usedInEvents: number;
  eventTitles: string[];
}

export interface UnmatchedEntitiesSummary {
  speakers: UnmatchedEntityItem[];
  organizers: UnmatchedEntityItem[];
  locations: UnmatchedEntityItem[];
  formats: UnmatchedEntityItem[];
}

function normalizeName(name: string): string {
  return name.toLowerCase().trim();
}

function uniqueById<T extends { id: string }>(items: T[]): T[] {
  return items.filter(
    (item, index, self) => index === self.findIndex((x) => x.id === item.id)
  );
}

function matchSpeakersForEvent(
  rawNames: string[],
  speakers: BulkEntityOption[]
): { speakers: BulkEntityOption[]; speakerIds: string[] } {
  const matched: BulkEntityOption[] = [];
  const ids: string[] = [];

  for (const name of rawNames) {
    const found = speakers.find(
      (s) => normalizeName(s.name) === normalizeName(name)
    );
    if (found && !ids.includes(found.id)) {
      matched.push(found);
      ids.push(found.id);
    }
  }

  return { speakers: matched, speakerIds: ids };
}

function matchOrganizersForEvent(
  rawNames: string[],
  organizers: BulkEntityOption[],
  existingMainOrganizerId?: string
) {
  const matched: BulkEntityOption[] = [];
  const ids: string[] = [];

  for (const name of rawNames) {
    const found = organizers.find(
      (o) => normalizeName(o.name) === normalizeName(name)
    );
    if (found && !ids.includes(found.id)) {
      matched.push(found);
      ids.push(found.id);
    }
  }

  if (matched.length === 0) {
    return {
      organizerId: existingMainOrganizerId,
      organizer: undefined as string | undefined,
      otherOrganizers: [] as BulkEntityOption[],
      otherOrganizerIds: [] as string[],
      organizerIds: [] as string[],
    };
  }

  const mainOrganizer =
    matched.find((o) => o.id === existingMainOrganizerId) ?? matched[0];
  const additional = matched.filter((o) => o.id !== mainOrganizer.id);

  return {
    organizerId: mainOrganizer.id,
    organizer: mainOrganizer.name,
    otherOrganizers: additional,
    otherOrganizerIds: additional.map((o) => o.id),
    organizerIds: additional.map((o) => o.id),
  };
}

function matchLocationsForEvent(
  rawNames: string[],
  locations: BulkEntityOption[],
  existingMainLocationId?: string
) {
  const matched: BulkEntityOption[] = [];
  const ids: string[] = [];

  for (const name of rawNames) {
    const found = locations.find(
      (l) => normalizeName(l.name) === normalizeName(name)
    );
    if (found && !ids.includes(found.id)) {
      matched.push(found);
      ids.push(found.id);
    }
  }

  if (matched.length === 0) {
    return {
      locationId: existingMainLocationId,
      location: undefined as string | undefined,
      otherLocations: [] as BulkEntityOption[],
      otherLocationIds: [] as string[],
      locationIds: [] as string[],
    };
  }

  const mainLocation =
    matched.find((l) => l.id === existingMainLocationId) ?? matched[0];
  const additional = matched.filter((l) => l.id !== mainLocation.id);

  return {
    locationId: mainLocation.id,
    location: mainLocation.name,
    otherLocations: additional,
    otherLocationIds: additional.map((l) => l.id),
    locationIds: additional.map((l) => l.id),
  };
}

export function matchFormatByName(
  rawName: string | undefined | null,
  formats: BulkEntityOption[]
): BulkEntityOption | undefined {
  if (!rawName?.trim()) return undefined;
  return formats.find((f) => normalizeName(f.name) === normalizeName(rawName));
}

/** Match a title prefix like "Core Teaching: Session" against known formats. */
export function matchFormatFromTitlePrefix(
  title: string | undefined | null,
  formats: BulkEntityOption[]
): { format: BulkEntityOption; cleanTitle: string } | null {
  if (!title?.trim() || formats.length === 0) return null;

  const sorted = [...formats].sort((a, b) => b.name.length - a.name.length);
  const lowerTitle = title.toLowerCase();

  for (const format of sorted) {
    const prefix = `${format.name.toLowerCase()}:`;
    if (lowerTitle.startsWith(prefix)) {
      return {
        format,
        cleanTitle: title.slice(format.name.length + 1).trim() || title,
      };
    }
  }

  return null;
}

export function applyEntityMatchingToEvents(
  events: any[],
  speakers: BulkEntityOption[],
  organizers: BulkEntityOption[],
  locations: BulkEntityOption[],
  formats: BulkEntityOption[] = []
): any[] {
  return events.map((event) => {
    const updated = { ...event };

    const rawSpeakerNames: string[] = event.rawSpeakerNames || [];
    if (rawSpeakerNames.length > 0) {
      const speakerMatch = matchSpeakersForEvent(rawSpeakerNames, speakers);
      const mergedSpeakers = uniqueById([
        ...(event.speakers || []),
        ...speakerMatch.speakers,
      ]);
      const mergedSpeakerIds = Array.from(
        new Set([...(event.speakerIds || []), ...speakerMatch.speakerIds])
      );
      updated.speakers = mergedSpeakers;
      updated.speakerIds = mergedSpeakerIds;
    }

    const rawOrganizerNames: string[] = event.rawOrganizerNames || [];
    if (rawOrganizerNames.length > 0) {
      const orgMatch = matchOrganizersForEvent(
        rawOrganizerNames,
        organizers,
        event.organizerId
      );
      if (orgMatch.organizerId) {
        updated.organizerId = orgMatch.organizerId;
        updated.organizer = orgMatch.organizer;
      }
      const mergedOtherOrganizers = uniqueById([
        ...(event.otherOrganizers || []),
        ...orgMatch.otherOrganizers,
      ]);
      const mergedOtherOrganizerIds = Array.from(
        new Set([
          ...(event.otherOrganizerIds || []),
          ...orgMatch.otherOrganizerIds,
        ])
      );
      updated.otherOrganizers = mergedOtherOrganizers;
      updated.otherOrganizerIds = mergedOtherOrganizerIds;
      updated.organizerIds = mergedOtherOrganizerIds;
    }

    const rawLocationNames: string[] = event.rawLocationNames || [];
    if (rawLocationNames.length > 0) {
      const locMatch = matchLocationsForEvent(
        rawLocationNames,
        locations,
        event.locationId
      );
      if (locMatch.locationId) {
        updated.locationId = locMatch.locationId;
        updated.location = locMatch.location;
      }
      const mergedOtherLocations = uniqueById([
        ...(event.otherLocations || []),
        ...locMatch.otherLocations,
      ]);
      const mergedOtherLocationIds = Array.from(
        new Set([
          ...(event.otherLocationIds || []),
          ...locMatch.otherLocationIds,
        ])
      );
      updated.otherLocations = mergedOtherLocations;
      updated.otherLocationIds = mergedOtherLocationIds;
      updated.locationIds = mergedOtherLocationIds;
    }

    const rawFormatName: string | undefined =
      typeof event.rawFormatName === 'string'
        ? event.rawFormatName
        : typeof event.format === 'string' && !event.formatId
          ? event.format
          : undefined;

    if (rawFormatName?.trim() && !updated.formatId) {
      const matchedFormat = matchFormatByName(rawFormatName, formats);
      if (matchedFormat) {
        updated.formatId = matchedFormat.id;
        updated.format = matchedFormat.name;
        updated.rawFormatName = rawFormatName.trim();
      } else {
        updated.rawFormatName = rawFormatName.trim();
      }
    } else if (!updated.formatId && formats.length > 0) {
      const fromTitle = matchFormatFromTitlePrefix(updated.title, formats);
      if (fromTitle) {
        updated.formatId = fromTitle.format.id;
        updated.format = fromTitle.format.name;
        updated.rawFormatName = fromTitle.format.name;
        updated.title = fromTitle.cleanTitle;
      }
    }

    return updated;
  });
}

export function computeUnmatchedEntities(events: any[]): UnmatchedEntitiesSummary {
  const speakers = new Map<string, Set<string>>();
  const organizers = new Map<string, Set<string>>();
  const locations = new Map<string, Set<string>>();
  const formats = new Map<string, Set<string>>();

  const existingSpeakerNames = new Set<string>();
  const existingOrganizerNames = new Set<string>();
  const existingLocationNames = new Set<string>();
  const existingFormatNames = new Set<string>();

  const track = (
    map: Map<string, Set<string>>,
    name: string,
    eventTitle: string
  ) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!map.has(trimmed)) {
      map.set(trimmed, new Set());
    }
    map.get(trimmed)!.add(eventTitle);
  };

  for (const event of events) {
    for (const s of event.speakers || []) {
      if (s?.name) existingSpeakerNames.add(normalizeName(s.name));
    }
    if (event.organizer) existingOrganizerNames.add(normalizeName(event.organizer));
    for (const o of event.otherOrganizers || []) {
      if (o?.name) existingOrganizerNames.add(normalizeName(o.name));
    }
    if (event.location) existingLocationNames.add(normalizeName(event.location));
    for (const l of event.otherLocations || []) {
      if (l?.name) existingLocationNames.add(normalizeName(l.name));
    }
    if (event.formatId && event.format) {
      existingFormatNames.add(normalizeName(event.format));
    }
  }

  for (const event of events) {
    const eventTitle = event.title || 'Untitled event';

    for (const name of event.rawSpeakerNames || []) {
      if (!name?.trim()) continue;
      if (existingSpeakerNames.has(normalizeName(name))) continue;
      track(speakers, name, eventTitle);
    }
    for (const name of event.rawOrganizerNames || []) {
      if (!name?.trim()) continue;
      if (existingOrganizerNames.has(normalizeName(name))) continue;
      track(organizers, name, eventTitle);
    }
    for (const name of event.rawLocationNames || []) {
      if (!name?.trim()) continue;
      if (existingLocationNames.has(normalizeName(name))) continue;
      track(locations, name, eventTitle);
    }
    const rawFormat =
      typeof event.rawFormatName === 'string' ? event.rawFormatName : '';
    if (rawFormat.trim() && !event.formatId) {
      if (!existingFormatNames.has(normalizeName(rawFormat))) {
        track(formats, rawFormat.trim(), eventTitle);
      }
    }
  }

  const toList = (map: Map<string, Set<string>>): UnmatchedEntityItem[] =>
    Array.from(map.entries())
      .map(([name, eventTitles]) => ({
        name,
        usedInEvents: eventTitles.size,
        eventTitles: Array.from(eventTitles).sort((a, b) => a.localeCompare(b)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

  return {
    speakers: dedupeUnmatchedItems(toList(speakers)),
    organizers: dedupeUnmatchedItems(toList(organizers)),
    locations: dedupeUnmatchedItems(toList(locations)),
    formats: dedupeUnmatchedItems(toList(formats)),
  };
}

export function hasUnmatchedEntities(summary: UnmatchedEntitiesSummary): boolean {
  return (
    summary.speakers.length > 0 ||
    summary.organizers.length > 0 ||
    summary.locations.length > 0 ||
    (summary.formats?.length ?? 0) > 0
  );
}

function levenshtein(a: string, b: string): number {
  const matrix = Array.from({ length: b.length + 1 }, (_, i) =>
    Array.from({ length: a.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function areSimilarEntityNames(a: string, b: string): boolean {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (na === nb) return true;
  if (na.length < 6 || nb.length < 6) return false;
  return levenshtein(na, nb) <= 2;
}

export function dedupeUnmatchedItems(items: UnmatchedEntityItem[]): UnmatchedEntityItem[] {
  const merged: UnmatchedEntityItem[] = [];

  for (const item of items) {
    const existing = merged.find((entry) => areSimilarEntityNames(entry.name, item.name));

    if (!existing) {
      merged.push({
        ...item,
        eventTitles: [...item.eventTitles],
      });
      continue;
    }

    const combinedTitles = Array.from(
      new Set([...existing.eventTitles, ...item.eventTitles])
    ).sort((a, b) => a.localeCompare(b));
    existing.eventTitles = combinedTitles;
    existing.usedInEvents = combinedTitles.length;

    // Prefer the more likely correct spelling (longer / contains "transfusion" etc.)
    if (item.name.length > existing.name.length) {
      existing.name = item.name;
    }
  }

  return merged.sort((a, b) => a.name.localeCompare(b.name));
}

export function dedupeUnmatchedEntities(
  summary: UnmatchedEntitiesSummary
): UnmatchedEntitiesSummary {
  return {
    speakers: dedupeUnmatchedItems(summary.speakers),
    organizers: dedupeUnmatchedItems(summary.organizers),
    locations: dedupeUnmatchedItems(summary.locations),
    formats: dedupeUnmatchedItems(summary.formats || []),
  };
}
