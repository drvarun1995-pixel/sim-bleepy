import Link from 'next/link'
import {
  VERIFICATION_REMINDER_STEPS,
  buildVerificationReminderEmail,
  type VerificationReminderStepId,
} from '@/lib/email-templates/system'

export const metadata = {
  title: 'Confirm-email reminder preview',
  robots: { index: false, follow: false },
}

const STEPS = VERIFICATION_REMINDER_STEPS.map((step) => ({
  id: step.id,
  label: step.label,
}))

export default function VerifyReminderPreviewPage({
  searchParams,
}: {
  searchParams?: { step?: string }
}) {
  const step = (
    STEPS.some((item) => item.id === searchParams?.step) ? searchParams?.step : '12h'
  ) as VerificationReminderStepId
  const mail = buildVerificationReminderEmail({
    name: 'Wilson Alvares',
    verificationUrl: 'https://sim.bleepy.co.uk/auth/verify?token=preview',
    step,
  })

  return (
    <div className="min-h-screen bg-[#e5e7eb]">
      <div className="mx-auto max-w-[720px] px-3 py-6 sm:px-4">
        <div className="mb-4 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Email preview</p>
          <h1 className="mt-1 text-lg font-semibold text-slate-900">Confirm-email reminders</h1>
          <p className="mt-1 text-sm text-slate-600">
            Sent automatically if someone signs up and does not confirm: 12 hours, 3 days, 7 days, then
            a last reminder at 30 days. Nothing after that.
          </p>
          <p className="mt-2 truncate text-sm text-slate-500">
            <span className="font-medium text-slate-700">Subject:</span> {mail.subject}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {STEPS.map((item) => (
              <Link
                key={item.id}
                href={`/email-preview/verify-reminder?step=${item.id}`}
                className={`inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-semibold ${
                  step === item.id
                    ? 'bg-teal-700 text-white'
                    : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <iframe
            title="Confirm-email reminder preview"
            srcDoc={mail.html}
            className="h-[1400px] w-full border-0 bg-white"
          />
        </div>
      </div>
    </div>
  )
}
