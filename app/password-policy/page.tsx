import { PASSWORD_POLICY } from '@/lib/password-policy'
import Link from 'next/link'

export default function PasswordPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 px-4 py-10">
      <div className="mx-auto max-w-2xl rounded-2xl border border-gray-100 bg-white p-8 shadow-xl">
        <Link href="/auth/signin" className="text-sm text-purple-700 hover:text-purple-900">
          ← Back to sign in
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Bleepy Password Policy</h1>
        <p className="mt-2 text-sm text-gray-600">Version {PASSWORD_POLICY.version} · Updated {PASSWORD_POLICY.lastUpdated}</p>

        <p className="mt-6 text-gray-700">{PASSWORD_POLICY.summary}</p>

        <h2 className="mt-8 text-lg font-semibold text-gray-900">Requirements</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-gray-700">
          {PASSWORD_POLICY.rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>

        <h2 className="mt-8 text-lg font-semibold text-gray-900">Suspected compromise</h2>
        <p className="mt-2 text-gray-700">
          If you think your account has been compromised, change your password immediately and email{' '}
          <a href="mailto:admin@bleepy.co.uk" className="text-purple-700 underline">
            admin@bleepy.co.uk
          </a>
          .
        </p>
      </div>
    </div>
  )
}
