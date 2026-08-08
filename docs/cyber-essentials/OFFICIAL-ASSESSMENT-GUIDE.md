# Official CE 2026 assessment — Bleepy answer guide

Bleepy-specific notes for **IASME Cyber Essentials** (Danzell question set v16.3, May 2026).  
Enter final answers on the **IASME online portal** — this file is for preparation only.

**Scope:** sim.bleepy.co.uk partial organisation  
**Staff:** 2 home workers  
**Contact:** support@bleepy.co.uk

See also: [SCOPE.md](./SCOPE.md), [ASSET-REGISTER.md](./ASSET-REGISTER.md), [CLOUD-SERVICES.md](./CLOUD-SERVICES.md)

---

## A1 — Your company

| Q | Answer | Notes |
|---|--------|-------|
| A1.1 | TODO legal name | One legal entity; can include "trading as Bleepy". Confirm with immigration adviser if signatory is not you. |
| A1.2 | SOL or LTD | Sole trader = SOL + company number `none`. Ltd = LTD + Companies House number. |
| A1.3 | 2 | |
| A1.4 | TODO or `none` | Sole trader: `none` |
| A1.5 | TODO | Registered / trading address |
| A1.5.1 | Registered address only or N/A | Home worker addresses **not** listed here |
| A1.6 | No | Unless subsidiaries share same IT |
| A1.7 | IT | |
| A1.8 | https://sim.bleepy.co.uk | |
| A1.9 | First Time Application | Unless renewing |
| A1.11 | Yes | Read NCSC Requirements v3.3 |
| A2.10 | Varun Tyagi — TODO confirm title | IT responsible person; must be org member |

---

## A2 — Scope

| Q | Answer |
|---|--------|
| A2.1 | **Partial organisation** |
| A2.2 | See [SCOPE.md](./SCOPE.md) |
| A2.4.1 | 2 |
| A2.4.2 | Home broadband + cloud access; Windows Firewall on laptops |
| A2.5 | None (note: home workers use Windows Firewall) |
| A2.6 | TODO — 2 laptops with make + Windows 11 edition/version |
| A2.7 | None |
| A2.8 | 0 (or list phones if used for work) |
| A2.9 | See [CLOUD-SERVICES.md](./CLOUD-SERVICES.md) |

---

## A4 — Firewalls

| Q | Answer |
|---|--------|
| A4.1 | Yes |
| A4.1.1 | Yes |
| A4.2 | Yes (device passwords; home router not org-supplied) |
| A4.2.1 | See [HOME-WORKERS-RENTED-ACCOMMODATION.md](./HOME-WORKERS-RENTED-ACCOMMODATION.md) |
| A4.3 | **C** — 12 char minimum |
| A4.4 | Yes |
| A4.5 | Yes |
| A4.6 | Yes — annual review; no inbound home router ports |
| A4.7 | **No** |
| A4.8 | No inbound on home routers; public site on Vercel |
| A4.9 | **No** |

---

## A5 — Secure configuration

| Q | Answer |
|---|--------|
| A5.1 | Yes — remove unused software |
| A5.2 | Yes — one account per person |
| A5.3 | Yes — 12 char policy |
| A5.4 | **Yes** — sim.bleepy.co.uk on Vercel |
| A5.5 | **C** — 12 char minimum |
| A5.6 | Password policy — notify support@bleepy.co.uk |
| A5.7 | **B** — lock after 10 attempts (implemented in code) |
| A5.8 | Yes — AutoRun disabled |
| A5.9 | Yes |
| A5.10 | Password / Windows Hello |

---

## A6 — Security updates ⚠️ auto-fail if wrong

| Q | Answer |
|---|--------|
| A6.1 | Yes — supported Windows 11 |
| A6.2 | Yes |
| A6.2.1 | TODO — Edge + Chrome versions |
| A6.2.2 | Microsoft Defender + version |
| A6.2.3 | Microsoft 365 / Outlook |
| A6.2.4 | Microsoft 365 |
| A6.3 | No |
| A6.4 | **Yes** |
| A6.4.1 | **Yes** — Windows Update auto |
| A6.5 | **Yes** |
| A6.5.1 | Yes where possible |
| A6.6 | Yes |
| A6.7 | No unsupported software in use |

---

## A7 — User access & passwords ⚠️ MFA auto-fail

| Q | Answer |
|---|--------|
| A7.1 | Yes — approved account creation process |
| A7.2 | Yes — unique credentials, no sharing |
| A7.3 | Yes — disable leavers |
| A7.4 | Yes — least privilege |
| A7.5–A7.9 | Yes — admin process, separate accounts, tracked, reviewed annually |
| A7.10 | MFA + rate limiting on sim login |
| A7.11 | 12 char + deny list (see IMPLEMENTATION.md) |
| A7.12 | /password-policy + sign-up guidance |
| A7.13 | Yes — password policy compromised-account section |
| A7.14 | **Yes** — MFA available on all cloud |
| A7.16 | **Yes** — MFA on all admins |
| A7.17 | **Yes** — MFA on all users |

Verify MFA: [MFA-CHECKLIST.md](./MFA-CHECKLIST.md)

---

## A8 — Malware

| Q | Answer |
|---|--------|
| A8.1 | **A** — anti-malware (Microsoft Defender) |
| A8.2 | Yes — updates + blocks malware |
| A8.3 | Yes — SmartScreen / malicious site protection |

Option B (app allow listing) only if you maintain a formal approved-apps list.

---

## Automatic fail questions (double-check)

- A6.4 — critical OS updates within 14 days
- A6.5 — critical app updates within 14 days
- A7.16 — MFA on all cloud **admins**
- A7.17 — MFA on all cloud **users**
- A7.15 — must not list services that actually have MFA

---

## Sign-off

Certificate requires approval by **board level representative, business owner or equivalent** — resolve entity/signatory before submission (see [ORGANISATION-VISA-NOTES.md](./ORGANISATION-VISA-NOTES.md)).
