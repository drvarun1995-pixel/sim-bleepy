# Home workers and rented accommodation

Guidance for Bleepy (2 remote staff, rented homes).

---

## Key points

1. **You do not list your flat** as an operational office address (A1.5.1 excludes home workers).
2. **Home ISP routers are not listed** on A2.5 (CE guidance: home router details must not be included).
3. **In-scope firewall** for home workers = **Windows Firewall** on the laptop.
4. **Landlord/ISP routers** not supplied by Bleepy are **not included** in A4.2 default-password requirement (A4.2.1).

---

## Recommended answers (firewall section)

| Question | Answer |
|----------|--------|
| A4.1 Firewalls at boundaries? | **Yes** — Windows Firewall on work laptops |
| A4.1.1 Software firewalls on all devices? | **Yes** |
| A4.2 Default passwords changed? | **Yes** for **Windows device login**; home router not org-supplied |
| A4.2.1 Process | *Staff use personal home broadband. Organisation does not manage home routers. Windows Firewall enabled on all in-scope laptops. Strong unique passwords for Windows login.* |
| A4.7 Unauthenticated inbound? | **No** |
| A4.9 Router admin from internet? | **No** |

---

## What staff must do

- [ ] Windows Firewall enabled (Settings → Privacy & security → Windows Security → Firewall)
- [ ] Strong password for Windows login (not default)
- [ ] Device lock / screen timeout when away from desk
- [ ] Windows Update enabled
- [ ] Microsoft Defender real-time protection ON

---

## Optional (good practice)

If you can access the router admin page (192.168.0.1 / 192.168.1.1) and change the default password, do so — but this is **not required** for CE when the router is not org-supplied.
