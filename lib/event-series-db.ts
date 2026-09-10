import { supabaseAdmin } from '@/utils/supabase'
import { updateCronTasksForEvent } from '@/lib/cron-tasks'
import {
  EVENT_SERIES_SQL_HINT,
  SERIES_COLUMN_OMIT_ON_SIBLINGS,
  type EventSeriesScope,
} from '@/lib/event-series'

type SeriesEventRow = {
  id: string
  date: string | null
  series_id: string | null
  series_index: number | null
}

export function isMissingSeriesSchemaError(error: { message?: string; code?: string } | null | undefined): boolean {
  const message = (error?.message || '').toLowerCase()
  return (
    error?.code === 'PGRST204' ||
    error?.code === '42P01' ||
    error?.code === '42703' ||
    message.includes('event_series') ||
    message.includes('series_id') ||
    message.includes('series_index') ||
    message.includes('schema cache')
  )
}

export async function fetchEventSeriesRow(eventId: string): Promise<SeriesEventRow | null> {
  const { data, error } = await supabaseAdmin
    .from('events')
    .select('id, date, series_id, series_index')
    .eq('id', eventId)
    .maybeSingle()

  if (error) {
    if (isMissingSeriesSchemaError(error)) return null
    console.error('Error fetching event series row:', error)
    return null
  }

  return (data as SeriesEventRow | null) || null
}

export async function resolveSeriesEventIds(
  eventId: string,
  scope: EventSeriesScope
): Promise<string[]> {
  if (scope === 'this') return [eventId]

  const current = await fetchEventSeriesRow(eventId)
  if (!current?.series_id) return [eventId]

  const { data, error } = await supabaseAdmin
    .from('events')
    .select('id, date, series_index')
    .eq('series_id', current.series_id)
    .order('date', { ascending: true })

  if (error || !data) {
    if (error && isMissingSeriesSchemaError(error)) {
      throw new Error(EVENT_SERIES_SQL_HINT)
    }
    console.error('Error resolving series events:', error)
    return [eventId]
  }

  const rows = data as Array<{ id: string; date: string | null; series_index: number | null }>
  if (scope === 'all') {
    return rows.map((row) => row.id)
  }

  return rows
    .filter((row) => {
      if (current.date && row.date) return row.date >= current.date
      if (current.series_index != null && row.series_index != null) {
        return row.series_index >= current.series_index
      }
      return row.id === eventId
    })
    .map((row) => row.id)
}

export async function attachSeriesFields<T extends { id: string }>(
  events: T[]
): Promise<Array<T & { series_id: string | null; series_index: number | null; series_total: number | null }>> {
  if (events.length === 0) {
    return []
  }

  const ids = events.map((event) => event.id)
  const { data, error } = await supabaseAdmin
    .from('events')
    .select('id, series_id, series_index')
    .in('id', ids)

  if (error || !data) {
    if (error && !isMissingSeriesSchemaError(error)) {
      console.error('Error attaching series fields:', error)
    }
    return events.map((event) => ({
      ...event,
      series_id: (event as any).series_id ?? null,
      series_index: (event as any).series_index ?? null,
      series_total: null,
    }))
  }

  const byId = new Map(
    (data as Array<{ id: string; series_id: string | null; series_index: number | null }>).map((row) => [
      row.id,
      row,
    ])
  )
  const seriesIds = Array.from(
    new Set(
      (data as Array<{ series_id: string | null }>)
        .map((row) => row.series_id)
        .filter((id): id is string => Boolean(id))
    )
  )

  const totals = new Map<string, number>()
  if (seriesIds.length > 0) {
    const { data: siblingRows, error: siblingError } = await supabaseAdmin
      .from('events')
      .select('id, series_id')
      .in('series_id', seriesIds)

    if (!siblingError && siblingRows) {
      for (const row of siblingRows as Array<{ series_id: string | null }>) {
        if (!row.series_id) continue
        totals.set(row.series_id, (totals.get(row.series_id) || 0) + 1)
      }
    }
  }

  return events.map((event) => {
    const series = byId.get(event.id)
    const seriesId = series?.series_id ?? null
    return {
      ...event,
      series_id: seriesId,
      series_index: series?.series_index ?? null,
      series_total: seriesId ? totals.get(seriesId) || null : null,
    }
  })
}

function omitSiblingColumns(updates: Record<string, any>) {
  const next = { ...updates }
  for (const key of SERIES_COLUMN_OMIT_ON_SIBLINGS) {
    delete next[key]
  }
  delete next.speaker_ids
  delete next.category_ids
  delete next.location_ids
  delete next.organizer_ids
  delete next.series_scope
  delete next.repeat
  delete next.feedbackFormTemplate
  delete next.feedbackCustomQuestions
  delete next.feedbackAnonymousEnabled
  delete next.feedbackEnabled
  return next
}

async function replaceJunction(
  table: 'event_categories' | 'event_locations' | 'event_organizers' | 'event_speakers',
  eventId: string,
  foreignKey: string,
  ids: string[] | undefined
) {
  if (ids === undefined) return

  await supabaseAdmin.from(table).delete().eq('event_id', eventId)
  if (ids.length === 0) return

  const rows = ids.map((id) => ({ event_id: eventId, [foreignKey]: id }))
  const { error } = await supabaseAdmin.from(table).insert(rows)
  if (error) {
    console.error(`Error updating ${table} for series sibling ${eventId}:`, error)
  }
}

export async function applySeriesSiblingUpdates(
  primaryEventId: string,
  scope: EventSeriesScope,
  updates: Record<string, any>,
  relations: {
    speakerIds?: string[]
    categoryIds?: string[]
    locationIds?: string[]
    organizerIds?: string[]
  }
): Promise<number> {
  if (scope === 'this') return 0

  const siblingIds = (await resolveSeriesEventIds(primaryEventId, scope)).filter(
    (id) => id !== primaryEventId
  )
  if (siblingIds.length === 0) return 0

  const columnUpdates = omitSiblingColumns(updates)
  let updated = 0

  for (const siblingId of siblingIds) {
    if (Object.keys(columnUpdates).length > 0) {
      const { error } = await supabaseAdmin.from('events').update(columnUpdates).eq('id', siblingId)
      if (error) {
        console.error(`Error updating series sibling ${siblingId}:`, error)
        continue
      }
    }

    await replaceJunction('event_categories', siblingId, 'category_id', relations.categoryIds)
    await replaceJunction('event_locations', siblingId, 'location_id', relations.locationIds)
    await replaceJunction('event_organizers', siblingId, 'organizer_id', relations.organizerIds)
    await replaceJunction('event_speakers', siblingId, 'speaker_id', relations.speakerIds)

    try {
      const { data: sibling } = await supabaseAdmin
        .from('events')
        .select(
          'date, end_time, start_time, booking_enabled, feedback_enabled, auto_generate_certificate, certificate_template_id, target_cohorts'
        )
        .eq('id', siblingId)
        .single()

      if (sibling) {
        await updateCronTasksForEvent(siblingId, {
          date: sibling.date,
          end_time: sibling.end_time,
          start_time: sibling.start_time,
          booking_enabled: sibling.booking_enabled,
          feedback_enabled: sibling.feedback_enabled,
          auto_generate_certificate: sibling.auto_generate_certificate,
          certificate_template_id: sibling.certificate_template_id,
          target_cohorts: sibling.target_cohorts || null,
        })
      }
    } catch (cronError) {
      console.error(`Error updating cron tasks for series sibling ${siblingId}:`, cronError)
    }

    updated += 1
  }

  return updated
}
