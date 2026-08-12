import type { ReactNode } from 'react'

export type FyFaqAccordionItem = {
  question: string
  answer: ReactNode
}

type FyFaqAccordionProps = {
  items: FyFaqAccordionItem[]
  heading?: string
  headingId?: string
  intro?: ReactNode
  className?: string
}

/** Shared FAQ accordion matching FY guide / DNAR `.fy-faq-*` styles. */
export function FyFaqAccordion({
  items,
  heading,
  headingId = 'fy-faq-heading',
  intro,
  className,
}: FyFaqAccordionProps) {
  if (!items.length) return null

  return (
    <section
      className={className}
      aria-labelledby={heading ? headingId : undefined}
    >
      {heading ? (
        <h2 id={headingId} className="text-lg font-semibold text-slate-900 mb-3">
          {heading}
        </h2>
      ) : null}
      {intro ? <div className="fy-faq-intro">{intro}</div> : null}
      <div className="fy-faq-list">
        {items.map((item) => (
          <details key={item.question} className="fy-faq-item">
            <summary className="fy-faq-question">{item.question}</summary>
            <div className="fy-faq-answer">
              {typeof item.answer === 'string' ? <p>{item.answer}</p> : item.answer}
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}
