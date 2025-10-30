## Event Workflow Cycles

This document summarizes the supported event workflows across Booking, QR Attendance, Feedback, and Certificates, along with the typical email flow for each.

### Scenarios Overview

| # | Workflow Name | Booking | Attendance (QR) | Feedback | Certificate | Typical Email Flow |
|---|---|---|---|---|---|---|
| 1 | Full Flow (Feedback Enabled, Not Gated) | Enabled | Enabled | Enabled (template selected) | Auto (not gated), auto‑send | Booking confirmation → Attendance QR → Feedback invite → Certificate generated → Certificate email sent |
| 2 | Full Flow (Feedback Disabled) | Enabled | Enabled | Disabled | Auto (not gated), auto‑send | Booking confirmation → Attendance QR → Certificate generated → Certificate email sent |
| 3 | Full Flow + Feedback Gate | Enabled | Enabled | Required | Auto after feedback | Booking confirmation → Reminder → Feedback invite → Certificate sent |
| 4 | Attendance-Only | Disabled | Enabled | Disabled | Disabled | QR scan → “Thanks for attending” message |
| 5 | Attendance + Feedback | Disabled | Enabled | Required / Optional | Disabled | QR scan → Feedback invite / confirmation |
| 6 | Booking-Only (Roster Event) | Enabled | Disabled | Disabled | Disabled | Booking confirmation → Reminder (no QR, no cert) |
| 7 | Booking + Feedback (No QR) | Enabled | Disabled | Required / Optional | Auto after feedback completion | Booking confirmation → Feedback invite → Certificate sent |

### Notes and Guidance

- **Full Flow (Feedback Enabled/Disabled, Not Gated)**: Attendees book and scan on arrival. If feedback is enabled, they receive a feedback invite; certificates are issued automatically and emailed, not gated by feedback.
- **Full Flow + Feedback Gate**: Certificate is gated behind feedback completion. Use when feedback is mandatory.
- **Attendance-Only**: For drop‑in or informal sessions. No booking or certificates. Sends a simple thank‑you after scan.
- **Attendance + Feedback**: Collects feedback after QR scan; no certificates.
- **Booking-Only (Roster Event)**: Used for rosters or sign‑ups where no on‑site verification or certificates are needed.
- **Booking + Feedback (No QR)**: Suited for remote/async sessions. Feedback triggers certificate issuance upon completion.

Implementation should ensure feedback submission rules match your policy:

- If feedback is **anonymous**: no login required; booking/attendance not required.
- If feedback is **not anonymous**: login required; must have a successful QR attendance scan for the event; independent of booking status.


