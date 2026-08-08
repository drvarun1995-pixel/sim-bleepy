# Certification scope — sim.bleepy.co.uk

Use this text for **A2.1 / A2.2** on the official IASME assessment (partial organisation).

---

## A2.1 — Whole or partial?

**Partial organisation**

---

## A2.2 — Scope description (copy/adapt)

Certification covers the **sim.bleepy.co.uk** medical education and AI simulation platform, the **two staff members** who administer and develop it (home/remote workers), and all **cloud services** used to host, develop, and operate that platform.

**Included:**

- sim.bleepy.co.uk (Vercel)
- Backend and auth (Supabase)
- Source control and CI (GitHub)
- Email (Microsoft 365 / Graph API via support@bleepy.co.uk)
- Third-party APIs used by the sim (Hume AI, OpenAI, Google Analytics, Google Maps)
- Staff laptops used to access the above (2 devices)

**Excluded:**

- bleepy.co.uk WordPress marketing website
- Legacy Cloudflare config on old bleepy.co.uk site
- Services not used by sim.bleepy.co.uk (Resend, Stripe, Anthropic, Brevo, MailerLite, etc.)

---

## A2.4.1 — Home workers

**2**

---

## A2.4.2 — How home workers connect

Staff connect via home broadband. Organisational data and services are accessed through cloud services (browser, GitHub, admin dashboards). **Windows Firewall** is enabled on all in-scope laptops. Home ISP routers are not managed by the organisation (see HOME-WORKERS-RENTED-ACCOMMODATION.md).

---

## A2.5 — Network equipment (office)

**None** — no office or on-premises network.

**Notes field:**

> Two home/remote workers. Boundary protection provided by Windows Firewall on in-scope laptops. Home ISP router make/model not listed per Cyber Essentials guidance for home environments.

---

## A2.7 — Servers

**None** — all hosting is cloud-based (Vercel, Supabase).
