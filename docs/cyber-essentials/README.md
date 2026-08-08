# Cyber Essentials — Bleepy (sim.bleepy.co.uk)

Documentation for IASME Cyber Essentials certification prep, scoped to **sim.bleepy.co.uk** (not bleepy.co.uk WordPress).

**Last updated:** 8 August 2026  
**Staff:** 2 home workers (Varun Tyagi + brother)  
**Contact:** support@bleepy.co.uk

---

## Folder contents

| Document | Purpose |
|----------|---------|
| [CHECKLIST.md](./CHECKLIST.md) | Master 12-step checklist and current status |
| [SCOPE.md](./SCOPE.md) | Partial scope definition for the official assessment |
| [ASSET-REGISTER.md](./ASSET-REGISTER.md) | Devices, cloud accounts, software (fill gaps) |
| [CLOUD-SERVICES.md](./CLOUD-SERVICES.md) | In-scope vs out-of-scope cloud services |
| [OFFICIAL-ASSESSMENT-GUIDE.md](./OFFICIAL-ASSESSMENT-GUIDE.md) | Bleepy-specific answers for CE 2026 question set |
| [READINESS-TOOL-NOTES.md](./READINESS-TOOL-NOTES.md) | IASME Readiness Tool progress (Steps 1–12) |
| [IMPLEMENTATION.md](./IMPLEMENTATION.md) | Code changes deployed for CE compliance |
| [MFA-CHECKLIST.md](./MFA-CHECKLIST.md) | MFA verification for all cloud accounts |
| [HOME-WORKERS-RENTED-ACCOMMODATION.md](./HOME-WORKERS-RENTED-ACCOMMODATION.md) | Firewall/router guidance for remote staff |
| [ORGANISATION-VISA-NOTES.md](./ORGANISATION-VISA-NOTES.md) | Ltd / sole trader / Skilled Worker visa considerations |
| [../BLEEPY-PASSWORD-POLICY.md](../BLEEPY-PASSWORD-POLICY.md) | Signed password policy (v1.0) |

---

## Completed (technical)

- Password policy (12 chars, common-password blocklist) — live at `/password-policy`
- Login / register / forgot-password rate limiting (`auth_rate_limits` table in Supabase)
- Migration run in production Supabase
- Deployed to Vercel (sim.bleepy.co.uk)
- Password policy contact email: **support@bleepy.co.uk**

---

## Still to do before official submission

1. Complete asset register (laptop make/OS, router details if applicable)
2. Verify MFA on all in-scope cloud accounts
3. Confirm Windows Update + Defender on both laptops
4. Resolve **legal entity and signatory** for certification (see ORGANISATION-VISA-NOTES.md)
5. Purchase and complete IASME self-assessment on the online portal
6. Owner/board sign-off on final submission

---

## Official references

- [Cyber Essentials Requirements for IT Infrastructure v3.3](https://www.cyberessentials.ncsc.gov.uk)
- [IASME Cyber Essentials](https://iasme.co.uk/cyber-essentials/)
- Question set PDF: `CE 2026_Danzell Question Set.pdf` (local copy — not in repo)
