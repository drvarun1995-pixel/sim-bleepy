// MailerLite API integration
const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY
const MAILERLITE_BASE_URL = 'https://connect.mailerlite.com/api'

interface MailerLiteSubscriber {
  email: string
  name?: string
  fields?: Record<string, any>
}

interface MailerLiteResponse {
  data?: any
  error?: {
    message: string
    code: number
  }
}

export class MailerLiteService {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = MAILERLITE_API_KEY || ''
    this.baseUrl = MAILERLITE_BASE_URL
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<MailerLiteResponse> {
    if (!this.apiKey) {
      return { error: { message: 'MailerLite API key not configured', code: 401 } }
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: { message: data.message || 'Request failed', code: response.status } }
      }

      return { data }
    } catch (error) {
      return { error: { message: 'Network error', code: 500 } }
    }
  }

  async addSubscriber(subscriber: MailerLiteSubscriber): Promise<MailerLiteResponse> {
    return this.makeRequest('/subscribers', {
      method: 'POST',
      body: JSON.stringify(subscriber),
    })
  }

  async getSubscriber(email: string): Promise<MailerLiteResponse> {
    return this.makeRequest(`/subscribers/${email}`)
  }

  async updateSubscriber(email: string, data: Partial<MailerLiteSubscriber>): Promise<MailerLiteResponse> {
    return this.makeRequest(`/subscribers/${email}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteSubscriber(email: string): Promise<MailerLiteResponse> {
    return this.makeRequest(`/subscribers/${email}`, {
      method: 'DELETE',
    })
  }

  async sendEmail(to: string, subject: string, content: string, fromName?: string): Promise<MailerLiteResponse> {
    // First, ensure the subscriber exists in MailerLite
    const subscriberResult = await this.addSubscriber({
      email: to,
      name: fromName || to.split('@')[0], // Use email prefix as name if not provided
      fields: {}
    })

    if (subscriberResult.error) {
      return subscriberResult
    }

    // For individual emails, we'll use MailerLite's broadcast API
    // This creates a simple broadcast email
    const broadcastResult = await this.makeRequest('/broadcasts', {
      method: 'POST',
      body: JSON.stringify({
        name: subject,
        type: 'regular',
        subject: subject,
        content: {
          type: 'html',
          html: `<html><body><p>${content.replace(/\n/g, '<br>')}</p></body></html>`
        },
        recipients: {
          type: 'subscriber',
          subscriber: {
            email: to
          }
        }
      }),
    })

    return broadcastResult
  }

  async getSubscribers(page = 1, limit = 100): Promise<MailerLiteResponse> {
    return this.makeRequest(`/subscribers?page=${page}&limit=${limit}`)
  }

  async getSubscriberStats(): Promise<MailerLiteResponse> {
    return this.makeRequest('/subscribers/stats')
  }
}

export const mailerLiteService = new MailerLiteService()
