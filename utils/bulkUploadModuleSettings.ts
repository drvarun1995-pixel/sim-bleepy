export interface BulkEventModuleSettings {
  bookingEnabled: boolean;
  bookingButtonLabel: string;
  bookingCapacity: number | null;
  bookingDeadlineHours: number;
  allowWaitlist: boolean;
  confirmationCheckbox1Text: string;
  confirmationCheckbox1Required: boolean;
  confirmationCheckbox2Text: string;
  confirmationCheckbox2Required: boolean;
  cancellationDeadlineHours: number;
  allowedCategories: string[];
  approvalMode: "auto" | "manual";
  feedbackEnabled: boolean;
  feedbackFormTemplate: string;
  qrAttendanceEnabled: boolean;
  autoGenerateCertificate: boolean;
  certificateTemplateId: string | null;
  certificateAutoSendEmail: boolean;
  feedbackRequiredForCertificate: boolean;
  feedbackDeadlineDays: number | null;
}

export function defaultBulkEventModuleSettings(): BulkEventModuleSettings {
  return {
    bookingEnabled: false,
    bookingButtonLabel: "Register",
    bookingCapacity: null,
    bookingDeadlineHours: 0,
    allowWaitlist: true,
    confirmationCheckbox1Text: "I confirm my attendance at this event",
    confirmationCheckbox1Required: true,
    confirmationCheckbox2Text: "",
    confirmationCheckbox2Required: false,
    cancellationDeadlineHours: 0,
    allowedCategories: [],
    approvalMode: "auto",
    feedbackEnabled: false,
    feedbackFormTemplate: "auto-generate",
    qrAttendanceEnabled: false,
    autoGenerateCertificate: false,
    certificateTemplateId: null,
    certificateAutoSendEmail: true,
    feedbackRequiredForCertificate: false,
    feedbackDeadlineDays: null,
  };
}

export function getCategoryNamesFromEvent(event: {
  categories?: Array<{ id?: string; name?: string }>;
  category?: string;
}): string[] {
  const names = (event.categories || [])
    .map((category) => category.name?.trim())
    .filter(Boolean) as string[];

  if (names.length > 0) {
    return Array.from(new Set(names));
  }

  if (event.category?.trim()) {
    return [event.category.trim()];
  }

  return [];
}

export function moduleSettingsForEvent(
  event: {
    categories?: Array<{ id?: string; name?: string }>;
    category?: string;
    moduleSettings?: BulkEventModuleSettings;
  },
  fallback?: BulkEventModuleSettings
): BulkEventModuleSettings {
  const base = fallback || defaultBulkEventModuleSettings();
  const categoryNames = getCategoryNamesFromEvent(event);

  if (event.moduleSettings) {
    return {
      ...event.moduleSettings,
      allowedCategories:
        event.moduleSettings.allowedCategories.length > 0
          ? event.moduleSettings.allowedCategories
          : categoryNames,
    };
  }

  return {
    ...base,
    allowedCategories:
      base.allowedCategories.length > 0 ? base.allowedCategories : categoryNames,
  };
}

export function moduleSettingsToDbFields(settings: BulkEventModuleSettings) {
  return {
    booking_enabled: settings.bookingEnabled,
    booking_button_label: settings.bookingButtonLabel,
    booking_capacity: settings.bookingCapacity,
    booking_deadline_hours: settings.bookingDeadlineHours,
    allow_waitlist: settings.allowWaitlist,
    confirmation_checkbox_1_text: settings.confirmationCheckbox1Text,
    confirmation_checkbox_1_required: settings.confirmationCheckbox1Required,
    confirmation_checkbox_2_text: settings.confirmationCheckbox2Text || null,
    confirmation_checkbox_2_required: settings.confirmationCheckbox2Required,
    cancellation_deadline_hours: settings.cancellationDeadlineHours,
    allowed_roles:
      settings.allowedCategories.length > 0 ? settings.allowedCategories : null,
    approval_mode: settings.approvalMode,
    feedback_enabled: settings.feedbackEnabled,
    qr_attendance_enabled: settings.qrAttendanceEnabled,
    allow_walk_in_registration: (settings as any).allowWalkInRegistration ?? false,
    auto_generate_certificate: settings.autoGenerateCertificate,
    certificate_template_id: settings.certificateTemplateId,
    certificate_auto_send_email: settings.certificateAutoSendEmail,
    feedback_required_for_certificate: settings.feedbackRequiredForCertificate,
    feedback_deadline_days: settings.feedbackDeadlineDays,
  };
}

export function getModuleSummaryBadges(settings: BulkEventModuleSettings): string[] {
  const badges: string[] = [];
  if (settings.bookingEnabled) badges.push("Booking");
  if (settings.feedbackEnabled) badges.push("Feedback");
  if (settings.qrAttendanceEnabled) badges.push("Attendance");
  if (settings.autoGenerateCertificate) badges.push("Certificates");
  return badges;
}
