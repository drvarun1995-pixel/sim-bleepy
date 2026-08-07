"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  Loader2,
  MapPin,
  Mic,
  UserCircle,
  X,
} from "lucide-react";
import {
  UnmatchedEntitiesSummary,
  UnmatchedEntityItem,
  hasUnmatchedEntities,
} from "@/utils/bulkUploadEntityMatching";

interface UnmatchedEntitiesPromptProps {
  unmatched: UnmatchedEntitiesSummary;
  onDismiss: () => void;
  onCreated: () => Promise<void>;
}

type EntityType = "speakers" | "organizers" | "locations";

function entityKey(type: EntityType, name: string) {
  return `${type}:${name}`;
}

export default function UnmatchedEntitiesPrompt({
  unmatched,
  onDismiss,
  onCreated,
}: UnmatchedEntitiesPromptProps) {
  const [expanded, setExpanded] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [speakerDesignations, setSpeakerDesignations] = useState<Record<string, string>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const totalUnmatched = useMemo(
    () =>
      unmatched.speakers.length +
      unmatched.organizers.length +
      unmatched.locations.length,
    [unmatched]
  );

  useEffect(() => {
    const defaults = new Set<string>();
    const designations: Record<string, string> = {};

    unmatched.speakers.forEach((item) => {
      defaults.add(entityKey("speakers", item.name));
      designations[item.name] = "Speaker";
    });
    unmatched.organizers.forEach((item) => {
      defaults.add(entityKey("organizers", item.name));
    });
    unmatched.locations.forEach((item) => {
      defaults.add(entityKey("locations", item.name));
    });

    setSelected(defaults);
    setSpeakerDesignations(designations);
    setSuccessMessage(null);
    setError(null);
  }, [unmatched]);

  if (!hasUnmatchedEntities(unmatched)) {
    return null;
  }

  const toggleItem = (type: EntityType, name: string, checked: boolean) => {
    const key = entityKey(type, name);
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const handleCreateSelected = async () => {
    setIsCreating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const createSpeaker = async (name: string) => {
        const res = await fetch("/api/events/speakers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            role: speakerDesignations[name]?.trim() || "Speaker",
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || `Failed to create speaker "${name}"`);
        }
      };

      const createOrganizer = async (name: string) => {
        const res = await fetch("/api/events/organizers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || `Failed to create organizer "${name}"`);
        }
      };

      const createLocation = async (name: string) => {
        const res = await fetch("/api/events/locations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || `Failed to create location "${name}"`);
        }
      };

      for (const item of unmatched.speakers) {
        if (selected.has(entityKey("speakers", item.name))) {
          await createSpeaker(item.name);
        }
      }
      for (const item of unmatched.organizers) {
        if (selected.has(entityKey("organizers", item.name))) {
          await createOrganizer(item.name);
        }
      }
      for (const item of unmatched.locations) {
        if (selected.has(entityKey("locations", item.name))) {
          await createLocation(item.name);
        }
      }

      await onCreated();
      setSuccessMessage("Selected items were created and linked to your events.");
      setExpanded(false);
    } catch (err: any) {
      setError(err.message || "Failed to create selected items.");
    } finally {
      setIsCreating(false);
    }
  };

  const renderGroup = (
    type: EntityType,
    title: string,
    icon: ReactNode,
    items: UnmatchedEntityItem[],
    showDesignationInput = false
  ) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          {icon}
          {title}
        </div>
        <div className="space-y-2">
          {items.map((item) => {
            const key = entityKey(type, item.name);
            const checked = selected.has(key);
            return (
              <div
                key={key}
                className="flex flex-col gap-2 rounded-lg border border-amber-100 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(value) =>
                      toggleItem(type, item.name, value === true)
                    }
                    className="mt-0.5"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="font-medium text-gray-900">{item.name}</span>
                    <span className="block text-xs text-gray-500 mt-0.5">
                      Found in {item.usedInEvents} event
                      {item.usedInEvents > 1 ? "s" : ""} in your upload
                    </span>
                    {item.eventTitles?.length > 0 && (
                      <ul className="mt-2 space-y-1 text-xs text-gray-600">
                        {item.eventTitles.map((eventTitle) => (
                          <li key={eventTitle} className="flex items-start gap-1.5">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span className="break-words">{eventTitle}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </span>
                </label>
                {showDesignationInput && checked && (
                  <div className="sm:w-52 shrink-0">
                    <Label htmlFor={`designation-${item.name}`} className="text-xs text-gray-600 mb-1 block">
                      Designation
                    </Label>
                    <Input
                      id={`designation-${item.name}`}
                      value={speakerDesignations[item.name] || "Speaker"}
                      onChange={(e) =>
                        setSpeakerDesignations((prev) => ({
                          ...prev,
                          [item.name]: e.target.value,
                        }))
                      }
                      placeholder="e.g. Consultant, FY1 Doctor"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card className="border-amber-300 bg-amber-50/80 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <CardTitle className="text-base sm:text-lg text-amber-950">
                New speakers, organisers, or locations found
              </CardTitle>
              <p className="text-sm text-amber-800 mt-1">
                Your Excel file mentions {totalUnmatched} name
                {totalUnmatched > 1 ? "s" : ""} that are not in Bleepy yet.
                Nothing will be created automatically — choose what to add, then
                we will link them to the uploaded events.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            className="text-amber-700 hover:text-amber-900 hover:bg-amber-100 flex-shrink-0"
            aria-label="Dismiss prompt"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-5 pt-0">
          {renderGroup(
            "speakers",
            "Speakers",
            <Mic className="h-4 w-4 text-amber-700" />,
            unmatched.speakers,
            true
          )}
          {renderGroup(
            "organizers",
            "Organisers",
            <UserCircle className="h-4 w-4 text-amber-700" />,
            unmatched.organizers
          )}
          {renderGroup(
            "locations",
            "Locations",
            <MapPin className="h-4 w-4 text-amber-700" />,
            unmatched.locations
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
              {successMessage}
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              onClick={handleCreateSelected}
              disabled={isCreating || selected.size === 0}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating selected...
                </>
              ) : (
                <>Create selected ({selected.size})</>
              )}
            </Button>
            <Button variant="outline" onClick={onDismiss} disabled={isCreating}>
              Skip for now
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
