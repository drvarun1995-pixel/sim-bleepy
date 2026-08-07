"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EventModuleSettingsForm from "@/components/bulk-upload/EventModuleSettingsForm";
import {
  BulkEventModuleSettings,
  defaultBulkEventModuleSettings,
  getCategoryNamesFromEvent,
  getModuleSummaryBadges,
  moduleSettingsForEvent,
} from "@/utils/bulkUploadModuleSettings";
import { sortEventsByDate } from "@/utils/bulkUploadExcelEntities";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  Settings2,
} from "lucide-react";

interface BulkUploadEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime?: string;
  categories?: Array<{ id?: string; name?: string }>;
  category?: string;
  moduleSettings?: BulkEventModuleSettings;
}

interface BulkModuleSettingsStepProps {
  events: BulkUploadEvent[];
  onContinue: (events: BulkUploadEvent[]) => void;
  onBack: () => void;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function BulkModuleSettingsStep({
  events,
  onContinue,
  onBack,
}: BulkModuleSettingsStepProps) {
  const sortedEvents = useMemo(() => sortEventsByDate(events), [events]);
  const [bulkSettings, setBulkSettings] = useState<BulkEventModuleSettings>(
    defaultBulkEventModuleSettings()
  );
  const [eventSettings, setEventSettings] = useState<
    Record<string, BulkEventModuleSettings>
  >({});
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [feedbackTemplates, setFeedbackTemplates] = useState<any[]>([]);
  const [certificateTemplates, setCertificateTemplates] = useState<any[]>([]);
  const [loadingFeedbackTemplates, setLoadingFeedbackTemplates] = useState(true);
  const [loadingCertificateTemplates, setLoadingCertificateTemplates] =
    useState(true);

  useEffect(() => {
    setEventSettings((prev) => {
      const next = { ...prev };
      for (const event of sortedEvents) {
        if (!next[event.id]) {
          next[event.id] = moduleSettingsForEvent(event);
        }
      }
      return next;
    });
  }, [sortedEvents]);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setLoadingFeedbackTemplates(true);
        setLoadingCertificateTemplates(true);

        const [feedbackResponse, certificateResponse] = await Promise.all([
          fetch("/api/feedback/templates"),
          fetch("/api/certificates/templates"),
        ]);

        const feedbackData = await feedbackResponse.json();
        const certificateData = await certificateResponse.json();

        setFeedbackTemplates(
          Array.isArray(feedbackData.templates)
            ? feedbackData.templates
            : feedbackData.data || []
        );
        setCertificateTemplates(
          Array.isArray(certificateData.templates)
            ? certificateData.templates
            : []
        );
      } catch (error) {
        console.error("Failed to load module templates:", error);
        setFeedbackTemplates([]);
        setCertificateTemplates([]);
      } finally {
        setLoadingFeedbackTemplates(false);
        setLoadingCertificateTemplates(false);
      }
    };

    loadTemplates();
  }, []);

  const applyBulkToAll = () => {
    const next: Record<string, BulkEventModuleSettings> = {};
    for (const event of sortedEvents) {
      const categoryNames = getCategoryNamesFromEvent(event);
      next[event.id] = {
        ...bulkSettings,
        allowedCategories:
          bulkSettings.allowedCategories.length > 0
            ? [...bulkSettings.allowedCategories]
            : categoryNames,
      };
    }
    setEventSettings(next);
  };

  const handleContinue = () => {
    const enriched = sortedEvents.map((event) => ({
      ...event,
      moduleSettings: eventSettings[event.id] || moduleSettingsForEvent(event, bulkSettings),
    }));
    onContinue(enriched);
  };

  return (
    <div className="space-y-6">
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Layers className="h-5 w-5 text-purple-700" />
            Enable modules for uploaded events
          </CardTitle>
          <p className="text-sm text-gray-600">
            Configure booking, feedback, attendance tracking, and certificates. Use bulk
            settings at the top, then fine-tune individual events below if needed.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-purple-200 bg-white p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-purple-700" />
              <h3 className="font-semibold text-gray-900">Apply to all events</h3>
            </div>
            <EventModuleSettingsForm
              settings={bulkSettings}
              onChange={setBulkSettings}
              feedbackTemplates={feedbackTemplates}
              certificateTemplates={certificateTemplates}
              loadingFeedbackTemplates={loadingFeedbackTemplates}
              loadingCertificateTemplates={loadingCertificateTemplates}
              idPrefix="bulk"
            />
            <Button
              type="button"
              onClick={applyBulkToAll}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Apply these settings to all {sortedEvents.length} events
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">
          Per-event settings ({sortedEvents.length})
        </h3>
        {sortedEvents.map((event) => {
          const settings =
            eventSettings[event.id] || moduleSettingsForEvent(event, bulkSettings);
          const badges = getModuleSummaryBadges(settings);
          const isExpanded = expandedEventId === event.id;

          return (
            <Card key={event.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50 border-b border-gray-200 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base break-words">{event.title}</CardTitle>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        {formatDate(event.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {event.startTime}
                        {event.endTime ? ` - ${event.endTime}` : ""}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {badges.length > 0 ? (
                        badges.map((badge) => (
                          <span
                            key={badge}
                            className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800"
                          >
                            {badge}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500">No modules enabled</span>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setExpandedEventId(isExpanded ? null : event.id)
                    }
                    className="shrink-0"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-1" />
                        Hide settings
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" />
                        Edit settings
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              {isExpanded && (
                <CardContent className="p-4">
                  <EventModuleSettingsForm
                    settings={settings}
                    onChange={(nextSettings) =>
                      setEventSettings((prev) => ({
                        ...prev,
                        [event.id]: nextSettings,
                      }))
                    }
                    categoryNames={getCategoryNamesFromEvent(event)}
                    feedbackTemplates={feedbackTemplates}
                    certificateTemplates={certificateTemplates}
                    loadingFeedbackTemplates={loadingFeedbackTemplates}
                    loadingCertificateTemplates={loadingCertificateTemplates}
                    idPrefix={`event-${event.id}`}
                  />
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Back to review
        </Button>
        <Button
          type="button"
          onClick={handleContinue}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          Continue to confirmation
        </Button>
      </div>
    </div>
  );
}
