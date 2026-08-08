# Code implementation for Cyber Essentials

Technical controls implemented in sim-bleepy for certification evidence.

**Deployed:** August 2026  
**Production:** https://sim.bleepy.co.uk

---

## Password policy (A5.5, A7.11, A7.12)

| Item | Location |
|------|----------|
| Policy document | `docs/BLEEPY-PASSWORD-POLICY.md` |
| Public page | `/password-policy` → `app/password-policy/page.tsx` |
| Validation logic | `lib/password-policy.ts` (12 char min, common-password deny list) |
| UI guidance | `components/auth/PasswordPolicyGuidance.tsx` |
| API enforcement | `app/api/auth/register/route.ts`, `app/api/auth/reset-password/route.ts` |
| Sign-up UI | `app/auth/signin/page.tsx` |

---

## Brute-force / rate limiting (A5.7, A7.10)

| Item | Location |
|------|----------|
| Rate limit logic | `lib/auth-rate-limit.ts` |
| Login | `lib/auth.ts` (10 failed / 5 min, 15 min lockout) |
| Forgot password | `app/api/auth/forgot-password/route.ts` |
| Register (by IP) | `app/api/auth/register/route.ts` |
| Database table | `supabase/migrations/20260808120000_auth_rate_limits.sql` |
| Production table | `auth_rate_limits` in Supabase (applied via SQL Editor) |

**Behaviour:** After 10 failed attempts within 5 minutes, user sees lockout / `TOO_MANY_ATTEMPTS` for 15 minutes.

---

## Git commits

- `502a890` — Add password policy and auth rate limiting for Cyber Essentials compliance
- `5c9a0aa` — Use support@bleepy.co.uk in password policy contact details

---

## Evidence for assessor

- Live password policy: https://sim.bleepy.co.uk/password-policy
- Written policy: `docs/BLEEPY-PASSWORD-POLICY.md` (signed)
- Rate limiting: describe login lockout + Supabase `auth_rate_limits` table
