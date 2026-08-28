import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { canAccessPersonalPortfolios } from '@/lib/roles'
import { supabaseAdmin } from '@/utils/supabase'

type SessionUser = {
  id?: string
  role?: string
  roleType?: string | null
  foundationYear?: string | null
}

export { canAccessPersonalPortfolios }

export async function requirePersonalPortfolioUser(product: 'IMT Portfolio' | 'Teaching Portfolio') {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const user = session.user as SessionUser
  if (
    canAccessPersonalPortfolios({
      role: user.role,
      roleType: user.roleType,
      foundationYear: user.foundationYear,
    })
  ) {
    return { session }
  }

  const { data } = await supabaseAdmin
    .from('users')
    .select('role, role_type, foundation_year')
    .eq('id', session.user.id)
    .maybeSingle()

  if (
    data &&
    canAccessPersonalPortfolios({
      role: data.role,
      roleType: data.role_type,
      foundationYear: data.foundation_year,
    })
  ) {
    return { session }
  }

  return {
    error: NextResponse.json(
      {
        error: 'Access Denied',
        message: `${product} is only accessible to foundation year doctors, CTFs and admins.`,
      },
      { status: 403 }
    ),
  }
}

export async function getPersonalPortfolioLayoutUser(email: string | null | undefined) {
  if (!email) return null
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('role, role_type, foundation_year, name')
    .eq('email', email)
    .maybeSingle()
  if (error || !data) return null
  return data
}
