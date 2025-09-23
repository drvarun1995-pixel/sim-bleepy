import { supabaseAdmin } from '@/utils/supabase'

export interface UsageData {
  service: 'openai' | 'hume'
  endpoint: string
  usage_data: {
    total_tokens?: number
    prompt_tokens?: number
    completion_tokens?: number
    cost?: number
    session_duration?: number
    requests?: number
  }
  timestamp: string
  user_id?: string
  request_id?: string
}

export async function trackUsage(usageData: UsageData) {
  try {
    const { error } = await supabaseAdmin
      .from('api_usage_tracking')
      .insert({
        service: usageData.service,
        endpoint: usageData.endpoint,
        usage_data: usageData.usage_data,
        timestamp: usageData.timestamp,
        user_id: usageData.user_id,
        request_id: usageData.request_id,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error tracking usage:', error)
    } else {
      console.log('Usage tracked successfully:', usageData.service, usageData.usage_data)
    }
  } catch (error) {
    console.error('Error in usage tracker:', error)
  }
}

export function extractOpenAIUsage(apiResponse: any): Partial<UsageData['usage_data']> {
  if (apiResponse?.usage) {
    return {
      total_tokens: apiResponse.usage.total_tokens,
      prompt_tokens: apiResponse.usage.prompt_tokens,
      completion_tokens: apiResponse.usage.completion_tokens,
      cost: calculateOpenAICost(apiResponse.usage.total_tokens)
    }
  }
  return {}
}

export function extractHumeUsage(apiResponse: any): Partial<UsageData['usage_data']> {
  // Extract Hume-specific usage data
  // This will depend on Hume's actual API response format
  if (apiResponse?.usage) {
    return {
      session_duration: apiResponse.usage.duration,
      requests: apiResponse.usage.requests
    }
  }
  return {}
}

function calculateOpenAICost(totalTokens: number): number {
  // GPT-4 pricing: $0.03 per 1K tokens (input) + $0.06 per 1K tokens (output)
  // This is a rough estimate - actual cost depends on input/output token ratio
  const costPer1KTokens = 0.03
  return (totalTokens / 1000) * costPer1KTokens
}
