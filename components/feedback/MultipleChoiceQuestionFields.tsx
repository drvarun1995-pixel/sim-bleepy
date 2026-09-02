'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, X } from 'lucide-react'

export type MultipleChoiceQuestionFieldsValue = {
  options?: string[]
  allowMultiple?: boolean
  allowOther?: boolean
  otherPlaceholder?: string
}

export function MultipleChoiceQuestionFields(props: {
  value: MultipleChoiceQuestionFieldsValue
  onChange: (next: MultipleChoiceQuestionFieldsValue) => void
}) {
  const options = props.value.options || []

  const update = (patch: Partial<MultipleChoiceQuestionFieldsValue>) => {
    props.onChange({ ...props.value, ...patch })
  }

  const setOption = (index: number, text: string) => {
    const next = [...options]
    next[index] = text
    update({ options: next })
  }

  return (
    <div className="space-y-3">
      <div>
        <Label>Options</Label>
        <div className="mt-2 space-y-2">
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={option}
                onChange={(e) => setOption(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => update({ options: options.filter((_, i) => i !== index) })}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => update({ options: [...options, ''] })}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Option
          </Button>
        </div>
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={!!props.value.allowMultiple}
          onChange={(e) => update({ allowMultiple: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-blue-600"
        />
        <span className="text-sm">Allow multiple selections</span>
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={!!props.value.allowOther}
          onChange={(e) => update({ allowOther: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-blue-600"
        />
        <span className="text-sm">Include Other option</span>
      </label>

      {props.value.allowOther && (
        <div>
          <Label htmlFor="other-placeholder">Other placeholder</Label>
          <Input
            id="other-placeholder"
            className="mt-1"
            value={props.value.otherPlaceholder || ''}
            onChange={(e) => update({ otherPlaceholder: e.target.value })}
            placeholder="Please specify"
          />
        </div>
      )}
    </div>
  )
}
