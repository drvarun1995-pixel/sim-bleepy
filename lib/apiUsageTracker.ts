import { createClient } from '@/utils/supabase/server'

// Types for API usage tracking
export interface APIUsageRecord {
  id?: string
  session_id: string
  provider: 'hume' | 'openai'
  service: 'asr' | 'tts' | 'chat' | 'embeddings' | 'emotion'
  tokens_used?: number
  duration_ms?: number
  cost_gbp: number
  metadata?: Record<string, any>
  created_at?: string
}

export interface UsageSummary {
  totalCost: number
  totalTokens: number
  totalDuration: number
  providerBreakdown: {
    hume: { cost: number; tokens: number; duration: number }
    openai: { cost: number; tokens: number; duration: number }
  }
  serviceBreakdown: {
    asr: { cost: number; duration: number }
    tts: { cost: number; duration: number }
    chat: { cost: number; tokens: number }
    embeddings: { cost: number; tokens: number }
    emotion: { cost: number; tokens: number }
  }
}

// Pricing configuration (from environment or config)
const PRICING = {
  hume: {
    price_per_minute: parseFloat(process.env.HUME_PRICE_PER_MIN || '0.01'),
    price_per_token: parseFloat(process.env.HUME_PRICE_PER_TOKEN || '0.001')
  },
  openai: {
    price_per_1m_tokens_input: parseFloat(process.env.OPENAI_PRICE_PER_1M_TOKENS_INPUT || '1.50'),
    price_per_1m_tokens_output: parseFloat(process.env.OPENAI_PRICE_PER_1M_TOKENS_OUTPUT || '2.00'),
    price_per_1k_tokens_embeddings: parseFloat(process.env.OPENAI_PRICE_PER_1K_TOKENS_EMBEDDINGS || '0.0001')
  }
}

export class APIUsageTracker {
  private supabase: any = null

  constructor() {
    try {
      this.supabase = createClient()
    } catch (error) {
      console.warn('Supabase client not available for API usage tracking:', error)
    }
  }

  // Calculate cost for different services
  private calculateCost(provider: string, service: string, usage: any): number {
    switch (provider) {
      case 'hume':
        if (service === 'asr' || service === 'tts') {
          // Hume charges per minute for voice services
          const durationMinutes = (usage.duration_ms || 0) / 60000
          return durationMinutes * PRICING.hume.price_per_minute
        } else if (service === 'emotion') {
          // Hume emotion analysis charges per token
          const tokens = usage.tokens_used || 0
          return (tokens / 1000000) * PRICING.hume.price_per_token
        }
        break

      case 'openai':
        if (service === 'chat') {
          const inputTokens = usage.input_tokens || 0
          const outputTokens = usage.output_tokens || 0
          const inputCost = (inputTokens / 1000000) * PRICING.openai.price_per_1m_tokens_input
          const outputCost = (outputTokens / 1000000) * PRICING.openai.price_per_1m_tokens_output
          return inputCost + outputCost
        } else if (service === 'embeddings') {
          const tokens = usage.tokens_used || 0
          return (tokens / 1000) * PRICING.openai.price_per_1k_tokens_embeddings
        }
        break
    }
    return 0
  }

  // Record API usage
  async recordUsage(usage: APIUsageRecord): Promise<void> {
    if (!this.supabase) {
      console.warn('Supabase not available, skipping API usage tracking')
      return
    }

    try {
      const cost = this.calculateCost(usage.provider, usage.service, {
        tokens_used: usage.tokens_used,
        duration_ms: usage.duration_ms,
        input_tokens: usage.metadata?.input_tokens,
        output_tokens: usage.metadata?.output_tokens
      })

      const record = {
        ...usage,
        cost_gbp: cost,
        created_at: new Date().toISOString()
      }

      const { error } = await this.supabase
        .from('api_usage')
        .insert(record)

      if (error) {
        console.error('Failed to record API usage:', error)
        // Don't throw - we don't want API usage tracking to break the main flow
      }
    } catch (error) {
      console.error('API usage tracking error:', error)
      // Don't throw - we don't want API usage tracking to break the main flow
    }
  }

  // Get usage summary for dashboard
  async getUsageSummary(
    startDate?: string,
    endDate?: string,
    sessionId?: string
  ): Promise<UsageSummary> {
    if (!this.supabase) {
      console.warn('Supabase not available, returning empty usage summary')
      return this.getEmptyUsageSummary()
    }

    try {
      let query = this.supabase
        .from('api_usage')
        .select('*')

      if (startDate) {
        query = query.gte('created_at', startDate)
      }
      if (endDate) {
        query = query.lte('created_at', endDate)
      }
      if (sessionId) {
        query = query.eq('session_id', sessionId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Failed to fetch usage summary:', error)
        return this.getEmptyUsageSummary()
      }

      const records = data || []

      // Calculate summary
      const summary: UsageSummary = {
        totalCost: 0,
        totalTokens: 0,
        totalDuration: 0,
        providerBreakdown: {
          hume: { cost: 0, tokens: 0, duration: 0 },
          openai: { cost: 0, tokens: 0, duration: 0 }
        },
        serviceBreakdown: {
          asr: { cost: 0, duration: 0 },
          tts: { cost: 0, duration: 0 },
          chat: { cost: 0, tokens: 0 },
          embeddings: { cost: 0, tokens: 0 },
          emotion: { cost: 0, tokens: 0 }
        }
      }

      records.forEach((record) => {
        summary.totalCost += record.cost_gbp
        summary.totalTokens += record.tokens_used || 0
        summary.totalDuration += record.duration_ms || 0

        // Provider breakdown
        if (record.provider === 'hume') {
          summary.providerBreakdown.hume.cost += record.cost_gbp
          summary.providerBreakdown.hume.tokens += record.tokens_used || 0
          summary.providerBreakdown.hume.duration += record.duration_ms || 0
        } else if (record.provider === 'openai') {
          summary.providerBreakdown.openai.cost += record.cost_gbp
          summary.providerBreakdown.openai.tokens += record.tokens_used || 0
          summary.providerBreakdown.openai.duration += record.duration_ms || 0
        }

        // Service breakdown
        const service = record.service as keyof typeof summary.serviceBreakdown
        if (summary.serviceBreakdown[service]) {
          summary.serviceBreakdown[service].cost += record.cost_gbp
          if (record.tokens_used) {
            summary.serviceBreakdown[service].tokens += record.tokens_used
          }
          if (record.duration_ms) {
            summary.serviceBreakdown[service].duration += record.duration_ms
          }
        }
      })

      return summary
    } catch (error) {
      console.error('Usage summary error:', error)
      return this.getEmptyUsageSummary()
    }
  }

  private getEmptyUsageSummary(): UsageSummary {
    return {
      totalCost: 0,
      totalTokens: 0,
      totalDuration: 0,
      providerBreakdown: {
        hume: { cost: 0, tokens: 0, duration: 0 },
        openai: { cost: 0, tokens: 0, duration: 0 }
      },
      serviceBreakdown: {
        asr: { cost: 0, duration: 0 },
        tts: { cost: 0, duration: 0 },
        chat: { cost: 0, tokens: 0 },
        embeddings: { cost: 0, tokens: 0 },
        emotion: { cost: 0, tokens: 0 }
      }
    }
  }

  // Get real-time usage metrics
  async getRealtimeMetrics(): Promise<{
    activeSessions: number
    currentCostPerMinute: number
    estimatedDailyCost: number
  }> {
    if (!this.supabase) {
      return {
        activeSessions: 0,
        currentCostPerMinute: 0,
        estimatedDailyCost: 0
      }
    }

    try {
      const oneMinuteAgo = new Date(Date.now() - 60000).toISOString()
      const oneDayAgo = new Date(Date.now() - 86400000).toISOString()

      const [recentUsage, dailyUsage] = await Promise.all([
        this.supabase
          .from('api_usage')
          .select('cost_gbp')
          .gte('created_at', oneMinuteAgo),
        this.supabase
          .from('api_usage')
          .select('cost_gbp')
          .gte('created_at', oneDayAgo)
      ])

      const recentCost = recentUsage.data?.reduce((sum, record) => sum + record.cost_gbp, 0) || 0
      const dailyCost = dailyUsage.data?.reduce((sum, record) => sum + record.cost_gbp, 0) || 0

      return {
        activeSessions: recentUsage.data?.length || 0,
        currentCostPerMinute: recentCost,
        estimatedDailyCost: dailyCost
      }
    } catch (error) {
      console.error('Realtime metrics error:', error)
      return {
        activeSessions: 0,
        currentCostPerMinute: 0,
        estimatedDailyCost: 0
      }
    }
  }
}

// Singleton instance
export const apiUsageTracker = new APIUsageTracker()

// Helper functions for easy usage tracking
export const trackHumeUsage = async (
  sessionId: string,
  service: 'asr' | 'tts' | 'emotion',
  usage: {
    duration_ms?: number
    tokens_used?: number
    metadata?: Record<string, any>
  }
) => {
  await apiUsageTracker.recordUsage({
    session_id: sessionId,
    provider: 'hume',
    service,
    tokens_used: usage.tokens_used,
    duration_ms: usage.duration_ms,
    cost_gbp: 0, // Will be calculated
    metadata: usage.metadata
  })
}

export const trackOpenAIUsage = async (
  sessionId: string,
  service: 'chat' | 'embeddings',
  usage: {
    tokens_used?: number
    input_tokens?: number
    output_tokens?: number
    metadata?: Record<string, any>
  }
) => {
  await apiUsageTracker.recordUsage({
    session_id: sessionId,
    provider: 'openai',
    service,
    tokens_used: usage.tokens_used,
    cost_gbp: 0, // Will be calculated
    metadata: {
      ...usage.metadata,
      input_tokens: usage.input_tokens,
      output_tokens: usage.output_tokens
    }
  })
}
