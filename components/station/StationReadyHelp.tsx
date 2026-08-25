'use client'

import { StationConfig } from '@/utils/stationConfigs'
import { stationHasFindings } from '@/utils/stationFindings'

const STEPS = (config: StationConfig, hasFindings: boolean) => [
  'Read the case, then press Start Consultation.',
  'Allow the microphone if the browser asks.',
  'You are the doctor. Speak as you would in an OSCE — the patient replies automatically. You do not press a button to talk.',
  hasFindings
    ? 'Ask to examine the patient or request a test. Results open as a card on screen. The patient should not reply.'
    : 'Take a history, examine as you would in clinic, and discuss a plan.',
  `You have ${config.duration} minutes. End the call when you have finished — feedback follows.`,
]

function faqs(config: StationConfig, hasFindings: boolean) {
  return [
    {
      question: 'Do I need to press a button to speak?',
      answer:
        'No. Once the consultation has started, voice activity is detected automatically. Speak naturally and wait for the patient to finish before you reply.',
    },
    {
      question: 'What if the patient does not hear me?',
      answer:
        'Check that the browser has microphone permission, that you are not muted in Windows or on your headset, and that you are speaking after the patient has finished. Headphones with a mic usually work best.',
    },
    {
      question: 'How do examinations and tests work?',
      answer: hasFindings
        ? 'Say that you want to examine a region or request a test, as you would in an OSCE. A findings card opens with the result. The patient should stay silent rather than acknowledging or reading numbers.'
        : 'Examine and request tests in conversation, as you would in an OSCE. This station does not yet show separate findings cards.',
    },
    {
      question: 'How long do I have?',
      answer: `This is an ${config.duration}-minute station. The timer starts when you press Start Consultation. A sound can warn you near the end — control that from Audio in the top bar.`,
    },
    {
      question: 'How is my performance marked?',
      answer:
        'After you end the call, your transcript is marked against this station’s criteria. Speak your working diagnosis and plan out loud so they are in the transcript.',
    },
    {
      question: 'What are the audio notifications?',
      answer:
        'They are short station sounds: one when the consultation starts, and one near the end of the timer. They are not the patient’s voice. Turn them off or change volume from Audio in the top bar.',
    },
    {
      question: 'Can I use headphones?',
      answer:
        'Yes, and they are recommended. Use a headset so the patient voice does not feed back into your microphone.',
    },
  ]
}

export function StationReadyHelp({ stationConfig }: { stationConfig: StationConfig }) {
  const hasFindings = stationHasFindings(stationConfig.id)
  const steps = STEPS(stationConfig, hasFindings)
  const items = faqs(stationConfig, hasFindings)

  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
      <section className="rounded-xl border border-gray-200/80 bg-white/70 p-5 sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          How it works
        </h2>
        <ol className="mt-4 space-y-3">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-3 text-sm leading-relaxed text-slate-600">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-xl border border-gray-200/80 bg-white/70 p-5 sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          FAQs
        </h2>
        <div className="mt-3 divide-y divide-slate-200">
          {items.map((item) => (
            <details key={item.question} className="group py-2">
              <summary className="cursor-pointer list-none text-sm font-medium text-slate-800 marker:content-none [&::-webkit-details-marker]:hidden flex items-start justify-between gap-3">
                <span>{item.question}</span>
                <span className="mt-0.5 text-slate-400 group-open:hidden" aria-hidden>
                  +
                </span>
                <span className="mt-0.5 hidden text-slate-400 group-open:inline" aria-hidden>
                  –
                </span>
              </summary>
              <p className="mt-2 pr-6 text-sm leading-relaxed text-slate-600">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  )
}
