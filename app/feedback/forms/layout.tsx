import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

async function getUserRole(email: string) {
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('email', email)
    .single()
  
  return user?.role || 'student'
}

export default async function FeedbackFormsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Sidebar is already provided by parent layout at app/feedback/layout.tsx.
  // Avoid nested dashboard wrappers to prevent duplicate sidebars.
  return <>{children}</>
}
