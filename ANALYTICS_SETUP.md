# Sim-Bleepy Analytics Dashboard Setup Guide

This guide will help you set up the production-ready analytics dashboard for the Sim-Bleepy AI patient simulator.

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Set Up Environment Variables**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

3. **Run Database Migrations**
   ```bash
   # Apply the analytics schema
   supabase db reset
   # Or manually apply: supabase-migrations/001_analytics_schema.sql
   ```

4. **Seed Demo Data**
   ```bash
   pnpm tsx scripts/seed.ts
   ```

5. **Start Development Server**
   ```bash
   pnpm dev
   ```

6. **Access Dashboards**
   - Student: http://localhost:3000/dashboard/student
   - Educator: http://localhost:3000/dashboard/educator  
   - Admin: http://localhost:3000/dashboard/admin

## 📋 Prerequisites

- Node.js 18+ and pnpm
- Supabase project with service role key
- PostgreSQL database access

## 🔧 Environment Configuration

### Required Environment Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database URL for migrations
DATABASE_URL=postgresql://postgres:password@localhost:54322/postgres

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# AI Service Pricing (GBP)
OPENAI_PRICE_PER_1M_TOKENS_INPUT=2.50
OPENAI_PRICE_PER_1M_TOKENS_OUTPUT=10.00
HUME_PRICE_PER_MIN=0.15
ANTHROPIC_PRICE_PER_1M_TOKENS_INPUT=8.00
ANTHROPIC_PRICE_PER_1M_TOKENS_OUTPUT=24.00

# Application Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Analytics Configuration
ANALYTICS_RETENTION_DAYS=730
PURGE_OLD_TRANSCRIPTS_DAYS=365

# Feature Flags
ENABLE_AB_TESTING=true
ENABLE_COST_TRACKING=true
ENABLE_TECH_METRICS=true

# Timezone
TZ=Europe/London
```

## 🗄️ Database Schema

The analytics dashboard uses the following main tables:

### Core Tables
- `profiles` - User profiles with roles (student, educator, admin)
- `stations` - Simulation stations with specialties and difficulties
- `sessions` - User simulation sessions
- `scores` - OSCE domain scores and feedback
- `transcripts` - Session transcripts with retention policies
- `tech_metrics` - AI service performance metrics

### Management Tables
- `cohorts` - Educator cohort groups
- `cohort_members` - Cohort membership
- `cohort_assignments` - Station assignments for cohorts
- `ab_tests` - A/B testing experiments
- `billing` - User billing and subscription data

### Analytics Views
- `user_stats` - Aggregated user performance metrics
- `station_stats` - Station usage and performance statistics

## 🔐 Row Level Security (RLS)

The dashboard implements comprehensive RLS policies:

### Student Access
- Can view/edit their own sessions, scores, and transcripts
- Can view active stations
- Cannot access other users' data

### Educator Access  
- Can view aggregated data for their cohorts
- Cannot view individual transcripts without consent
- Can manage cohort assignments

### Admin Access
- Full read access to all data
- Can perform destructive operations (with safeguards)
- Can view all transcripts and tech metrics

## 📊 Dashboard Features

### Student Dashboard (`/dashboard/student`)
- **KPI Cards**: Streak, best score, average score, completion rate
- **Performance Trend**: Line chart showing scores over time
- **OSCE Domains**: Radar chart for skill assessment
- **Recent Attempts**: Table of session history
- **Skill Gaps**: AI-powered recommendations for improvement

### Educator Dashboard (`/dashboard/educator`)
- **Cohort Management**: Select and manage student cohorts
- **Invite System**: Generate cohort invite links
- **Performance Analytics**: Cohort vs global performance comparison
- **Station Usage**: Bar chart of popular stations
- **Student Table**: Individual student performance tracking
- **Assignment Builder**: Create station assignments with date ranges

### Admin Dashboard (`/dashboard/admin`)
- **Live Metrics**: Real-time user activity and system status
- **Station Performance**: Comprehensive station analytics with difficulty drift
- **Tech Health**: AI service latency, error rates, and reliability metrics
- **Cost Telemetry**: Usage costs by provider with trend analysis
- **Content Operations**: Station library and A/B test management
- **Compliance**: Transcript retention and data privacy controls

## 🎨 UI Components

The dashboard uses a modern design system built on:
- **Tailwind CSS** for styling
- **shadcn/ui** for consistent components
- **Recharts** for data visualization
- **Lucide React** for icons
- **Dark mode support** throughout

### Key Components
- `<FilterBar/>` - Shared date range and cohort filters
- `<KPIGrid/>` - Metric cards with trends
- `<TrendChart/>` - Performance over time
- `<RadarDomains/>` - OSCE domain analysis
- `<StationPerformanceTable/>` - Station analytics
- `<TechHealth/>` - System health monitoring
- `<CostTelemetry/>` - Usage cost tracking

## 🔄 Data Flow

### Server-Side Rendering (SSR)
- Initial page loads use SSR for fast rendering
- User role detection and routing
- Secure data fetching with RLS

### Client-Side Hydration
- Interactive filters and real-time updates
- Chart interactions and data exploration
- Form submissions and assignments

### Real-Time Updates
- Live metrics refresh every 30 seconds
- WebSocket integration for active sessions
- Push notifications for important events

## 📈 Analytics Features

### Performance Metrics
- P50/P95 latency tracking for AI services
- Error rate monitoring and alerting
- Session completion and abandonment rates
- User engagement and retention metrics

### Cost Tracking
- Real-time cost calculation per session
- Provider breakdown and comparison
- Budget alerts and cost optimization
- Historical cost trending

### A/B Testing
- Station variant testing framework
- Statistical significance calculation
- Winner detection and rollback capability
- Performance impact measurement

## 🔒 Security & Compliance

### Data Protection
- GDPR-compliant data retention policies
- HIPAA-ready encryption and access controls
- Automatic transcript purging
- User consent management

### Access Control
- Role-based permissions (RLS)
- API rate limiting
- Audit logging for admin actions
- Secure session management

## 🚀 Deployment

### Production Checklist
1. Set up production Supabase project
2. Configure environment variables
3. Run database migrations
4. Set up monitoring and alerting
5. Configure CDN for static assets
6. Set up backup and disaster recovery

### Performance Optimization
- Database indexing for query performance
- Chart data caching and pagination
- Image optimization and lazy loading
- API response compression

## 🛠️ Development

### Adding New Metrics
1. Add database fields to relevant tables
2. Update RLS policies if needed
3. Create new dashboard components
4. Add to seed script for demo data

### Customizing Dashboards
- Modify role-based routing in `app/dashboard/layout.tsx`
- Add new KPI cards in respective dashboard pages
- Extend filter options in `FilterBar` component
- Create new chart types using Recharts

## 📞 Support

For issues or questions:
1. Check the console for error messages
2. Verify environment variables are set correctly
3. Ensure database migrations have been applied
4. Check Supabase logs for RLS policy violations

## 🎯 Next Steps

After setup, consider:
- Setting up monitoring and alerting
- Configuring automated backups
- Implementing user onboarding flows
- Adding advanced analytics features
- Setting up CI/CD pipelines

---

**Built with ❤️ for the Sim-Bleepy platform**
