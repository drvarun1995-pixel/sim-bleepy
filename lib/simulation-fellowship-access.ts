import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function requireSimulationFellowshipUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  const userRole = (session.user as { role?: string }).role
  if (userRole !== 'ctf' && userRole !== 'admin') {
    return {
      error: NextResponse.json(
        {
          error: 'Access Denied',
          message: 'Simulation Fellowship is only accessible to CTF and Admin users.',
        },
        { status: 403 }
      ),
    }
  }
  return { session }
}
