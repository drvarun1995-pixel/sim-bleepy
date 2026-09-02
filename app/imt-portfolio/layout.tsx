import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient'
import {
  canAccessImtPortfolio,
  getPersonalPortfolioLayoutUser,
} from '@/lib/portfolio-access'

export default async function IMTPortfolioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const user = await getPersonalPortfolioLayoutUser(session.user.email)
  const role = (user?.role || 'student') as 'admin' | 'educator' | 'student' | 'meded_team' | 'ctf'

  if (
    !canAccessImtPortfolio({
      role,
      roleType: user?.role_type,
      foundationYear: user?.foundation_year,
      email: session.user.email,
    })
  ) {
    redirect('/dashboard')
  }

  return (
    <DashboardLayoutClient
      role={role}
      roleType={user?.role_type}
      foundationYear={user?.foundation_year}
      userName={session.user.name ?? session.user.email ?? undefined}
    >
      {children}
    </DashboardLayoutClient>
  )
}
