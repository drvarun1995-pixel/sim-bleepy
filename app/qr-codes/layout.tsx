import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient';

async function getUserRole(userEmail: string): Promise<'admin' | 'educator' | 'student' | 'meded_team' | 'ctf'> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('email', userEmail)
    .single();

  if (error || !data) {
    console.error('Could not fetch user role from database:', error);
    return 'student';
  }
  return data.role as 'admin' | 'educator' | 'student' | 'meded_team' | 'ctf';
}

export default async function QRCodeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const role = await getUserRole(session.user.email || '');

  const profile = {
    role,
    org: 'default',
    full_name: session.user.name ?? session.user.email ?? undefined,
  };

  return (
    <DashboardLayoutClient role={profile.role} userName={profile.full_name}>
      {children}
    </DashboardLayoutClient>
  );
}


