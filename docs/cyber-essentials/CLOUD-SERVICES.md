# In-scope cloud services

For **A2.9**, **A7.14–A7.17**, and asset register.

---

## In scope (sim.bleepy.co.uk)

| Service | Type | Purpose | MFA required |
|---------|------|---------|--------------|
| Vercel | PaaS | Hosting sim.bleepy.co.uk | Yes |
| Supabase | PaaS | Database, auth storage | Yes |
| GitHub | SaaS | Source code, CI | Yes |
| Microsoft 365 / Azure Graph | SaaS | Email (support@bleepy.co.uk) | Yes |
| Hume AI | SaaS | Voice AI for sim | Yes |
| OpenAI | SaaS | AI API | Yes |
| Google Analytics | SaaS | Usage analytics | Yes |
| Google Maps API | SaaS | Maps on platform | Yes |

---

## Out of scope (not used by sim.bleepy.co.uk)

| Service | Reason |
|---------|--------|
| Cloudflare | Only on legacy bleepy.co.uk WordPress |
| WordPress / bleepy.co.uk hosting | Marketing site excluded from scope |
| Resend | Email sent via Microsoft Graph, not Resend |
| Stripe | Not used on sim |
| Anthropic | Not used |
| Brevo / MailerLite | Not used |

---

## MFA verification

Use [MFA-CHECKLIST.md](./MFA-CHECKLIST.md) before answering **A7.16** and **A7.17** (automatic fail if No).

If any service truly has no MFA option, list it in **A7.15** only after confirming on [IASME Cloud Services MFA list](https://iasme.co.uk/cloud-services-mfa/).
