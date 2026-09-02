'use client'

import { Input } from '@/components/ui/input'
import {
  FEEDBACK_OTHER_LABEL,
  FEEDBACK_OTHER_VALUE,
  isOtherSelected,
  normalizeMcSelections,
  type FeedbackQuestion,
  type FeedbackAnswer,
} from '@/lib/feedback/questions'

export function MultipleChoiceInput(props: {
  question: FeedbackQuestion
  value: FeedbackAnswer
  otherText?: string
  onChange: (value: string | string[]) => void
  onOtherTextChange: (text: string) => void
}) {
  const { question, value, otherText = '', onChange, onOtherTextChange } = props
  const options = question.options || []
  const allowMultiple = !!question.allowMultiple
  const allowOther = !!question.allowOther
  const selected = new Set(normalizeMcSelections(value))
  const otherOn = isOtherSelected(value)

  const toggle = (option: string, checked: boolean) => {
    if (allowMultiple) {
      const next = new Set(selected)
      if (checked) next.add(option)
      else next.delete(option)
      onChange(Array.from(next))
      return
    }
    onChange(checked ? option : '')
  }

  return (
    <div className="space-y-2">
      {options.map((option) => (
        <label key={option} className="flex items-center gap-2">
          <input
            type={allowMultiple ? 'checkbox' : 'radio'}
            name={question.id}
            value={option}
            checked={selected.has(option)}
            onChange={(e) => toggle(option, e.target.checked)}
            className="h-4 w-4 text-blue-600"
          />
          <span className="text-sm">{option}</span>
        </label>
      ))}
      {allowOther && (
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type={allowMultiple ? 'checkbox' : 'radio'}
              name={question.id}
              value={FEEDBACK_OTHER_VALUE}
              checked={otherOn}
              onChange={(e) => toggle(FEEDBACK_OTHER_VALUE, e.target.checked)}
              className="h-4 w-4 text-blue-600"
            />
            <span className="text-sm">{FEEDBACK_OTHER_LABEL}</span>
          </label>
          {otherOn && (
            <Input
              value={otherText}
              onChange={(e) => onOtherTextChange(e.target.value)}
              placeholder={question.otherPlaceholder || 'Please specify'}
              className="ml-6"
            />
          )}
        </div>
      )}
    </div>
  )
}
