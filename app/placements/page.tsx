'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Stethoscope, 
  ArrowRight, 
  Plus, 
  FileText,
  Folder,
  Loader2,
  Edit,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import Link from 'next/link';
import { useAdmin } from '@/lib/useAdmin';

interface Specialty {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  display_order: number;
  is_active: boolean;
}

export default function PlacementsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isAdmin } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSpecialties();
      fetchUserRole();
    }
  }, [status]);

  const fetchUserRole = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setUserRole(data.user?.role || '');
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const fetchSpecialties = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/placements/specialties');
      
      if (!response.ok) {
        throw new Error('Failed to fetch specialties');
      }

      const data = await response.json();
      setSpecialties(data.specialties || []);
    } catch (error) {
      console.error('Error fetching specialties:', error);
      toast.error('Failed to load specialties');
    } finally {
      setLoading(false);
    }
  };

  const canManage = () => {
    return userRole === 'admin' || userRole === 'meded_team' || userRole === 'ctf';
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <LoadingScreen message="Loading placements..." fullScreen={false} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Placements</h1>
              <p className="text-gray-600 mt-2">
                Browse specialty information, resources, and documents
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Stethoscope className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Specialties Grid */}
        {specialties.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No specialties available
              </h3>
              <p className="text-gray-600">
                Specialties will appear here once they are added
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {specialties.map((specialty) => (
              <Card key={specialty.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{specialty.name}</CardTitle>
                      {specialty.description && (
                        <CardDescription className="mt-2">
                          {specialty.description}
                        </CardDescription>
                      )}
                    </div>
                    <Stethoscope className="h-6 w-6 text-blue-600 ml-2" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Link href={`/placements/${specialty.slug}`}>
                    <Button className="w-full">
                      View Details
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
    </div>
  );
}

