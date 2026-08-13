/**
 * Routes wrapped in DashboardLayoutClient (sidebar + mobile "Dashboard / Welcome" header).
 * BleepyNav stays fixed full-width on these pages — no scroll shrink-to-pill transition.
 */
const DASHBOARD_SHELL_PREFIXES = [
  "/dashboard",
  "/bulk-upload-ai",
  "/calendar",
  "/clinical-sounds",
  "/bookings",
  "/certificates",
  "/attendance-tracking",
  "/teaching-portfolio",
  "/simulation-fellowship",
  "/stations",
  "/imt-portfolio",
  "/mycertificates",
  "/my-attendance",
  "/my-bookings",
  "/games-organiser",
  "/scan-attendance",
  "/placements-guide",
  "/qr-codes",
  "/placements",
  "/feedback",
  "/games",
  "/export-event-data",
  "/events-list",
  "/event-data",
  "/formats",
  "/downloads",
  "/admin-dashboard",
  "/admin-users",
  "/admin-file-requests",
  "/admin-teaching-requests",
  "/analytics",
  "/changelog",
  "/cohorts",
  "/connections",
  "/data-retention",
  "/friends",
  "/mentors",
  "/meded-contacts",
  "/request-teaching",
  "/request-file",
  "/simulator-analytics",
  "/profile",
  "/emails/send",
  "/emails/signatures",
] as const;

export function isDashboardShellRoute(pathname: string): boolean {
  return DASHBOARD_SHELL_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
