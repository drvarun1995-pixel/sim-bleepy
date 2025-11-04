# API Usage Tracking Implementation Guide

This guide shows you how to integrate real-time API usage tracking for Hume AI and OpenAI services in your Bleepy dashboard.

## 🚀 Quick Start

### 1. Database Setup

First, run the API usage tracking migration:

```bash
# Apply the migration to create the api_usage table
psql -h localhost -p 54322 -U postgres -d postgres -f supabase-migrations/002_api_usage_tracking.sql
```

### 2. Environment Configuration

Add these variables to your `.env.local` file:

```env
# API Keys
HUME_API_KEY=your_hume_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Pricing Configuration (GBP)
HUME_PRICE_PER_MIN=0.15
HUME_PRICE_PER_TOKEN=0.001
OPENAI_PRICE_PER_1M_TOKENS_INPUT=2.50
OPENAI_PRICE_PER_1M_TOKENS_OUTPUT=10.00
OPENAI_PRICE_PER_1K_TOKENS_EMBEDDINGS=0.0001
```

### 3. Basic Integration

#### For Hume AI API calls:

```typescript
import { createHumeTracker } from '@/lib/apiMiddleware'

export async function POST(request: NextRequest) {
  const sessionId = request.headers.get('x-session-id') || 'unknown'
  const humeTracker = createHumeTracker(sessionId)
  
  const startTime = Date.now()
  
  // Your Hume API call
  const response = await fetch('https://api.hume.ai/v0/batch/jobs', {
    method: 'POST',
    headers: {
      'X-Hume-Api-Key': process.env.HUME_API_KEY!,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      // Your request body
    })
  })
  
  const endTime = Date.now()
  
  // Track the usage
  await humeTracker.trackASRCall(endTime - startTime, {
    endpoint: '/batch/jobs',
    success: response.ok
  })
  
  return NextResponse.json(await response.json())
}
```

#### For OpenAI API calls:

```typescript
import { createOpenAITracker } from '@/lib/apiMiddleware'

export async function POST(request: NextRequest) {
  const sessionId = request.headers.get('x-session-id') || 'unknown'
  const openaiTracker = createOpenAITracker(sessionId)
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [...],
      // ... other params
    })
  })
  
  const result = await response.json()
  
  // Track the usage
  await openaiTracker.trackChatCompletion(
    result.usage.prompt_tokens,
    result.usage.completion_tokens,
    {
      model: 'gpt-4',
      endpoint: '/chat/completions'
    }
  )
  
  return NextResponse.json(result)
}
```

## 📊 Dashboard Integration

The dashboard automatically displays real-time usage data:

1. **Cost Telemetry Panel**: Shows total costs, provider breakdown, and service breakdown
2. **Real-time Updates**: Data refreshes every 30 seconds
3. **Historical Data**: View usage trends over time

### API Endpoints

- `GET /api/analytics/usage-summary` - Get usage summary for a date range
- `GET /api/analytics/realtime-usage` - Get current real-time metrics

## 🔧 Advanced Configuration

### Custom Pricing

Update the pricing in your environment variables:

```env
# Custom pricing for your use case
HUME_PRICE_PER_MIN=0.20
OPENAI_PRICE_PER_1M_TOKENS_INPUT=3.00
```

### Custom Metadata

Add custom metadata to track additional information:

```typescript
await humeTracker.trackASRCall(durationMs, {
  endpoint: '/batch/jobs',
  audioQuality: 'high',
  language: 'en',
  customField: 'value'
})
```

## 📈 Monitoring and Analytics

### Cost Alerts

Set up cost monitoring by checking the dashboard regularly or implementing automated alerts:

```typescript
// Example: Check if daily cost exceeds threshold
const usage = await apiUsageTracker.getUsageSummary(
  new Date(Date.now() - 86400000).toISOString() // Last 24 hours
)

if (usage.totalCost > 100) { // £100 daily threshold
  // Send alert
  console.warn('Daily cost exceeded threshold:', usage.totalCost)
}
```

### Usage Patterns

Analyze usage patterns by service:

```typescript
const summary = await apiUsageTracker.getUsageSummary()
console.log('ASR usage:', summary.serviceBreakdown.asr)
console.log('Chat usage:', summary.serviceBreakdown.chat)
```

## 🛠️ Troubleshooting

### Common Issues

1. **Missing API Keys**: Ensure `HUME_API_KEY` and `OPENAI_API_KEY` are set
2. **Database Connection**: Verify Supabase connection is working
3. **Pricing Configuration**: Check that pricing variables are set correctly

### Debug Mode

Enable debug logging:

```typescript
// In your API route
console.log('Tracking usage:', {
  sessionId,
  provider: 'hume',
  service: 'asr',
  duration: durationMs
})
```

## 📝 Example Implementations

See the example API routes:
- `app/api/example/hume-asr/route.ts` - Hume ASR tracking example
- `app/api/example/openai-chat/route.ts` - OpenAI chat tracking example

## 🔐 Security Considerations

1. **API Keys**: Never expose API keys in client-side code
2. **Rate Limiting**: Implement rate limiting for API calls
3. **Cost Limits**: Set daily/monthly cost limits
4. **Audit Trail**: All usage is logged for audit purposes

## 📊 Data Retention

- Usage data is retained according to your database settings
- Consider implementing data purging for old records
- Export data for long-term analysis if needed

## 🚀 Next Steps

1. **Set up the database migration**
2. **Configure environment variables**
3. **Integrate tracking into your API calls**
4. **Monitor the dashboard for real-time usage**
5. **Set up cost alerts and monitoring**

The system is now ready to track real API usage and display it in your dashboard!
