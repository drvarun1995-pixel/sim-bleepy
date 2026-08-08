'use client'

import Link from 'next/link'
import { PASSWORD_POLICY, getPasswordStrength } from '@/lib/password-policy'
import { ShieldCheck } from 'lucide-react'

type PasswordPolicyGuidanceProps = {
  password?: string
  variant?: 'signup' | 'reset' | 'forgot'
}

export function PasswordPolicyGuidance({
  password = '',
  variant = 'signup',
}: PasswordPolicyGuidanceProps) {
  const strength = password ? getPasswordStrength(password) : null

  if (variant === 'forgot') {
    return (
      <div className="rounded-lg border border-purple-100 bg-purple-50/60 p-3 text-xs text-gray-700">
        <p className="font-semibold text-purple-900">Password security reminder</p>
        <p className="mt-1">
          When you reset your password, choose a <strong>unique password of at least 12 characters</strong> that
          you do not use on other websites.
        </p>
        <Link href="/password-policy" className="mt-2 inline-block text-purple-700 underline hover:text-purple-900">
          Read our password policy
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
      <div className="mb-2 flex items-center gap-2 font-semibold text-gray-900">
        <ShieldCheck className="h-4 w-4 text-purple-600" />
        Password policy
      </div>
      <ul className="list-disc space-y-1 pl-4">
        {PASSWORD_POLICY.rules.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ul>
      {password && (
        <p className="mt-2 font-medium text-gray-800">
          Strength:{' '}
          <span
            className={
              strength === 'strong'
                ? 'text-green-700'
                : strength === 'fair'
                  ? 'text-amber-700'
                  : 'text-red-700'
            }
          >
            {strength === 'strong' ? 'Strong' : strength === 'fair' ? 'Fair' : 'Too weak'}
          </span>
        </p>
      )}
      <Link href="/password-policy" className="mt-2 inline-block text-purple-700 underline hover:text-purple-900">
        Full password policy
      </Link>
    </div>
  )
}
