"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { HelpTooltip } from "@/components/ui/help-tooltip"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  EVENT_SERIES_MAX_OCCURRENCES,
  formatSeriesDatePreview,
  generateSeriesDates,
  type EventSeriesFrequency,
  type EventSeriesScope,
} from "@/lib/event-series"

export type EventRepeatFormValue = {
  repeatEnabled: boolean
  repeatFrequency: EventSeriesFrequency
  repeatUntilDate: string
  repeatCount: string
  repeatSkipWeekends: boolean
  seriesScope: EventSeriesScope
  seriesId: string | null
  seriesIndex: number | null
  seriesTotal: number | null
}

const emptyRepeat: EventRepeatFormValue = {
  repeatEnabled: false,
  repeatFrequency: 'weekly',
  repeatUntilDate: '',
  repeatCount: '',
  repeatSkipWeekends: false,
  seriesScope: 'this',
  seriesId: null,
  seriesIndex: null,
  seriesTotal: null,
}

export function defaultEventRepeatFormValue(
  overrides: Partial<EventRepeatFormValue> = {}
): EventRepeatFormValue {
  return { ...emptyRepeat, ...overrides }
}

export function EventRepeatCreateFields({
  startDate,
  value,
  onChange,
}: {
  startDate: string
  value: EventRepeatFormValue
  onChange: (next: Partial<EventRepeatFormValue>) => void
}) {
  const count = value.repeatCount ? Number(value.repeatCount) : null
  const preview = value.repeatEnabled
    ? generateSeriesDates(startDate, {
        frequency: value.repeatFrequency,
        untilDate: value.repeatUntilDate || null,
        count: Number.isFinite(count) ? count : null,
        skipWeekends: value.repeatSkipWeekends,
      })
    : []

  return (
    <div className="space-y-4 rounded-lg border border-blue-100 bg-blue-50/40 p-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="repeatEnabled"
          checked={value.repeatEnabled}
          onCheckedChange={(checked) => onChange({ repeatEnabled: !!checked })}
          className="h-2.5 w-2.5 sm:h-4 sm:w-4"
        />
        <div className="flex items-center gap-2">
          <Label htmlFor="repeatEnabled">Repeat this event</Label>
          <HelpTooltip content="Creates a separate event for each date. Bookings, attendance, feedback and certificates stay per session. Use this for weekly teaching, not for one multi-day course." />
        </div>
      </div>

      {value.repeatEnabled && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="repeatFrequency">Repeats</Label>
              <Select
                value={value.repeatFrequency}
                onValueChange={(next) => onChange({ repeatFrequency: next as EventSeriesFrequency })}
              >
                <SelectTrigger id="repeatFrequency" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Every week</SelectItem>
                  <SelectItem value="fortnightly">Every 2 weeks</SelectItem>
                  <SelectItem value="monthly">Every month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="repeatCount">Number of sessions</Label>
              <Input
                id="repeatCount"
                type="number"
                min={2}
                max={EVENT_SERIES_MAX_OCCURRENCES}
                value={value.repeatCount}
                onChange={(e) => onChange({ repeatCount: e.target.value })}
                placeholder="e.g. 8"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Label htmlFor="repeatUntilDate">Or repeat until</Label>
              <HelpTooltip content="Optional. Stop on this date, inclusive. If you also set a session count, whichever limit is reached first wins. Maximum 52 sessions." />
            </div>
            <Input
              id="repeatUntilDate"
              type="date"
              value={value.repeatUntilDate}
              onChange={(e) => onChange({ repeatUntilDate: e.target.value })}
              className="mt-1"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="repeatSkipWeekends"
              checked={value.repeatSkipWeekends}
              onCheckedChange={(checked) => onChange({ repeatSkipWeekends: !!checked })}
              className="h-2.5 w-2.5 sm:h-4 sm:w-4"
            />
            <Label htmlFor="repeatSkipWeekends">If a date lands on a weekend, use the next Monday</Label>
          </div>

          {preview.length > 1 && (
            <div className="rounded-md bg-white p-3 text-sm text-gray-700">
              <p className="font-medium text-gray-900">
                This will create {preview.length} events
              </p>
              <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                {preview.slice(0, 12).map((date) => (
                  <li key={date}>{formatSeriesDatePreview(date)}</li>
                ))}
              </ul>
              {preview.length > 12 && (
                <p className="mt-2 text-gray-500">
                  and {preview.length - 12} more
                </p>
              )}
            </div>
          )}

          {value.repeatEnabled && preview.length < 2 && (
            <p className="text-sm text-amber-700">
              Add a session count (2–{EVENT_SERIES_MAX_OCCURRENCES}) or an until date after the start date.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export function EventSeriesEditScope({
  value,
  onChange,
}: {
  value: EventRepeatFormValue
  onChange: (next: Partial<EventRepeatFormValue>) => void
}) {
  if (!value.seriesId) return null

  const total = value.seriesTotal
  const index = value.seriesIndex

  return (
    <div className="space-y-3 rounded-lg border border-purple-100 bg-purple-50/50 p-4">
      <div>
        <p className="font-medium text-gray-900">This event is part of a repeating series</p>
        <p className="text-sm text-gray-600">
          {index && total
            ? `Session ${index} of ${total}. `
            : ''}
          Changing the date here only moves this session. Other fields can update later dates too.
        </p>
      </div>
      <div className="space-y-2 text-sm">
        <label className="flex items-start gap-2">
          <input
            type="radio"
            name="seriesScope"
            className="mt-1"
            checked={value.seriesScope === 'this'}
            onChange={() => onChange({ seriesScope: 'this' })}
          />
          <span>This session only</span>
        </label>
        <label className="flex items-start gap-2">
          <input
            type="radio"
            name="seriesScope"
            className="mt-1"
            checked={value.seriesScope === 'this_and_future'}
            onChange={() => onChange({ seriesScope: 'this_and_future' })}
          />
          <span>This and future sessions</span>
        </label>
        <label className="flex items-start gap-2">
          <input
            type="radio"
            name="seriesScope"
            className="mt-1"
            checked={value.seriesScope === 'all'}
            onChange={() => onChange({ seriesScope: 'all' })}
          />
          <span>Entire series</span>
        </label>
      </div>
    </div>
  )
}
