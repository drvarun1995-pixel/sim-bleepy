/** Certificates are only offered when both auto-generate and a template are set. */
export function eventCertificatesEnabled(event: {
  auto_generate_certificate?: boolean | null
  certificate_template_id?: string | null
} | null | undefined): boolean {
  return !!event?.auto_generate_certificate && !!event?.certificate_template_id
}
