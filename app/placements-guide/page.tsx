'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Stethoscope, 
  Plus, 
  Edit,
  Trash2,
  ArrowRight,
  Loader2,
  Save,
  X,
  Eye,
  FileText,
  Folder
} from 'lucide-react';
import { toast } from 'sonner';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import Link from 'next/link';

interface Specialty {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  display_order: number;
  is_active: boolean;
}

export default function PlacementsGuidePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  
  // Dialogs
  const [showAddSpecialtyDialog, setShowAddSpecialtyDialog] = useState(false);
  const [showEditSpecialtyDialog, setShowEditSpecialtyDialog] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<Specialty | null>(null);
  
  // Form states
  const [specialtyName, setSpecialtyName] = useState('');
  const [specialtySlug, setSpecialtySlug] = useState('');
  const [specialtyDescription, setSpecialtyDescription] = useState('');
  const [specialtyDisplayOrder, setSpecialtyDisplayOrder] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchUserRole();
      fetchSpecialties();
    }
  }, [status]);

  const fetchUserRole = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        const role = data.user?.role || '';
        setUserRole(role);
        
        // Check if user has access
        if (!['admin', 'meded_team', 'ctf'].includes(role)) {
          router.push('/dashboard');
          toast.error('Access denied. Only CTF, MedEd Team, and Admin can access this page.');
        }
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const fetchSpecialties = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/placements/specialties?includeInactive=true');
      
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

  const handleAddSpecialty = async () => {
    if (!specialtyName || !specialtySlug) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch('/api/placements/specialties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: specialtyName,
          slug: specialtySlug,
          description: specialtyDescription || null,
          display_order: specialtyDisplayOrder
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create specialty');
      }

      toast.success('Specialty created successfully');
      setShowAddSpecialtyDialog(false);
      resetForm();
      fetchSpecialties();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create specialty');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditSpecialty = async () => {
    if (!editingSpecialty || !specialtyName || !specialtySlug) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch(`/api/placements/specialties/${editingSpecialty.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: specialtyName,
          slug: specialtySlug,
          description: specialtyDescription || null,
          display_order: specialtyDisplayOrder
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update specialty');
      }

      toast.success('Specialty updated successfully');
      setShowEditSpecialtyDialog(false);
      resetForm();
      fetchSpecialties();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update specialty');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSpecialty = async (specialtyId: string, specialtyName: string) => {
    if (!confirm(`Are you sure you want to delete "${specialtyName}"? This will also delete all associated pages and documents.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/placements/specialties/${specialtyId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete specialty');
      }

      toast.success('Specialty deleted successfully');
      fetchSpecialties();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete specialty');
    }
  };

  const resetForm = () => {
    setSpecialtyName('');
    setSpecialtySlug('');
    setSpecialtyDescription('');
    setSpecialtyDisplayOrder(0);
    setEditingSpecialty(null);
  };

  const openEditDialog = (specialty: Specialty) => {
    setEditingSpecialty(specialty);
    setSpecialtyName(specialty.name);
    setSpecialtySlug(specialty.slug);
    setSpecialtyDescription(specialty.description || '');
    setSpecialtyDisplayOrder(specialty.display_order);
    setShowEditSpecialtyDialog(true);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingScreen message="Loading placements guide..." />
      </div>
    );
  }

  if (!canManage()) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Placements Guide</h1>
            <p className="text-gray-600 mt-2">
              Manage specialties, pages, and documents for placements
            </p>
          </div>
          <Button onClick={() => setShowAddSpecialtyDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Specialty
          </Button>
        </div>
      </div>

      {/* Specialties List */}
      {specialties.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No specialties yet
            </h3>
            <p className="text-gray-600 mb-4">
              Get started by adding your first specialty
            </p>
            <Button onClick={() => setShowAddSpecialtyDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Specialty
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {specialties.map((specialty) => (
            <Card key={specialty.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Stethoscope className="h-5 w-5 text-blue-600" />
                      <h3 className="text-xl font-bold text-gray-900">{specialty.name}</h3>
                      {!specialty.is_active && (
                        <Badge variant="outline" className="bg-gray-100">
                          Inactive
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        Order: {specialty.display_order}
                      </Badge>
                    </div>
                    {specialty.description && (
                      <p className="text-gray-600 mb-3">{specialty.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Slug: {specialty.slug}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/placements/${specialty.slug}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(specialty)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteSpecialty(specialty.id, specialty.name)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Specialty Dialog */}
      <Dialog open={showAddSpecialtyDialog} onOpenChange={setShowAddSpecialtyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Specialty</DialogTitle>
            <DialogDescription>
              Create a new specialty for placements
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="specialtyName">Name *</Label>
              <Input
                id="specialtyName"
                value={specialtyName}
                onChange={(e) => {
                  setSpecialtyName(e.target.value);
                  // Auto-generate slug from name
                  const slug = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                  setSpecialtySlug(slug);
                }}
                placeholder="e.g., Cardiology"
              />
            </div>
            <div>
              <Label htmlFor="specialtySlug">Slug *</Label>
              <Input
                id="specialtySlug"
                value={specialtySlug}
                onChange={(e) => setSpecialtySlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="cardiology"
              />
              <p className="text-xs text-gray-500 mt-1">URL-friendly identifier (auto-generated from name)</p>
            </div>
            <div>
              <Label htmlFor="specialtyDescription">Description</Label>
              <Textarea
                id="specialtyDescription"
                value={specialtyDescription}
                onChange={(e) => setSpecialtyDescription(e.target.value)}
                placeholder="Brief description of this specialty"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="specialtyDisplayOrder">Display Order</Label>
              <Input
                id="specialtyDisplayOrder"
                type="number"
                value={specialtyDisplayOrder}
                onChange={(e) => setSpecialtyDisplayOrder(parseInt(e.target.value) || 0)}
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddSpecialtyDialog(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddSpecialty} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Specialty
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Specialty Dialog */}
      <Dialog open={showEditSpecialtyDialog} onOpenChange={setShowEditSpecialtyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Specialty</DialogTitle>
            <DialogDescription>
              Update specialty information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editSpecialtyName">Name *</Label>
              <Input
                id="editSpecialtyName"
                value={specialtyName}
                onChange={(e) => setSpecialtyName(e.target.value)}
                placeholder="e.g., Cardiology"
              />
            </div>
            <div>
              <Label htmlFor="editSpecialtySlug">Slug *</Label>
              <Input
                id="editSpecialtySlug"
                value={specialtySlug}
                onChange={(e) => setSpecialtySlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="cardiology"
              />
            </div>
            <div>
              <Label htmlFor="editSpecialtyDescription">Description</Label>
              <Textarea
                id="editSpecialtyDescription"
                value={specialtyDescription}
                onChange={(e) => setSpecialtyDescription(e.target.value)}
                placeholder="Brief description of this specialty"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="editSpecialtyDisplayOrder">Display Order</Label>
              <Input
                id="editSpecialtyDisplayOrder"
                type="number"
                value={specialtyDisplayOrder}
                onChange={(e) => setSpecialtyDisplayOrder(parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEditSpecialtyDialog(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleEditSpecialty} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Specialty
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

