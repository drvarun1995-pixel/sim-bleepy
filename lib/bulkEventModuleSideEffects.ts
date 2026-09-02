import { supabaseAdmin } from "@/utils/supabase";
import { createCronTasksForEvent } from "@/lib/cron-tasks";
import { BulkEventModuleSettings } from "@/utils/bulkUploadModuleSettings";

export async function autoGenerateEventQrCode(eventId: string) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const qrResponse = await fetch(`${baseUrl}/api/qr-codes/auto-generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId }),
    });

    if (!qrResponse.ok) {
      const errorText = await qrResponse.text();
      console.error("Failed to auto-generate QR code:", qrResponse.status, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error auto-generating QR code:", error);
    return false;
  }
}

export async function autoCreateFeedbackForm(
  eventId: string,
  eventTitle: string,
  feedbackFormTemplate: string,
  createdBy?: string | null
) {
  try {
    let form_template: "workshop" | "seminar" | "clinical_skills" | "custom" = "workshop";
    let questions: any[] | undefined;
    let anonymousEnabled = false;

    const selectedTemplate =
      feedbackFormTemplate && feedbackFormTemplate !== "auto-generate"
        ? feedbackFormTemplate
        : "auto-generate";

    if (selectedTemplate === "auto-generate") {
      form_template = "custom";
      questions = [
        {
          type: "rating",
          question: "How would you rate this event?",
          required: true,
          scale: 5,
        },
        {
          type: "text",
          question: "What did you learn from this event?",
          required: false,
        },
        {
          type: "yes_no",
          question: "Would you recommend this event to others?",
          required: true,
        },
      ];
    } else if (
      ["workshop", "seminar", "clinical_skills", "custom"].includes(selectedTemplate)
    ) {
      form_template = selectedTemplate as typeof form_template;
    } else {
      const { data: tpl } = await supabaseAdmin
        .from("feedback_templates")
        .select("id, category, questions, usage_count, anonymous_enabled")
        .eq("id", selectedTemplate)
        .single();

      if (tpl) {
        form_template = (tpl.category as typeof form_template) || "custom";
        questions = (tpl.questions as any[]) || [];
        anonymousEnabled = Boolean((tpl as any).anonymous_enabled);

        try {
          const nextCount =
            (typeof tpl.usage_count === "number" ? tpl.usage_count : 0) + 1;
          await supabaseAdmin
            .from("feedback_templates")
            .update({ usage_count: nextCount })
            .eq("id", selectedTemplate);
        } catch {
          // best effort
        }
      } else {
        form_template = "custom";
        questions = [
          {
            type: "rating",
            question: "How would you rate this event?",
            required: true,
            scale: 5,
          },
        ];
      }
    }

    try {
      await supabaseAdmin
        .from("feedback_forms")
        .update({ active: false })
        .eq("event_id", eventId)
        .eq("active", true);
    } catch {
      // likely none
    }

    const { error: insertFormError } = await supabaseAdmin.from("feedback_forms").insert({
      event_id: eventId,
      form_name: `Feedback for ${eventTitle}`,
      form_template,
      questions: questions || null,
      anonymous_enabled: anonymousEnabled,
      active: true,
      created_by: createdBy || null,
    });

    if (insertFormError) {
      console.error("Failed to auto-create feedback form:", insertFormError);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error auto-creating feedback form:", error);
    return false;
  }
}

export async function applyBulkEventModuleSideEffects(
  createdEvent: {
    id: string;
    title: string;
    date: string;
    start_time?: string | null;
    end_time?: string | null;
    booking_enabled?: boolean | null;
    feedback_enabled?: boolean | null;
    auto_generate_certificate?: boolean | null;
    certificate_template_id?: string | null;
    target_cohorts?: string[] | null;
  },
  moduleSettings: BulkEventModuleSettings,
  createdBy?: string | null
) {
  if (moduleSettings.qrAttendanceEnabled) {
    await autoGenerateEventQrCode(createdEvent.id);
  }

  if (moduleSettings.feedbackEnabled) {
    await autoCreateFeedbackForm(
      createdEvent.id,
      createdEvent.title,
      moduleSettings.feedbackFormTemplate,
      createdBy
    );
  }

  try {
    await createCronTasksForEvent(createdEvent.id, {
      date: createdEvent.date,
      end_time: createdEvent.end_time,
      start_time: createdEvent.start_time,
      booking_enabled: createdEvent.booking_enabled ?? false,
      feedback_enabled: createdEvent.feedback_enabled ?? false,
      auto_generate_certificate: createdEvent.auto_generate_certificate ?? false,
      certificate_template_id: createdEvent.certificate_template_id,
      target_cohorts: createdEvent.target_cohorts || null,
    });
  } catch (error) {
    console.error("Error creating cron tasks:", error);
  }
}
