# Bleepy Analytics Dashboard

A production-ready, role-aware analytics dashboard for the **Bleepy** AI patient simulator. Built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## 🚀 Features

### 📊 Comprehensive Analytics
- **Student Dashboard**: Performance tracking, skill gap analysis, and personalized recommendations
- **Educator Dashboard**: Cohort management, assignment builder, and student progress monitoring  
- **Admin Dashboard**: Live metrics, tech health monitoring, cost telemetry, and compliance management

### 🔐 Role-Based Access Control
- **Students**: View their own progress and get AI-powered skill recommendations
- **Educators**: Manage cohorts, create assignments, and track student performance
- **Admins**: Monitor system health, manage content, and ensure compliance

### 📈 Advanced Metrics
- **Performance Analytics**: OSCE domain scoring, trend analysis, and difficulty drift tracking
- **Tech Health**: AI service latency monitoring, error rates, and system reliability
- **Cost Tracking**: Real-time usage costs by provider with budget optimization
- **A/B Testing**: Station variant testing with statistical significance

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Charts**: Recharts (Line, Bar, Radar, Pie charts)
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Timezone**: Europe/London
- **Currency**: GBP (£)

## 🏗️ Architecture

### Database Schema
- **Core Tables**: profiles, stations, sessions, scores, transcripts, tech_metrics
- **Management**: cohorts, cohort_members, cohort_assignments, ab_tests, billing
- **Analytics Views**: user_stats, station_stats
- **Security**: Comprehensive RLS policies for role-based access

### Component Structure
```
components/
├── dashboard/
│   ├── DashboardSidebar.tsx      # Role-based navigation
│   ├── FilterBar.tsx             # Shared date/cohort filters
│   ├── KPIGrid.tsx               # Metric cards
│   ├── TrendChart.tsx            # Performance over time
│   ├── RadarDomains.tsx          # OSCE domain analysis
│   ├── StationPerformanceTable.tsx
│   ├── TechHealthPanel.tsx       # System health metrics
│   ├── CostTelemetryPanel.tsx    # Usage cost tracking
│   └── ... (15+ specialized components)
└── ui/                          # shadcn/ui components
```

## 🚀 Quick Start

### 1. Installation
```bash
git clone <repository>
cd bleepy
pnpm install
```

### 2. Environment Setup
```bash
cp env.example .env.local
# Configure your Supabase credentials and AI service pricing
```

### 3. Database Setup
```bash
# Apply analytics schema
supabase db reset
# Or manually: supabase-migrations/001_analytics_schema.sql
```

### 4. Seed Demo Data
```bash
pnpm seed
# Creates 50 users, 5 stations, 1200 sessions, and realistic metrics
```

### 5. Start Development
```bash
pnpm dev
# Access dashboards at:
# - http://localhost:3000/dashboard/student
# - http://localhost:3000/dashboard/educator  
# - http://localhost:3000/dashboard/admin
```

## 📊 Dashboard Overview

### Student Dashboard
- **KPI Cards**: Current streak, best score, average performance, completion rate
- **Performance Trend**: Line chart showing improvement over time across OSCE domains
- **Skill Gap Analysis**: AI-powered recommendations for weakest domains
- **Recent Attempts**: Detailed session history with scores and feedback

### Educator Dashboard  
- **Cohort Management**: Select cohorts, generate invite links, track member progress
- **Performance Analytics**: Cohort vs global performance comparison with radar charts
- **Station Usage**: Bar charts showing most popular stations and completion rates
- **Assignment Builder**: Create time-bound station assignments with retry policies
- **Student Table**: Individual progress tracking with trend indicators

### Admin Dashboard
- **Live Metrics**: Real-time user activity, active sessions, and system uptime
- **Station Performance**: Comprehensive analytics with difficulty drift detection
- **Tech Health**: P50/P95 latency tracking, error rates, and provider performance
- **Cost Telemetry**: Usage costs by provider with trend analysis and budget alerts
- **Content Operations**: Station library management and A/B test results
- **Compliance**: Transcript retention policies and GDPR/HIPAA compliance tools

## 🔧 Configuration

### AI Service Pricing
Configure your AI provider costs in `.env.local`:
```bash
OPENAI_PRICE_PER_1M_TOKENS_INPUT=2.50
OPENAI_PRICE_PER_1M_TOKENS_OUTPUT=10.00
HUME_PRICE_PER_MIN=0.15
ANTHROPIC_PRICE_PER_1M_TOKENS_INPUT=8.00
ANTHROPIC_PRICE_PER_1M_TOKENS_OUTPUT=24.00
```

### Feature Flags
Enable/disable features as needed:
```bash
ENABLE_AB_TESTING=true
ENABLE_COST_TRACKING=true
ENABLE_TECH_METRICS=true
```

### Data Retention
Configure compliance settings:
```bash
ANALYTICS_RETENTION_DAYS=730
PURGE_OLD_TRANSCRIPTS_DAYS=365
```

## 🔐 Security & Compliance

### Row Level Security (RLS)
- **Students**: Can only access their own data
- **Educators**: Aggregate access to their cohorts only
- **Admins**: Full access with audit logging

### Data Protection
- **GDPR Compliance**: Automatic transcript purging and user consent management
- **HIPAA Ready**: Encryption, access controls, and audit trails
- **Data Encryption**: AES-256 encryption for sensitive data

### Privacy Controls
- **Transcript Retention**: Configurable retention periods with automatic purging
- **Anonymization**: PII removal for analytics while preserving insights
- **Consent Management**: Granular controls for data sharing

## 📈 Analytics Features

### Performance Tracking
- **OSCE Domains**: Data gathering, clinical management, communication
- **Difficulty Drift**: Station difficulty changes over time
- **Skill Gap Analysis**: AI-powered improvement recommendations
- **Trend Analysis**: Performance progression and regression detection

### Cost Optimization
- **Real-time Cost Tracking**: Per-session cost calculation
- **Provider Comparison**: Cost and performance analysis across AI providers
- **Budget Alerts**: Automatic notifications for cost thresholds
- **Usage Optimization**: Recommendations for cost reduction

### A/B Testing
- **Station Variants**: Test different versions of simulation stations
- **Statistical Significance**: Automatic winner detection
- **Performance Impact**: Measure improvement in completion rates and scores
- **Rollback Capability**: Safe deployment and rollback of changes

## 🚀 Production Deployment

### Prerequisites
- Supabase project with service role key
- Domain and SSL certificate
- Monitoring and alerting setup

### Deployment Steps
1. **Environment**: Configure production environment variables
2. **Database**: Apply migrations and set up backups
3. **Monitoring**: Set up performance and error monitoring
4. **Security**: Configure rate limiting and access controls
5. **CDN**: Set up static asset delivery
6. **Backup**: Configure automated database backups

### Performance Optimization
- **Database Indexing**: Optimized queries for dashboard performance
- **Chart Caching**: Intelligent caching of expensive analytics queries
- **Image Optimization**: WebP conversion and lazy loading
- **API Optimization**: Response compression and pagination

## 🛠️ Development

### Adding New Metrics
1. Add fields to relevant database tables
2. Update RLS policies if needed
3. Create dashboard components
4. Add to seed script for demo data

### Customizing Dashboards
- Modify role routing in `app/dashboard/layout.tsx`
- Add KPI cards in respective dashboard pages
- Extend filters in `FilterBar` component
- Create new chart types with Recharts

### Component Development
- Use shadcn/ui for consistent styling
- Follow existing patterns for data fetching
- Implement proper error handling and loading states
- Add accessibility features (ARIA labels, keyboard navigation)

## 📞 Support

### Troubleshooting
1. **Database Issues**: Check Supabase logs for RLS violations
2. **Performance**: Monitor database query performance
3. **Authentication**: Verify user roles and permissions
4. **Charts**: Ensure data format matches component expectations

### Common Issues
- **Font Errors**: Clear Next.js cache with `rm -rf .next`
- **Missing Data**: Run seed script to populate demo data
- **Permission Errors**: Check RLS policies and user roles
- **Chart Rendering**: Verify data structure and Recharts configuration

## 🎯 Roadmap

### Planned Features
- **Advanced Analytics**: Machine learning insights and predictions
- **Mobile App**: React Native dashboard companion
- **Integration**: LMS and assessment platform integrations
- **Automation**: Automated report generation and distribution
- **AI Insights**: GPT-powered performance analysis and recommendations

### Performance Improvements
- **Real-time Updates**: WebSocket integration for live data
- **Offline Support**: Progressive Web App capabilities
- **Advanced Caching**: Redis-based query caching
- **Microservices**: Service-oriented architecture for scalability

---

## 📄 License

Built for the Bleepy platform. All rights reserved.

**Made with ❤️ for medical education**