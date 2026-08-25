import { StationConfig } from '@/utils/stationConfigs'

function stemParagraphs(description: string): string[] {
  const parts = description
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map((part) => part.trim())
    .filter(Boolean)
  return parts.length > 0 ? parts : [description]
}

export function StationCaseStem({ stationConfig }: { stationConfig: StationConfig }) {
  const { age, gender, presentingComplaint } = stationConfig.patientProfile
  const paragraphs = stemParagraphs(stationConfig.description)

  return (
    <section className="bg-white rounded-modern-lg shadow-modern-lg border border-gray-200/50 overflow-hidden">
      <div className="border-b border-gray-200/80 bg-slate-50 px-5 sm:px-7 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
          The case
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Read this before you start
        </p>
      </div>

      <div className="px-5 sm:px-7 py-5 sm:py-6">
        <dl className="grid gap-4 sm:grid-cols-3 sm:gap-6">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Patient
            </dt>
            <dd className="mt-1 text-base font-medium text-slate-900">
              {age}-year-old {gender}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Presenting complaint
            </dt>
            <dd className="mt-1 text-base font-medium text-slate-900">
              {presentingComplaint.charAt(0).toUpperCase() + presentingComplaint.slice(1)}
            </dd>
          </div>
              <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Time allowed
            </dt>
            <dd className="mt-1 text-base font-medium text-slate-900">
              {stationConfig.duration} minutes
            </dd>
          </div>
        </dl>

        <div className="mt-5 sm:mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 sm:px-5 sm:py-5 space-y-4">
          {paragraphs.map((paragraph) => (
            <p
              key={paragraph}
              className="text-lg sm:text-xl leading-8 text-slate-900"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  )
}
