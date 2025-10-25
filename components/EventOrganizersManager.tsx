"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  UserCircle, 
  Plus, 
  Trash2, 
  Star,
  Users
} from "lucide-react";

interface Organizer {
  id: string;
  name: string;
  is_main_organizer: boolean;
}

interface EventOrganizersManagerProps {
  eventId: string;
  initialOrganizers?: Organizer[];
  availableOrganizers: Array<{ id: string; name: string }>;
  onOrganizersChange?: (organizers: Organizer[]) => void;
}

export function EventOrganizersManager({ 
  eventId, 
  initialOrganizers = [], 
  availableOrganizers,
  onOrganizersChange 
}: EventOrganizersManagerProps) {
  const [organizers, setOrganizers] = useState<Organizer[]>(initialOrganizers);
  const [loading, setLoading] = useState(false);
  const [selectedOrganizerId, setSelectedOrganizerId] = useState<string>('');

  // Load organizers when component mounts
  useEffect(() => {
    loadOrganizers();
  }, [eventId]);

  const loadOrganizers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/events/${eventId}/organizers`);
      if (response.ok) {
        const data = await response.json();
        setOrganizers(data);
        onOrganizersChange?.(data);
      }
    } catch (error) {
      console.error('Error loading organizers:', error);
    } finally {
      setLoading(false);
    }
  };

  const addOrganizer = async () => {
    if (!selectedOrganizerId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/events/${eventId}/organizers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          organizer_id: selectedOrganizerId,
          is_main_organizer: false 
        })
      });

      if (response.ok) {
        await loadOrganizers();
        setSelectedOrganizerId('');
      } else {
        const error = await response.json();
        console.error('Error adding organizer:', error);
      }
    } catch (error) {
      console.error('Error adding organizer:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeOrganizer = async (organizerId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/events/${eventId}/organizers?organizer_id=${organizerId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadOrganizers();
      } else {
        const error = await response.json();
        console.error('Error removing organizer:', error);
      }
    } catch (error) {
      console.error('Error removing organizer:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMainOrganizer = async (organizerId: string, isMain: boolean) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/events/${eventId}/organizers`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          organizer_id: organizerId,
          is_main_organizer: !isMain 
        })
      });

      if (response.ok) {
        await loadOrganizers();
      } else {
        const error = await response.json();
        console.error('Error updating organizer:', error);
      }
    } catch (error) {
      console.error('Error updating organizer:', error);
    } finally {
      setLoading(false);
    }
  };

  const mainOrganizers = organizers.filter(org => org.is_main_organizer);
  const additionalOrganizers = organizers.filter(org => !org.is_main_organizer);
  const availableToAdd = availableOrganizers.filter(org => 
    !organizers.some(existing => existing.id === org.id)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Event Organizers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Organizers */}
        {mainOrganizers.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              Main Organizers
            </h4>
            <div className="space-y-2">
              {mainOrganizers.map((organizer) => (
                <div key={organizer.id} className="flex items-center justify-between p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">{organizer.name}</span>
                    <Badge variant="secondary" className="text-xs">Main</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleMainOrganizer(organizer.id, true)}
                      disabled={loading}
                    >
                      Make Additional
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeOrganizer(organizer.id)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Organizers */}
        {additionalOrganizers.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <UserCircle className="h-4 w-4 text-blue-500" />
              Additional Organizers
            </h4>
            <div className="space-y-2">
              {additionalOrganizers.map((organizer) => (
                <div key={organizer.id} className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <UserCircle className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">{organizer.name}</span>
                    <Badge variant="outline" className="text-xs">Additional</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleMainOrganizer(organizer.id, false)}
                      disabled={loading}
                    >
                      Make Main
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeOrganizer(organizer.id)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add New Organizer */}
        {availableToAdd.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Add Organizer</h4>
            <div className="flex gap-2">
              <Select value={selectedOrganizerId} onValueChange={setSelectedOrganizerId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select an organizer" />
                </SelectTrigger>
                <SelectContent>
                  {availableToAdd.map((organizer) => (
                    <SelectItem key={organizer.id} value={organizer.id}>
                      {organizer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={addOrganizer} 
                disabled={!selectedOrganizerId || loading}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
        )}

        {organizers.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            <UserCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No organizers assigned to this event</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


