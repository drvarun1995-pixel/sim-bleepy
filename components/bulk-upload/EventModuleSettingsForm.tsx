"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BulkEventModuleSettings } from "@/utils/bulkUploadModuleSettings";
import {
  Award,
  CalendarCheck,
  ClipboardCheck,
  MessageSquare,
  QrCode,
} from "lucide-react";

interface FeedbackTemplate {
  id: string;
  name: string;
  description?: string;
  question_count?: number;
  category?: string;
}

interface CertificateTemplate {
  id: string;
  name: string;
  description?: string;
}

interface EventModuleSettingsFormProps {
  settings: BulkEventModuleSettings;
  onChange: (settings: BulkEventModuleSettings) => void;
  categoryNames?: string[];
  feedbackTemplates: FeedbackTemplate[];
  certificateTemplates: CertificateTemplate[];
  loadingFeedbackTemplates?: boolean;
  loadingCertificateTemplates?: boolean;
  idPrefix?: string;
}

export default function EventModuleSettingsForm({
  settings,
  onChange,
  categoryNames = [],
  feedbackTemplates,
  certificateTemplates,
  loadingFeedbackTemplates = false,
  loadingCertificateTemplates = false,
  idPrefix = "module",
}: EventModuleSettingsFormProps) {
  const update = (patch: Partial<BulkEventModuleSettings>) => {
    onChange({ ...settings, ...patch });
  };

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-4 space-y-4">
        <div className="flex items-start gap-3">
          <CalendarCheck className="h-5 w-5 text-blue-700 mt-0.5" />
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id={`${idPrefix}-booking`}
                checked={settings.bookingEnabled}
                onCheckedChange={(checked) => {
                  const bookingEnabled = checked === true;
                  update({
                    bookingEnabled,
                    ...(bookingEnabled
                      ? {}
                      : {
                          autoGenerateCertificate: false,
                          certificateTemplateId: null,
                          feedbackRequiredForCertificate: false,
                          feedbackDeadlineDays: null,
                        }),
                  });
                }}
              />
              <Label htmlFor={`${idPrefix}-booking`} className="font-medium cursor-pointer">
                Enable booking
              </Label>
            </div>

            {settings.bookingEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
                <div className="md:col-span-2">
                  <Label htmlFor={`${idPrefix}-booking-label`}>Booking button label</Label>
                  <Input
                    id={`${idPrefix}-booking-label`}
                    value={settings.bookingButtonLabel}
                    onChange={(e) => update({ bookingButtonLabel: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor={`${idPrefix}-capacity`}>Capacity (optional)</Label>
                  <Input
                    id={`${idPrefix}-capacity`}
                    type="number"
                    min="1"
                    value={settings.bookingCapacity ?? ""}
                    onChange={(e) =>
                      update({
                        bookingCapacity: e.target.value
                          ? parseInt(e.target.value, 10)
                          : null,
                      })
                    }
                    placeholder="Unlimited"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor={`${idPrefix}-booking-deadline`}>
                    Booking deadline (hours before)
                  </Label>
                  <Input
                    id={`${idPrefix}-booking-deadline`}
                    type="number"
                    min="0"
                    value={settings.bookingDeadlineHours}
                    onChange={(e) =>
                      update({
                        bookingDeadlineHours: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor={`${idPrefix}-cancel-deadline`}>
                    Cancellation deadline (hours before)
                  </Label>
                  <Input
                    id={`${idPrefix}-cancel-deadline`}
                    type="number"
                    min="0"
                    value={settings.cancellationDeadlineHours}
                    onChange={(e) =>
                      update({
                        cancellationDeadlineHours: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="mt-1"
                  />
                </div>
                <div className="flex items-center gap-2 md:col-span-2">
                  <Checkbox
                    id={`${idPrefix}-waitlist`}
                    checked={settings.allowWaitlist}
                    onCheckedChange={(checked) =>
                      update({ allowWaitlist: checked === true })
                    }
                  />
                  <Label htmlFor={`${idPrefix}-waitlist`} className="cursor-pointer">
                    Allow waitlist when full
                  </Label>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Booking approval</Label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        checked={settings.approvalMode === "auto"}
                        onChange={() => update({ approvalMode: "auto" })}
                      />
                      Auto-approve
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        checked={settings.approvalMode === "manual"}
                        onChange={() => update({ approvalMode: "manual" })}
                      />
                      Manual approval
                    </label>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor={`${idPrefix}-checkbox1`}>Confirmation checkbox 1</Label>
                  <Input
                    id={`${idPrefix}-checkbox1`}
                    value={settings.confirmationCheckbox1Text}
                    onChange={(e) =>
                      update({ confirmationCheckbox1Text: e.target.value })
                    }
                    className="mt-1"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <Checkbox
                      id={`${idPrefix}-checkbox1-required`}
                      checked={settings.confirmationCheckbox1Required}
                      onCheckedChange={(checked) =>
                        update({ confirmationCheckbox1Required: checked === true })
                      }
                    />
                    <Label htmlFor={`${idPrefix}-checkbox1-required`} className="text-sm cursor-pointer">
                      Required
                    </Label>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor={`${idPrefix}-checkbox2`}>
                    Confirmation checkbox 2 (optional)
                  </Label>
                  <Input
                    id={`${idPrefix}-checkbox2`}
                    value={settings.confirmationCheckbox2Text}
                    onChange={(e) =>
                      update({ confirmationCheckbox2Text: e.target.value })
                    }
                    className="mt-1"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <Checkbox
                      id={`${idPrefix}-checkbox2-required`}
                      checked={settings.confirmationCheckbox2Required}
                      disabled={!settings.confirmationCheckbox2Text.trim()}
                      onCheckedChange={(checked) =>
                        update({ confirmationCheckbox2Required: checked === true })
                      }
                    />
                    <Label
                      htmlFor={`${idPrefix}-checkbox2-required`}
                      className="text-sm cursor-pointer"
                    >
                      Required
                    </Label>
                  </div>
                </div>
                {categoryNames.length > 0 && (
                  <div className="md:col-span-2 space-y-2">
                    <Label>Who can book (optional)</Label>
                    <div className="rounded-md border bg-white p-3 space-y-2">
                      {categoryNames.map((category) => (
                        <label key={category} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={settings.allowedCategories.includes(category)}
                            onCheckedChange={(checked) => {
                              const current = settings.allowedCategories;
                              update({
                                allowedCategories:
                                  checked === true
                                    ? [...current, category]
                                    : current.filter((item) => item !== category),
                              });
                            }}
                          />
                          {category}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-green-200 bg-green-50/70 p-4 space-y-3">
        <div className="flex items-start gap-3">
          <MessageSquare className="h-5 w-5 text-green-700 mt-0.5" />
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id={`${idPrefix}-feedback`}
                checked={settings.feedbackEnabled}
                onCheckedChange={(checked) => {
                  const feedbackEnabled = checked === true;
                  update({
                    feedbackEnabled,
                    ...(feedbackEnabled
                      ? {}
                      : { feedbackRequiredForCertificate: false }),
                  });
                }}
              />
              <Label htmlFor={`${idPrefix}-feedback`} className="font-medium cursor-pointer">
                Enable feedback
              </Label>
            </div>
            {settings.feedbackEnabled && (
              <div className="pl-7 space-y-2">
                <Label htmlFor={`${idPrefix}-feedback-template`}>Feedback template</Label>
                <Select
                  value={
                    settings.feedbackFormTemplate === "auto-generate"
                      ? "auto-generate"
                      : settings.feedbackFormTemplate
                  }
                  onValueChange={(value) => update({ feedbackFormTemplate: value })}
                  disabled={loadingFeedbackTemplates}
                >
                  <SelectTrigger id={`${idPrefix}-feedback-template`}>
                    <SelectValue
                      placeholder={
                        loadingFeedbackTemplates
                          ? "Loading templates..."
                          : "Select feedback template"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto-generate">
                      Auto-generate default form
                    </SelectItem>
                    {feedbackTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-purple-200 bg-purple-50/70 p-4 space-y-3">
        <div className="flex items-start gap-3">
          <QrCode className="h-5 w-5 text-purple-700 mt-0.5" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id={`${idPrefix}-attendance`}
                checked={settings.qrAttendanceEnabled}
                onCheckedChange={(checked) =>
                  update({ qrAttendanceEnabled: checked === true })
                }
              />
              <Label htmlFor={`${idPrefix}-attendance`} className="font-medium cursor-pointer">
                Enable QR attendance tracking
              </Label>
            </div>
            {settings.qrAttendanceEnabled && (
              <p className="text-xs text-purple-700 pl-7 flex items-center gap-1">
                <ClipboardCheck className="h-3.5 w-3.5" />
                QR codes will be generated automatically when events are created.
              </p>
            )}
          </div>
        </div>
      </div>

      {settings.bookingEnabled && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Award className="h-5 w-5 text-amber-700 mt-0.5" />
            <div className="flex-1 space-y-3">
              <div>
                <p className="font-medium text-gray-900">Certificates</p>
                <p className="text-xs text-amber-800 mt-1">
                  Available because booking is enabled for this event.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`${idPrefix}-certificates`}
                  checked={settings.autoGenerateCertificate}
                  onCheckedChange={(checked) =>
                    update({ autoGenerateCertificate: checked === true })
                  }
                />
                <Label
                  htmlFor={`${idPrefix}-certificates`}
                  className="font-medium cursor-pointer"
                >
                  Auto-generate certificate
                </Label>
              </div>

              {settings.autoGenerateCertificate && (
                <div className="pl-7 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`${idPrefix}-certificate-template`}>
                      Certificate template
                    </Label>
                    <Select
                      value={settings.certificateTemplateId || ""}
                      onValueChange={(value) =>
                        update({ certificateTemplateId: value || null })
                      }
                      disabled={loadingCertificateTemplates}
                    >
                      <SelectTrigger id={`${idPrefix}-certificate-template`}>
                        <SelectValue
                          placeholder={
                            loadingCertificateTemplates
                              ? "Loading templates..."
                              : "Select certificate template"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {certificateTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`${idPrefix}-cert-email`}
                      checked={settings.certificateAutoSendEmail}
                      onCheckedChange={(checked) =>
                        update({ certificateAutoSendEmail: checked === true })
                      }
                    />
                    <Label htmlFor={`${idPrefix}-cert-email`} className="cursor-pointer">
                      Auto-send certificate via email
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`${idPrefix}-cert-after-feedback`}
                        checked={settings.feedbackRequiredForCertificate}
                        onCheckedChange={(checked) =>
                          update({
                            feedbackRequiredForCertificate: checked === true,
                          })
                        }
                      />
                      <Label
                        htmlFor={`${idPrefix}-cert-after-feedback`}
                        className="cursor-pointer"
                      >
                        Generate after feedback completion
                      </Label>
                    </div>
                    {settings.feedbackRequiredForCertificate &&
                      !settings.feedbackEnabled && (
                        <p className="text-xs text-red-700 pl-7">
                          Enable feedback above to require it before certificates.
                        </p>
                      )}
                    {settings.feedbackRequiredForCertificate && (
                      <div className="pl-7">
                        <Label htmlFor={`${idPrefix}-feedback-deadline`}>
                          Feedback deadline (days, optional)
                        </Label>
                        <Input
                          id={`${idPrefix}-feedback-deadline`}
                          type="number"
                          min="1"
                          max="365"
                          value={settings.feedbackDeadlineDays ?? ""}
                          onChange={(e) =>
                            update({
                              feedbackDeadlineDays: e.target.value
                                ? parseInt(e.target.value, 10)
                                : null,
                            })
                          }
                          placeholder="No deadline"
                          className="mt-1"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
