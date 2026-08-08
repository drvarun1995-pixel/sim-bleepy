# IASME Readiness Tool — progress notes

Notes from completing the **Cyber Essentials Readiness Tool** (pre-assessment), August 2026.

---

## Completed steps

| Step | Topic | Answers / notes |
|------|-------|-----------------|
| 1 | About org | Not education provider. Micro org (<10). Sector: IT. 2 home workers. |
| 2 | Scope | Whole org + end-user devices in scope |
| 3 | Asset register | Yes — see ASSET-REGISTER.md |
| 4 | Software | Software list yes. No virtualisation. Auto-updates yes. |
| 5 | Firewalls | Yes — home routers + Windows Firewall |
| 6 | External services | No inbound ports on home routers; Vercel hosts public site |
| 7 | Cloud | Cloud list yes. MFA yes. Shared responsibility yes. |
| 8 | Secure config | Unused software removed. Business accounts only. AutoRun disabled. Phone lock yes. |
| 9 | Passwords | Policy yes (after code + doc). Brute-force protection yes (rate limiting). |
| 10 | Malware | Tick **I have malware protection software installed** (Microsoft Defender) |
| 11 | User accounts | All Yes — ensure accurate vs real practice (see ORGANISATION-VISA-NOTES for admin account use) |
| 12 | Complete on portal | — |

---

## Step 10 — Malware

Tick: **I have malware protection software installed**

Verify on both laptops: Settings → Windows Security → Virus & threat protection → Real-time protection **On**.

---

## Step 11 — User accounts (backup wording)

> New sim.bleepy.co.uk users self-register with verified email (allowed domains only). Staff accounts are created manually by the owner. We maintain a list of staff cloud accounts and remove access when someone leaves. Production admin (Vercel, Supabase, GitHub) is limited to the owner and not used for daily email or web browsing.

**Important:** Q4 (no admin for daily use) must be **Yes** only if staff use standard Windows accounts day-to-day, not local Administrator.

---

## Official assessment

The Readiness Tool is preparation only. Answers must be re-entered on the **IASME online platform** using the official question set — see [OFFICIAL-ASSESSMENT-GUIDE.md](./OFFICIAL-ASSESSMENT-GUIDE.md).

Reference PDF: `CE 2026_Danzell Question Set.pdf` (v16.3, May 2026) — keep locally, not in repo.
