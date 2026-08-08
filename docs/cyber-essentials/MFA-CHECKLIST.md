# MFA checklist — in-scope cloud services

**Required for A7.14, A7.16, A7.17** — automatic assessment fail if MFA not enabled where available.

Check each account before submitting the official IASME assessment.

| Service | Admin MFA | All user MFA | Verified by | Date |
|---------|-----------|--------------|-------------|------|
| Microsoft 365 | ☐ | ☐ | | |
| GitHub | ☐ | ☐ | | |
| Vercel | ☐ | ☐ | | |
| Supabase | ☐ | ☐ | | |
| Hume AI | ☐ | ☐ | | |
| OpenAI | ☐ | ☐ | | |
| Google (Analytics / Maps / Cloud console) | ☐ | ☐ | | |

---

## How to verify (typical locations)

- **Microsoft 365:** Azure AD / Entra → Security → MFA
- **GitHub:** Settings → Password and authentication → 2FA
- **Vercel:** Account Settings → Security
- **Supabase:** Account → Security / MFA
- **OpenAI:** Account settings → Security
- **Google:** Google Account → Security → 2-Step Verification

---

## Notes

- sim.bleepy.co.uk **end users** authenticate via NextAuth + Supabase; staff must use MFA on all **cloud admin** accounts.
- Brother: enable MFA on any cloud accounts he uses for Bleepy work.
