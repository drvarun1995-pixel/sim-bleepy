# Comprehensive Business Plan: Bleepy Medical Education Platform
## Converting to NHS-Compliant Multi-Tenant SaaS

**Version:** 1.0  
**Date:** November 2025  
**Author:** Clinical Teaching Fellow - Basildon Hospital  
**Platform:** Bleepy (sim-bleepy)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Tier 2 Visa & Company Registration](#tier-2-visa--company-registration)
3. [NHS Compliance Requirements & Costs](#nhs-compliance-requirements--costs)
4. [Converting to Multi-Tenant SaaS](#converting-to-multi-tenant-saas)
5. [Marketing Strategy](#marketing-strategy)
6. [Pricing Strategy & Models](#pricing-strategy--models)
7. [Infrastructure & Technical Costs](#infrastructure--technical-costs)
8. [Financial Projections](#financial-projections)
9. [Risk Assessment & Mitigation](#risk-assessment--mitigation)
10. [Implementation Timeline](#implementation-timeline)
11. [Appendices](#appendices)

---

## 1. Executive Summary

### Current Status
- **Platform:** Bleepy - Medical education event management platform
- **Pilot Location:** Basildon Hospital
- **User Base:** Active users from ARU, UCL, and Foundation Year programs
- **Status:** Successful pilot implementation

### Business Objective
Convert Bleepy from a single-tenant application to a multi-tenant SaaS platform, enabling NHS trusts to deploy their own branded instances with independent data, domains, and configurations.

### ⚠️ CRITICAL: Can You Start This Company on Tier 2 Visa?

**SHORT ANSWER: YES, but with restrictions**

**What You CAN Do on Tier 2 Visa:**
- ✅ Register a UK limited company
- ✅ Own shares in the company (up to 10% of sponsor company, unlimited in other companies)
- ✅ Receive dividends from company profits
- ✅ Be a company director (non-executive)

**What You CANNOT Do on Tier 2 Visa:**
- ❌ Work for your own company (unless it sponsors your visa)
- ❌ Be self-employed
- ❌ Perform day-to-day operations for your company
- ❌ Receive a salary from your company (unless sponsored)

**SOLUTION: You Need a UK Partner**
- Partner (UK national/settled) runs day-to-day operations (51% ownership)
- You own 49% and provide technical expertise (as a consultant, not employee)
- Company can pay you as a contractor/consultant (within visa rules)
- Later: Company sponsors your visa so you can work for it directly

**Alternative: Change Visa**
- Innovator Founder Visa: Allows you to work for your own company
- Cost: £4,400-£57,600 + potentially £50,000 investment
- Timeline: 3-6 months

**RECOMMENDATION: Start with Partner Model (no visa change needed initially)**

### Key Challenges
1. Tier 2 visa restrictions on business ownership and employment
2. NHS compliance requirements (IG Toolkit, GDPR, clinical safety)
3. Technical conversion to multi-tenant architecture
4. NHS procurement and contracting processes

### Investment Options

#### Option A: Full Compliance Approach (Original Plan)
**Total Startup Costs: £45,000 - £85,000**
- Company setup & legal: £3,000 - £8,000
- NHS compliance: £15,000 - £25,000
- SaaS development: £20,000 - £40,000
- Infrastructure setup: £2,000 - £5,000
- Marketing & sales: £5,000 - £7,000

#### Option B: Bootstrap Approach (RECOMMENDED for Starting)
**Total Startup Costs: £5,000 - £15,000**
- Company setup: £500 - £1,500
- Minimal compliance (GDPR + Cyber Essentials): £2,000 - £5,000
- Basic multi-tenant development (DIY/part-time): £0 - £5,000
- Infrastructure (existing Supabase/Vercel): £0 - £1,000
- Marketing (organic/word-of-mouth): £500 - £2,500

**Strategy:** Start small, prove the model, then invest in full compliance once you have paying customers.

---

## 1.5 Bootstrap Strategy: Low-Cost Start (RECOMMENDED)

### Why Bootstrap First?

**Benefits:**
- Prove the business model before major investment
- Validate market demand with real customers
- Generate revenue to fund full compliance later
- Reduce financial risk
- Test technical architecture at smaller scale

### Bootstrap Phase (Months 1-12)

#### Phase 1: Minimal Viable Company (£500 - £1,500)
**Company Setup:**
- Register Ltd company: £12 (online)
- Basic legal consultation: £200 - £500
- Company bank account: Free (many banks offer free business accounts)
- Basic accounting software: £10-20/month
- **Total: £500 - £1,500**

**Visa-Compliant Structure:**
- Partner (UK national) as Director: 51% shares
- You as Technical Advisor: 49% shares
- You provide technical work as "consultant" (not employee)
- Partner handles contracts, invoicing, operations

#### Phase 2: Minimal Compliance (£2,000 - £5,000)
**Essential Only (Skip Full ISO 27001 Initially):**

1. **GDPR Compliance (Mandatory):**
   - Privacy policy template: £200 - £500
   - Data Processing Agreement template: £300 - £800
   - Basic DPIA: £500 - £1,000
   - **Total: £1,000 - £2,300**

2. **Cyber Essentials (Not Plus) - Minimum:**
   - Cyber Essentials Basic: £300 + VAT = £360
   - Self-assessment (you do it yourself)
   - **Total: £360**

3. **DSPT Self-Assessment (Free):**
   - Complete yourself (no cost)
   - May not achieve "Standards Met" initially, but shows effort
   - **Total: £0**

4. **Basic Security:**
   - SSL certificates: Free (Let's Encrypt)
   - Basic security audit: £500 - £1,500
   - **Total: £500 - £1,500**

**Total Compliance: £1,860 - £4,160**

**What You SKIP Initially:**
- ❌ ISO 27001 (add later when you have revenue)
- ❌ Cyber Essentials Plus (upgrade later)
- ❌ Clinical Safety Officer (only if handling clinical data)
- ❌ Full NHS framework registration (register when ready to scale)

#### Phase 3: Basic Multi-Tenant Development (£0 - £5,000)

**Option A: DIY Development (FREE)**
- You build multi-tenant features yourself (evenings/weekends)
- Use existing Supabase + Vercel setup
- Add tenant_id to database tables
- Implement basic RLS policies
- Simple subdomain routing
- **Cost: £0 (your time)**

**Option B: Part-Time Developer (£2,000 - £5,000)**
- Hire freelancer for 40-100 hours
- Focus on core multi-tenant features only
- Skip advanced white-labeling initially
- **Cost: £2,000 - £5,000**

**Minimal Features Needed:**
- ✅ Tenant isolation (organization_id in database)
- ✅ Basic subdomain routing (trust1.bleepy.com)
- ✅ Separate data per tenant
- ❌ Skip: Custom domains, advanced branding, admin portal (add later)

#### Phase 4: Infrastructure (£0 - £1,000)
**Use Existing Setup:**
- Supabase Pro: £25/month (already have or upgrade)
- Vercel Pro: £20/month (if needed)
- Domain: £10-15/year
- **Total: £0 - £1,000 first year**

#### Phase 5: Organic Marketing (£500 - £2,500)
**No Paid Advertising:**
- Build case study from Basildon Hospital: £0
- LinkedIn networking: £0
- Word-of-mouth referrals: £0
- Basic website (use existing): £0
- Email outreach (free tools): £0
- Attend 1 conference (self-funded): £500 - £2,500
- **Total: £500 - £2,500**

### Bootstrap Revenue Model

**Start with Free Pilots:**
- Offer 3-6 month free pilots to 3-5 NHS trusts
- Build case studies and testimonials
- No revenue initially, but validate demand

**Then: Simple Pricing**
- **Starter: £99/month** (basic features, no custom domain)
- **Professional: £199/month** (more users, basic white-label)
- Skip Enterprise tier initially

**Year 1 Target:**
- 3-5 paying customers
- Revenue: £3,000 - £10,000/year
- Use revenue to fund full compliance

### Bootstrap to Full Compliance Transition

**When to Upgrade:**
- After 3-5 paying customers
- When revenue covers compliance costs
- When NHS trusts request full compliance

**Upgrade Path:**
- Month 12-18: Add ISO 27001 (£15,000-£31,000)
- Month 12-18: Upgrade to Cyber Essentials Plus (£1,000-£2,500)
- Month 12-18: Register on NHS frameworks (£3,500-£8,000)
- Month 18-24: Add clinical safety (if needed) (£8,000-£16,000)

**Total Bootstrap Investment: £5,000 - £15,000**
**Then invest £28,000-£58,000 in Year 2 from revenue**

### Bootstrap Financial Projection

**Year 1 (Bootstrap):**
- Investment: £5,000 - £15,000
- Revenue: £0 - £10,000 (from 0-5 customers)
- Net: -£5,000 to -£5,000

**Year 2 (Upgrade to Full Compliance):**
- Investment: £28,000 - £58,000 (compliance upgrade)
- Revenue: £20,000 - £50,000 (from 5-10 customers)
- Net: -£8,000 to -£38,000

**Year 3 (Scale):**
- Investment: £36,500 - £68,500 (ongoing compliance)
- Revenue: £50,000 - £150,000 (from 10-25 customers)
- Net: +£13,500 to +£81,500

**Break-even: Month 24-30 (Year 2-3)**

---

## 2. Tier 2 Visa & Company Registration

### 2.1 Current Visa Restrictions

**Critical Limitations:**
- ❌ **Cannot be self-employed** on Tier 2 visa
- ❌ **Cannot work for your own company** unless it sponsors you
- ⚠️ **Cannot own >10% of sponsor company** (unless salary >£159,600)
- ✅ **Can register a limited company** (but cannot work for it)

### 2.2 Options & Solutions

#### Option A: Partner/Co-Founder Model (RECOMMENDED)
**Structure:**
- UK national or settled person as Company Director (51% ownership)
- You as Technical Director/Co-Founder (49% ownership)
- Company obtains Sponsor Licence to sponsor your visa
- You transition from Tier 2 → Skilled Worker visa (sponsored by your company)

**Requirements:**
- Find a trusted partner (ideally someone in medical education/NHS)
- Register company with partner as majority shareholder
- Apply for Sponsor Licence (£536-£1,476)
- Your partner handles day-to-day operations initially
- You work part-time (within visa restrictions) until sponsorship approved

**Timeline:** 6-12 months to full transition

**Costs:**
- Company registration: £12 (online) or £40 (postal)
- Sponsor Licence application: £536 (small business)
- Skilled Worker visa: £719 (up to 3 years)
- Immigration Health Surcharge: £1,035/year × 3 = £3,105
- Immigration Skills Charge: £364/year × 3 = £1,092
- Legal consultation: £500 - £2,000
- **Total: £5,859 - £7,359**

#### Option B: Innovator Founder Visa
**Requirements:**
- Endorsement from approved UK body
- Innovative, scalable, viable business plan
- Minimum £50,000 investment (unless already endorsed)
- English language proficiency (B2 level)

**Timeline:** 3-6 months application process

**Costs:**
- Visa application: £1,036 (outside UK) / £1,292 (in-country)
- Healthcare surcharge: £624/year × 3 = £1,872
- Endorsement body fees: £500 - £1,500
- Legal consultation: £1,000 - £3,000
- Investment funds: £50,000 (if required)
- **Total: £4,408 - £57,664** (excluding investment)

#### Option C: Wait for Settlement (ILR)
**Timeline:** 5 years on Tier 2 visa
**Advantage:** No restrictions after ILR
**Disadvantage:** Long timeline, market opportunity may pass

### 2.3 Recommended Approach: Hybrid Model

**Phase 1 (Months 1-6): Preparation**
- Register company with UK partner
- Continue pilot at Basildon Hospital
- Build case study and gather metrics
- Prepare compliance documentation

**Phase 2 (Months 6-12): Transition**
- Apply for Sponsor Licence
- Begin NHS compliance certification
- Develop multi-tenant architecture
- Start marketing to other trusts

**Phase 3 (Months 12-18): Scale**
- Full company sponsorship
- Multiple NHS trust contracts
- Scale infrastructure
- Build sales team

### 2.4 Legal Structure Recommendation

**Company Type:** Private Limited Company (Ltd)
- **Name:** Bleepy Education Solutions Ltd (or similar)
- **Structure:** 51% Partner / 49% You (initially)
- **Registered Address:** UK business address
- **Share Structure:** Class A (voting) and Class B (non-voting) shares

**Annual Compliance Costs:**
- Confirmation Statement: £13/year
- Annual accounts filing: £500 - £1,500 (accountant)
- Corporation Tax registration: Free
- **Total: £513 - £1,513/year**

---

## 3. NHS Compliance Requirements & Costs

### 3.1 Mandatory Compliance Requirements

#### A. Data Security & Protection Toolkit (DSPT)
**What:** Annual self-assessment of data security standards
**Who:** All NHS suppliers handling patient or staff data
**Deadline:** Must complete before NHS contracts

**Requirements:**
- Data encryption (in transit and at rest)
- Access controls and audit logging
- Incident management procedures
- Business continuity planning
- Staff training on data protection

**Costs:**
- DSPT submission: **Free** (self-assessment)
- Technical implementation: £5,000 - £10,000
- Documentation & policies: £2,000 - £4,000
- Annual maintenance: £1,000 - £2,000/year
- **Total Initial: £8,000 - £16,000**
- **Annual: £1,000 - £2,000**

#### B. Cyber Essentials Plus Certification
**What:** Government-backed cybersecurity certification
**Who:** Mandatory for all NHS suppliers
**Validity:** 12 months (annual renewal)

**Requirements:**
- Firewalls and secure configuration
- Access controls
- Malware protection
- Patch management
- Secure update management

**Costs:**
- Cyber Essentials (basic): £300 + VAT
- Cyber Essentials Plus: £1,000 - £2,500 + VAT
- Assessment by certifying body: Included
- Remediation (if needed): £500 - £2,000
- Annual renewal: £1,000 - £2,500
- **Total Initial: £1,300 - £4,500**
- **Annual: £1,000 - £2,500**

#### C. ISO 27001 Certification (RECOMMENDED)
**What:** International standard for information security management
**Who:** Not mandatory but strongly preferred by NHS
**Validity:** 3 years (with annual surveillance audits)

**Requirements:**
- Information Security Management System (ISMS)
- Risk assessment and treatment
- Continuous improvement
- Staff training and awareness
- Incident management

**Costs:**
- Gap analysis: £2,000 - £5,000
- ISMS implementation: £10,000 - £20,000
- Initial certification audit: £3,000 - £6,000
- Annual surveillance audits: £1,500 - £3,000/year
- Re-certification (every 3 years): £3,000 - £6,000
- **Total Initial: £15,000 - £31,000**
- **Annual: £1,500 - £3,000**

#### D. GDPR Compliance
**What:** General Data Protection Regulation
**Who:** All UK businesses processing personal data
**Validity:** Ongoing compliance required

**Requirements:**
- Data Protection Impact Assessment (DPIA)
- Privacy notices and consent management
- Data Subject Access Request (DSAR) procedures
- Data breach notification procedures
- Data Processing Agreements (DPAs)

**Costs:**
- Legal consultation: £2,000 - £5,000
- DPIA documentation: £1,000 - £2,000
- Privacy policy & terms: £1,000 - £2,000
- DPO appointment (part-time): £15,000 - £30,000/year
- Annual compliance review: £1,000 - £2,000
- **Total Initial: £4,000 - £9,000**
- **Annual: £16,000 - £32,000**

#### E. Clinical Safety Standards (DCB0129/0160)
**What:** NHS Digital clinical safety requirements
**Who:** Required if platform handles clinical data or decisions
**Validity:** Ongoing compliance

**Requirements:**
- Clinical Safety Case Report
- Hazard analysis
- Clinical risk management
- Post-market surveillance

**Costs:**
- Clinical Safety Officer: £30,000 - £50,000/year (part-time: £15,000 - £25,000)
- Safety case development: £5,000 - £10,000
- Hazard analysis: £3,000 - £6,000
- Annual maintenance: £2,000 - £4,000
- **Total Initial: £8,000 - £16,000**
- **Annual: £17,000 - £29,000**

#### F. NHS Digital Framework Registration
**What:** Registration on NHS Digital procurement frameworks
**Who:** All NHS software suppliers
**Validity:** Framework-specific (typically 2-4 years)

**Frameworks:**
- Digital Capabilities for Health (DCH)
- Health Systems Support Framework (HSSF)
- G-Cloud (Cloud Services)

**Costs:**
- Framework application: £500 - £1,000
- Tender preparation: £2,000 - £5,000
- Legal review: £1,000 - £2,000
- **Total: £3,500 - £8,000** (one-time per framework)

### 3.2 Compliance Cost Summary

| Compliance Item | Initial Cost | Annual Cost | Notes |
|----------------|--------------|-------------|-------|
| DSPT | £8,000 - £16,000 | £1,000 - £2,000 | Mandatory |
| Cyber Essentials Plus | £1,300 - £4,500 | £1,000 - £2,500 | Mandatory |
| ISO 27001 | £15,000 - £31,000 | £1,500 - £3,000 | Recommended |
| GDPR | £4,000 - £9,000 | £16,000 - £32,000 | Mandatory |
| Clinical Safety | £8,000 - £16,000 | £17,000 - £29,000 | If clinical data |
| NHS Frameworks | £3,500 - £8,000 | £0 | One-time per framework |
| **TOTAL** | **£39,800 - £84,500** | **£36,500 - £68,500** | |

### 3.3 Compliance Timeline

**Month 1-3: Foundation**
- GDPR compliance (DPIA, policies)
- Cyber Essentials Plus certification
- DSPT initial assessment

**Month 4-6: Advanced**
- ISO 27001 gap analysis
- Clinical safety case (if needed)
- Framework applications

**Month 7-12: Certification**
- ISO 27001 implementation
- ISO 27001 certification audit
- NHS framework registration

---

## 4. Converting to Multi-Tenant SaaS

### 4.1 Current Architecture Analysis

**Current State:**
- Single Supabase instance
- Single database schema
- No tenant isolation
- No white-label capabilities
- Shared domain/subdomain

**Database Structure:**
- Users table (no `organization_id` or `tenant_id`)
- Events table (no tenant isolation)
- Bookings, feedback, certificates (all shared)

### 4.2 Multi-Tenant Architecture Options

#### Option A: Database per Tenant (Highest Isolation)
**Pros:**
- Complete data isolation
- Easy to customize per tenant
- Can scale individual tenants
- Easier data export/deletion

**Cons:**
- Higher infrastructure costs
- Complex migration and backup
- Harder to share analytics
- More database connections

**Cost:** £50 - £200 per tenant/month (Supabase Pro = £25/month base + per-tenant)

#### Option B: Schema per Tenant (Moderate Isolation)
**Pros:**
- Good data isolation
- Shared infrastructure
- Easier cross-tenant analytics
- Lower costs

**Cons:**
- More complex migrations
- Schema changes affect all tenants
- Limited customization per tenant

**Cost:** £25 - £100 per tenant/month

#### Option C: Shared Database with tenant_id (RECOMMENDED)
**Pros:**
- Lowest infrastructure costs
- Easiest to implement
- Simple cross-tenant analytics
- Easy to scale

**Cons:**
- Requires careful data isolation
- Higher risk of data leakage
- More complex queries

**Cost:** £25 - £50 per tenant/month (shared infrastructure)

**Recommended: Option C** for NHS trusts (cost-effective, secure with proper RLS)

### 4.3 Technical Implementation Plan

#### Phase 1: Database Schema Changes

**Step 1: Add Tenant/Organization Model**
```sql
-- Create organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL, -- e.g., "basildon-hospital"
  domain VARCHAR(255) UNIQUE, -- e.g., "teaching.basildon.nhs.uk"
  subdomain VARCHAR(100) UNIQUE, -- e.g., "basildon" for basildon.bleepy.com
  logo_url TEXT,
  primary_color VARCHAR(7), -- Hex color
  secondary_color VARCHAR(7),
  custom_css TEXT,
  settings JSONB DEFAULT '{}',
  subscription_tier VARCHAR(50) DEFAULT 'starter',
  subscription_status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add organization_id to users
ALTER TABLE users ADD COLUMN organization_id UUID REFERENCES organizations(id);
CREATE INDEX idx_users_organization ON users(organization_id);

-- Add organization_id to events
ALTER TABLE events ADD COLUMN organization_id UUID REFERENCES organizations(id);
CREATE INDEX idx_events_organization ON events(organization_id);

-- Add organization_id to all relevant tables
-- (bookings, feedback, certificates, etc.)
```

**Step 2: Row Level Security (RLS) Policies**
```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policy functions
CREATE OR REPLACE FUNCTION get_user_organization()
RETURNS UUID AS $$
  SELECT organization_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- RLS policy example for events
CREATE POLICY "Users can only see their organization's events"
ON events FOR SELECT
USING (organization_id = get_user_organization());
```

#### Phase 2: Multi-Domain & White-Label Setup

**Step 1: Domain Management**
- Use subdomain routing (e.g., `basildon.bleepy.com`)
- Support custom domains (e.g., `teaching.basildon.nhs.uk`)
- Implement domain verification and SSL certificates

**Step 2: Branding System**
```typescript
// middleware.ts - Domain-based tenant detection
export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const subdomain = hostname.split('.')[0];
  
  // Lookup organization by subdomain or domain
  const org = await getOrganizationByDomain(hostname);
  
  if (org) {
    // Set organization context
    request.headers.set('x-organization-id', org.id);
    // Apply custom branding
    request.headers.set('x-org-primary-color', org.primary_color);
    request.headers.set('x-org-logo', org.logo_url);
  }
}
```

**Step 3: Dynamic Theming**
- Store organization colors/logos in database
- Apply CSS variables at runtime
- Support custom CSS per organization
- Cache branding assets

#### Phase 3: Tenant Isolation & Security

**Step 1: API Route Protection**
```typescript
// lib/tenant-context.ts
export async function getTenantContext(request: Request) {
  const orgId = request.headers.get('x-organization-id');
  if (!orgId) throw new Error('No organization context');
  
  // Verify user belongs to organization
  const user = await getCurrentUser();
  if (user.organization_id !== orgId) {
    throw new Error('Unauthorized tenant access');
  }
  
  return { organizationId: orgId };
}

// app/api/events/route.ts
export async function GET(request: Request) {
  const { organizationId } = await getTenantContext(request);
  
  // All queries automatically filtered by organization_id
  const events = await getEvents(organizationId);
  return Response.json(events);
}
```

**Step 2: Data Export & Deletion**
- Per-tenant data export (GDPR requirement)
- Per-tenant data deletion
- Backup and restore per tenant

#### Phase 4: Admin Portal for Tenants

**Features:**
- Organization settings (branding, domain)
- User management (invite, roles)
- Billing & subscription management
- Usage analytics per tenant
- Support ticket system

### 4.4 Development Costs

| Task | Hours | Rate | Cost |
|------|-------|------|------|
| Database schema design | 20 | £50-100 | £1,000 - £2,000 |
| RLS policies implementation | 40 | £50-100 | £2,000 - £4,000 |
| Multi-domain routing | 30 | £50-100 | £1,500 - £3,000 |
| White-label branding system | 40 | £50-100 | £2,000 - £4,000 |
| Tenant admin portal | 80 | £50-100 | £4,000 - £8,000 |
| API route refactoring | 60 | £50-100 | £3,000 - £6,000 |
| Testing & QA | 40 | £50-100 | £2,000 - £4,000 |
| Documentation | 20 | £50-100 | £1,000 - £2,000 |
| Migration scripts | 30 | £50-100 | £1,500 - £3,000 |
| **TOTAL** | **360** | | **£18,000 - £36,000** |

**Timeline:** 3-6 months (depending on developer availability)

### 4.5 Infrastructure Changes

**Current:** Single Supabase instance
**Future:** Multi-tenant Supabase (shared database) or separate instances

**Option A: Shared Infrastructure (Recommended)**
- Single Supabase Pro plan: £25/month
- Additional storage: £0.125/GB/month
- Additional bandwidth: £0.09/GB
- **Cost:** £25 - £100/month (scales with usage)

**Option B: Separate Instances per Tenant**
- Per tenant: £25/month (Supabase Pro)
- **Cost:** £25 × number of tenants
- **Example:** 10 tenants = £250/month

**Recommended:** Start with Option A, move to Option B if needed for isolation

---

## 5. Marketing Strategy

### 5.1 Target Market Analysis

**Primary Targets:**
1. **NHS Hospital Trusts** (England, Wales, Scotland, Northern Ireland)
   - ~200+ NHS trusts in UK
   - Each trust has Medical Education departments
   - Average trust: 5,000-15,000 staff

2. **Medical Schools/Universities**
   - ~40 medical schools in UK
   - Need event management for teaching
   - Student cohorts: 100-300 per year

3. **Foundation Year Programmes**
   - Foundation schools coordinate training
   - Need booking and attendance systems
   - ~8,000 FY1/FY2 doctors annually

### 5.2 Marketing Channels

#### A. Direct Sales to NHS Trusts
**Strategy:**
- Identify Medical Education Leads at each trust
- Personal outreach via LinkedIn/email
- Offer free pilot (3-6 months)
- Present case study from Basildon Hospital

**Cost:**
- CRM software: £20-50/month
- Email marketing: £10-30/month
- LinkedIn Sales Navigator: £60/month
- **Total: £90-140/month**

#### B. NHS Conferences & Events
**Key Events:**
- Association for Medical Education in Europe (AMEE): £500-1,000
- Medical Education Innovation Network (MEIN): £200-500
- NHS Confederation: £500-1,500
- HETT (Healthcare Efficiency Through Technology): £1,000-2,000

**Cost per event:**
- Registration: £200-2,000
- Exhibition stand: £2,000-5,000
- Marketing materials: £500-1,000
- Travel & accommodation: £300-800
- **Total per event: £3,000-8,800**

**Recommended:** Attend 2-3 events/year = £6,000-26,400/year

#### C. Content Marketing
**Strategy:**
- Blog posts on medical education topics
- Case studies (Basildon Hospital success story)
- Webinars on event management best practices
- White papers on NHS compliance

**Cost:**
- Content writer: £100-300/article (5 articles/month = £500-1,500/month)
- Webinar platform: £50-200/month
- SEO tools: £50-100/month
- **Total: £600-1,800/month**

#### D. Digital Marketing
**Strategy:**
- Google Ads (target: "medical education platform", "NHS event management")
- LinkedIn Ads (target: Medical Education Managers)
- SEO optimization

**Cost:**
- Google Ads: £500-2,000/month (initial)
- LinkedIn Ads: £300-1,000/month
- SEO consultant: £500-1,500/month
- **Total: £1,300-4,500/month**

#### E. Partnerships
**Strategy:**
- Partner with Medical Education consultancies
- Integrate with existing NHS systems (where possible)
- Collaborate with medical schools

**Cost:**
- Partnership development: £1,000-3,000 (one-time)
- Revenue share: 10-20% of referred clients
- **Total: £1,000-3,000 + ongoing revenue share**

### 5.3 Marketing Budget Summary

| Channel | Monthly Cost | Annual Cost | Notes |
|---------|--------------|-------------|-------|
| Direct Sales Tools | £90-140 | £1,080-1,680 | CRM, email, LinkedIn |
| Conferences (prorated) | £500-2,200 | £6,000-26,400 | 2-3 events/year |
| Content Marketing | £600-1,800 | £7,200-21,600 | Blog, webinars, SEO |
| Digital Advertising | £1,300-4,500 | £15,600-54,000 | Google, LinkedIn ads |
| Partnerships | £83-250 | £1,000-3,000 | One-time + revenue share |
| **TOTAL** | **£2,573-8,890** | **£30,880-106,680** | |

### 5.4 Marketing Timeline

**Month 1-3: Foundation**
- Build case study from Basildon Hospital
- Create marketing website
- Develop sales materials
- Start content marketing

**Month 4-6: Outreach**
- Begin direct sales to 20-30 NHS trusts
- Attend first conference
- Launch digital advertising
- Publish case studies

**Month 7-12: Scale**
- Expand to 50+ trusts
- Attend 2-3 conferences
- Build partnerships
- Refine messaging based on feedback

---

## 6. Pricing Strategy & Models

### 6.1 Competitive Analysis

#### Meditribe (Direct Competitor)
**Model:** Freemium + Transaction Fee
- Base platform: **Free**
- Transaction fee: **3%** on paid events (on top of Stripe fees)
- Additional features: Paid add-ons

**Strengths:**
- Low barrier to entry (free)
- Revenue scales with usage

**Weaknesses:**
- Transaction fees can be expensive for high-volume trusts
- Limited customization

#### Other Competitors
- **Eventbrite:** 2.9% + £0.79 per ticket (not NHS-focused)
- **Doodle:** £6-8/user/month (basic event scheduling)
- **Acuity Scheduling:** £14-45/month (appointment scheduling)

### 6.2 Recommended Pricing Models

#### Model A: Tiered Subscription (RECOMMENDED for NHS)

**Starter Tier: £99/month**
- Up to 50 active users
- 50 events/month
- Basic branding (logo, colors)
- Email support
- Standard features (bookings, QR attendance, certificates)

**Professional Tier: £299/month**
- Up to 200 active users
- Unlimited events
- Full white-label (custom domain, branding)
- Priority support
- Advanced features (analytics, bulk upload, API access)

**Enterprise Tier: £799/month**
- Unlimited users
- Unlimited events
- Dedicated instance (optional)
- Dedicated support
- Custom features & integrations
- SLA guarantees

**Annual Plans:** 20% discount (pay annually)

**Example:**
- Starter annual: £99 × 12 × 0.8 = **£950/year**
- Professional annual: £299 × 12 × 0.8 = **£2,870/year**
- Enterprise annual: £799 × 12 × 0.8 = **£7,670/year**

#### Model B: Usage-Based (Alternative)

**Base Fee: £49/month**
- Includes: 100 active users, 25 events/month

**Add-ons:**
- Additional users: £1/user/month (over 100)
- Additional events: £2/event/month (over 25)
- Custom domain: £10/month
- Priority support: £50/month

**Example:**
- 200 users, 100 events/month = £49 + (£1 × 100) + (£2 × 75) = **£299/month**

#### Model C: Hybrid (Transaction Fee + Subscription)

**Base Subscription: £149/month**
- All features included
- Up to 500 users
- Unlimited events

**Transaction Fee: 2%** (only on paid events with transactions)
- Applied to events where payment is collected
- Covers payment processing costs
- Transparent to end users

**Example:**
- Monthly subscription: £149
- Event with £1,000 in ticket sales: £20 transaction fee
- **Total: £169/month**

### 6.3 Recommended Model: Tiered Subscription

**Rationale:**
- Predictable revenue for business
- Predictable costs for NHS trusts
- Easy budgeting for procurement
- No surprise fees
- NHS prefers fixed-price contracts

### 6.4 Pricing Comparison Table

| Feature | Starter | Professional | Enterprise |
|---------|---------|--------------|------------|
| Price/month | £99 | £299 | £799 |
| Active Users | 50 | 200 | Unlimited |
| Events/month | 50 | Unlimited | Unlimited |
| White-label | Basic | Full | Full + Dedicated |
| Custom Domain | ❌ | ✅ | ✅ |
| Support | Email | Priority | Dedicated |
| Analytics | Basic | Advanced | Custom |
| API Access | ❌ | ✅ | ✅ |
| SLA | ❌ | 99% | 99.9% |
| Custom Features | ❌ | ❌ | ✅ |

### 6.5 Special Pricing for NHS

**NHS Discount: 15%** (for all tiers)
- Applied to public sector organizations
- Helps with procurement approval
- Competitive with other NHS suppliers

**Multi-Trust Discount:**
- 2-5 trusts: 10% additional discount
- 6-10 trusts: 15% additional discount
- 11+ trusts: 20% additional discount

**Pilot Program:**
- 3-month free pilot (full features)
- No commitment required
- Helps build case study
- Conversion target: 40-50%

### 6.6 Revenue Projections

**Year 1:**
- 5 NHS trusts × Professional tier (£299/month) = £1,495/month
- 2 NHS trusts × Enterprise tier (£799/month) = £1,598/month
- **Total: £3,093/month = £37,116/year**

**Year 2:**
- 15 NHS trusts × Professional tier = £4,485/month
- 5 NHS trusts × Enterprise tier = £3,995/month
- **Total: £8,480/month = £101,760/year**

**Year 3:**
- 30 NHS trusts × Professional tier = £8,970/month
- 10 NHS trusts × Enterprise tier = £7,990/month
- **Total: £16,960/month = £203,520/year**

---

## 7. Infrastructure & Technical Costs

### 7.1 Hosting & Infrastructure

#### Current Setup (Single Tenant)
- Supabase Free/Pro: £0-25/month
- Vercel (hosting): £0-20/month
- Domain: £10-15/year
- **Total: £0-45/month**

#### Multi-Tenant SaaS (Recommended)

**Option A: Shared Infrastructure**
- Supabase Pro: £25/month
- Additional storage (1TB): £125/month
- Additional bandwidth (500GB): £45/month
- Vercel Pro: £20/month
- Domain & SSL: £50/year (£4/month)
- CDN (Cloudflare): £0-20/month
- **Total: £219-269/month**

**Option B: Scalable Infrastructure (AWS/Azure)**
- Database (RDS/Azure SQL): £100-300/month
- Application hosting (EC2/App Service): £50-150/month
- Storage (S3/Blob): £20-50/month
- CDN (CloudFront/Azure CDN): £20-50/month
- Load balancer: £20-50/month
- Monitoring & logging: £20-50/month
- **Total: £230-650/month**

**Recommended:** Start with Option A (Supabase + Vercel), scale to Option B if needed

### 7.2 Third-Party Services

| Service | Cost/Month | Purpose |
|---------|------------|---------|
| Email (SendGrid/Mailgun) | £10-50 | Transactional emails |
| SMS (Twilio) | £10-100 | Notifications (optional) |
| Payment Processing (Stripe) | 1.4% + 20p | Per transaction (if using) |
| Analytics (PostHog/Mixpanel) | £0-200 | User analytics |
| Error Tracking (Sentry) | £0-26 | Error monitoring |
| Backup (Automated) | £20-50 | Database backups |
| Monitoring (Datadog/New Relic) | £0-100 | Infrastructure monitoring |
| **TOTAL** | **£40-526/month** | |

### 7.3 Development & Maintenance

**Ongoing Development:**
- Bug fixes & updates: 20 hours/month × £50-100 = £1,000-2,000/month
- New features: 40 hours/month × £50-100 = £2,000-4,000/month
- **Total: £3,000-6,000/month**

**Or Hire Developer:**
- Full-time developer: £35,000-50,000/year = £2,917-4,167/month
- Part-time developer (20 hours/week): £17,500-25,000/year = £1,458-2,083/month

### 7.4 Infrastructure Cost Summary

| Category | Monthly Cost | Annual Cost |
|----------|--------------|-------------|
| Hosting (Supabase + Vercel) | £219-269 | £2,628-3,228 |
| Third-party services | £40-526 | £480-6,312 |
| Development & maintenance | £3,000-6,000 | £36,000-72,000 |
| **TOTAL** | **£3,259-6,795** | **£39,108-81,540** |

---

## 8. Financial Projections

### 8.1 Year 1 Financial Projection

**Revenue:**
- 5 Professional clients: £299 × 5 × 12 = £17,940
- 2 Enterprise clients: £799 × 2 × 12 = £19,176
- **Total Revenue: £37,116**

**Costs:**
- Company setup & legal: £5,000 (one-time)
- NHS compliance: £40,000 (one-time, year 1)
- SaaS development: £25,000 (one-time, year 1)
- Infrastructure: £39,108 (ongoing)
- Marketing: £30,880 (ongoing)
- **Total Costs: £139,988**

**Net Profit/Loss: -£102,872** (Year 1 is investment year)

### 8.2 Year 2 Financial Projection

**Revenue:**
- 15 Professional clients: £299 × 15 × 12 = £53,820
- 5 Enterprise clients: £799 × 5 × 12 = £47,940
- **Total Revenue: £101,760**

**Costs:**
- Compliance (annual): £36,500
- Infrastructure: £39,108
- Marketing: £50,000 (increased)
- Development: £36,000
- **Total Costs: £161,608**

**Net Profit/Loss: -£59,848** (Still investment phase)

### 8.3 Year 3 Financial Projection

**Revenue:**
- 30 Professional clients: £299 × 30 × 12 = £107,640
- 10 Enterprise clients: £799 × 10 × 12 = £95,880
- **Total Revenue: £203,520**

**Costs:**
- Compliance (annual): £36,500
- Infrastructure: £50,000 (scaled up)
- Marketing: £60,000
- Development: £40,000
- **Total Costs: £186,500**

**Net Profit: £17,020** (First profitable year)

### 8.4 Break-Even Analysis

**Break-even point:** Month 30-36 (Year 3)
**Required clients:** ~25-30 NHS trusts (mix of Professional and Enterprise)

### 8.5 Key Financial Metrics

**Customer Acquisition Cost (CAC):**
- Marketing spend: £30,880/year
- New customers: 7/year
- **CAC: £4,411/customer**

**Lifetime Value (LTV):**
- Average contract: 3 years
- Average monthly revenue: £299 (Professional tier)
- **LTV: £299 × 12 × 3 = £10,764**

**LTV:CAC Ratio:** £10,764 / £4,411 = **2.44:1** (Healthy, target is 3:1)

---

## 9. Risk Assessment & Mitigation

### 9.1 Visa & Legal Risks

**Risk:** Tier 2 visa restrictions prevent company operation
**Mitigation:**
- Partner with UK national as majority shareholder
- Obtain Sponsor Licence early
- Consult immigration lawyer
- **Probability:** Medium | **Impact:** High

**Risk:** NHS procurement rejection
**Mitigation:**
- Complete all compliance requirements
- Register on NHS frameworks
- Build strong case study
- **Probability:** Low | **Impact:** High

### 9.2 Technical Risks

**Risk:** Data breach or security incident
**Mitigation:**
- Implement ISO 27001
- Regular security audits
- Cyber Essentials Plus
- Cyber insurance: £5,000-10,000/year
- **Probability:** Low | **Impact:** Critical

**Risk:** Multi-tenant architecture issues
**Mitigation:**
- Thorough testing
- Phased rollout
- Backup and disaster recovery
- **Probability:** Medium | **Impact:** High

### 9.3 Market Risks

**Risk:** Low adoption by NHS trusts
**Mitigation:**
- Free pilot program
- Strong case study
- Competitive pricing
- Excellent support
- **Probability:** Medium | **Impact:** High

**Risk:** Competition from established players
**Mitigation:**
- Focus on NHS-specific features
- Better compliance
- Superior support
- **Probability:** High | **Impact:** Medium

### 9.4 Financial Risks

**Risk:** Insufficient funding for Year 1-2
**Mitigation:**
- Secure investment or loans
- Bootstrap with Basildon Hospital revenue
- Phased compliance spending
- **Probability:** Medium | **Impact:** High

**Risk:** High customer churn
**Mitigation:**
- Excellent onboarding
- Regular check-ins
- Feature requests prioritization
- Long-term contracts (annual)
- **Probability:** Low | **Impact:** Medium

---

## 10. Implementation Timeline

### Phase 1: Foundation (Months 1-3)
**Objectives:**
- Company registration
- Partner identification/onboarding
- Initial compliance (GDPR, Cyber Essentials)
- Case study development

**Deliverables:**
- Registered company
- Basic compliance certifications
- Basildon Hospital case study
- Marketing website

**Budget: £15,000-25,000**

### Phase 2: Development (Months 4-9)
**Objectives:**
- Multi-tenant architecture development
- White-label system implementation
- Admin portal development
- Testing & QA

**Deliverables:**
- Multi-tenant SaaS platform
- White-label capabilities
- Tenant admin portal
- Migration tools

**Budget: £18,000-36,000**

### Phase 3: Compliance (Months 6-12)
**Objectives:**
- ISO 27001 certification
- Clinical safety compliance
- NHS framework registration
- DSPT completion

**Deliverables:**
- Full NHS compliance
- Framework registration
- Compliance documentation

**Budget: £20,000-35,000**

### Phase 4: Launch (Months 10-12)
**Objectives:**
- Marketing campaign launch
- Sales outreach to 20-30 trusts
- Pilot program launch
- First customer acquisition

**Deliverables:**
- 3-5 pilot customers
- Sales pipeline of 10-15 trusts
- Marketing materials

**Budget: £10,000-15,000**

### Phase 5: Scale (Months 13-24)
**Objectives:**
- Acquire 10-15 paying customers
- Scale infrastructure
- Build support team
- Feature development

**Deliverables:**
- 10-15 paying customers
- Scaled infrastructure
- Support processes
- Feature roadmap execution

**Budget: £50,000-80,000 (ongoing)**

---

## 11. Appendices

### Appendix A: NHS Trust Contact Strategy

**Target Contacts:**
- Director of Medical Education (DME)
- Medical Education Manager
- Head of Postgraduate Medical Education
- Clinical Teaching Fellows

**Contact Methods:**
1. LinkedIn outreach
2. Email (find via trust websites)
3. Conference networking
4. Referrals from Basildon Hospital

**Email Template:**
```
Subject: Free Pilot: NHS Event Management Platform

Dear [Name],

I'm a Clinical Teaching Fellow at Basildon Hospital, where we've successfully piloted Bleepy, a medical education event management platform. We've managed 200+ events, tracked 1,000+ bookings, and improved attendance rates by 40%.

We're now offering a free 3-month pilot to NHS trusts. The platform includes:
- Event creation and management
- QR code attendance tracking
- Automated certificates
- Feedback collection
- Full NHS compliance (IG Toolkit, Cyber Essentials Plus, ISO 27001)

Would you be interested in a 30-minute demo?

Best regards,
[Your Name]
```

### Appendix B: Compliance Checklist

**Pre-Contract:**
- [ ] Cyber Essentials Plus certification
- [ ] DSPT self-assessment completed
- [ ] GDPR compliance documentation
- [ ] Data Processing Agreement template
- [ ] Privacy policy published
- [ ] Terms of service published

**Post-Contract:**
- [ ] ISO 27001 certification (within 12 months)
- [ ] Clinical safety case (if applicable)
- [ ] NHS framework registration
- [ ] Regular compliance audits

### Appendix C: Technical Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    NHS Trust A                          │
│  (basildon.bleepy.com or teaching.basildon.nhs.uk)     │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Multi-Tenant SaaS Platform                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Domain Router (Middleware)                      │   │
│  │  - Detects tenant by domain/subdomain           │   │
│  │  - Sets organization context                    │   │
│  └─────────────────────────────────────────────────┘   │
│                         │                                │
│                         ▼                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Application Layer (Next.js)                    │   │
│  │  - White-label theming                          │   │
│  │  - Tenant-specific routing                      │   │
│  │  - API routes with tenant isolation             │   │
│  └─────────────────────────────────────────────────┘   │
│                         │                                │
│                         ▼                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Database Layer (Supabase/PostgreSQL)           │   │
│  │  - Shared database with tenant_id               │   │
│  │  - Row Level Security (RLS) policies            │   │
│  │  - Per-tenant data isolation                    │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Appendix D: Cost Summary Table

| Category | One-Time Cost | Annual Cost | Notes |
|----------|---------------|-------------|-------|
| **Company Setup** | | | |
| Company registration | £12 | | |
| Legal consultation | £1,000-3,000 | | |
| Sponsor Licence | £536 | | |
| Visa application | £719 | | |
| IHS (3 years) | £3,105 | | |
| **Subtotal** | **£5,372-7,372** | | |
| **NHS Compliance** | | | |
| DSPT | £8,000-16,000 | £1,000-2,000 | |
| Cyber Essentials Plus | £1,300-4,500 | £1,000-2,500 | |
| ISO 27001 | £15,000-31,000 | £1,500-3,000 | |
| GDPR | £4,000-9,000 | £16,000-32,000 | |
| Clinical Safety | £8,000-16,000 | £17,000-29,000 | |
| NHS Frameworks | £3,500-8,000 | | |
| **Subtotal** | **£39,800-84,500** | **£36,500-68,500** | |
| **Development** | | | |
| Multi-tenant architecture | £18,000-36,000 | | |
| White-label system | | | |
| **Subtotal** | **£18,000-36,000** | | |
| **Infrastructure** | | | |
| Hosting (Supabase + Vercel) | | £2,628-3,228 | |
| Third-party services | | £480-6,312 | |
| Development & maintenance | | £36,000-72,000 | |
| **Subtotal** | | **£39,108-81,540** | |
| **Marketing** | | | |
| Direct sales tools | | £1,080-1,680 | |
| Conferences | | £6,000-26,400 | |
| Content marketing | | £7,200-21,600 | |
| Digital advertising | | £15,600-54,000 | |
| Partnerships | £1,000-3,000 | | |
| **Subtotal** | **£1,000-3,000** | **£29,880-103,680** | |
| **TOTAL** | **£64,172-130,872** | **£105,488-253,720** | |

### Appendix E: Key Contacts & Resources

**NHS Digital:**
- Website: https://digital.nhs.uk
- Framework enquiries: frameworks@nhs.net
- IG Toolkit: https://www.dsptoolkit.nhs.uk

**UK Visas & Immigration:**
- Website: https://www.gov.uk/government/organisations/uk-visas-and-immigration
- Sponsor Licence: https://www.gov.uk/uk-visa-sponsorship-employers

**Companies House:**
- Website: https://www.gov.uk/government/organisations/companies-house
- Registration: https://www.gov.uk/register-a-company-online

**Compliance Certifications:**
- Cyber Essentials: https://www.cyberessentials.ncsc.gov.uk
- ISO 27001: Contact BSI, LRQA, or other certifying bodies

---

## Conclusion

### Summary: Two Approaches

| Aspect | Bootstrap Approach (Recommended) | Full Compliance Approach |
|--------|--------------------------------|--------------------------|
| **Initial Investment** | £5,000 - £15,000 | £45,000 - £85,000 |
| **Year 1 Costs** | £5,000 - £15,000 | £64,000 - £131,000 |
| **Visa Change Required?** | ❌ No (use partner model) | ❌ No (use partner model) |
| **Time to First Customer** | 3-6 months | 12-18 months |
| **Risk Level** | Low | High |
| **Compliance Level** | Minimal (GDPR + Cyber Essentials) | Full (ISO 27001, etc.) |
| **Can Start Immediately?** | ✅ Yes | ❌ Requires funding |
| **Best For** | Validating business model | Established demand |

### Key Success Factors

1. **Visa Compliance:** 
   - ✅ **You CAN start on Tier 2 visa** with a UK partner (51% ownership)
   - ✅ No visa change needed initially
   - ✅ Partner handles operations; you provide technical expertise
   - ⚠️ Later: Company can sponsor your visa to work directly

2. **NHS Compliance:** 
   - **Bootstrap:** Start with GDPR + Cyber Essentials (£2,000-£5,000)
   - **Full:** Add ISO 27001 + full compliance later (£28,000-£58,000)
   - **Strategy:** Prove demand first, then invest in full compliance

3. **Technical Excellence:** 
   - Start with basic multi-tenant (tenant_id in database)
   - Build yourself (free) or hire part-time developer (£2,000-£5,000)
   - Add advanced features as revenue grows

4. **Market Positioning:** 
   - Leverage Basildon Hospital case study
   - Offer free 3-6 month pilots
   - Build testimonials before charging

5. **Financial Planning:** 
   - **Bootstrap:** £5,000-£15,000 to start
   - **Full:** £45,000-£85,000 upfront
   - **Recommendation:** Bootstrap first, upgrade with revenue

### Recommended Path Forward

**Phase 1 (Months 1-6): Bootstrap Start**
1. ✅ Find UK partner (51% ownership)
2. ✅ Register company (£12)
3. ✅ Basic GDPR compliance (£1,000-£2,300)
4. ✅ Cyber Essentials Basic (£360)
5. ✅ Build basic multi-tenant yourself (free)
6. ✅ Offer free pilots to 3-5 NHS trusts

**Phase 2 (Months 6-12): First Customers**
1. ✅ Convert pilots to paying customers (£99-£199/month)
2. ✅ Build case studies and testimonials
3. ✅ Generate £3,000-£10,000 revenue
4. ✅ Validate business model

**Phase 3 (Months 12-24): Upgrade Compliance**
1. ✅ Use revenue to fund ISO 27001 (£15,000-£31,000)
2. ✅ Upgrade to Cyber Essentials Plus (£1,000-£2,500)
3. ✅ Register on NHS frameworks (£3,500-£8,000)
4. ✅ Scale to 10-15 customers

**Phase 4 (Months 24+): Scale**
1. ✅ 25+ customers
2. ✅ £50,000-£150,000+ annual revenue
3. ✅ Full compliance maintained
4. ✅ Consider visa sponsorship to work directly

### Next Steps (Immediate)

1. **This Week:**
   - Consult immigration lawyer (confirm partner model is viable)
   - Identify potential UK partner (medical education/NHS background ideal)

2. **This Month:**
   - Register company with partner
   - Start GDPR compliance (privacy policy, DPIA)
   - Begin basic multi-tenant development

3. **Months 2-3:**
   - Complete Cyber Essentials Basic
   - Launch free pilot program
   - Reach out to 5-10 NHS trusts

**Estimated Timeline to First Paying Customer: 3-6 months (Bootstrap) or 12-18 months (Full Compliance)**

---

**Document Version:** 2.0  
**Last Updated:** November 2025  
**Changes:** Added Bootstrap Strategy and clarified visa requirements  
**Next Review:** Quarterly

