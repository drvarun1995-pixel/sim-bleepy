// Hume access token caching utility
// This helps avoid fetching tokens on every station load

interface TokenCache {
  token: string | null;
  expiresAt: number;
  isRefreshing: boolean;
}

class HumeTokenCache {
  private cache: TokenCache = {
    token: null,
    expiresAt: 0,
    isRefreshing: false
  };

  private refreshPromise: Promise<string> | null = null;

  // Check if token is valid (with 5 minute buffer)
  private isTokenValid(): boolean {
    const now = Date.now();
    const buffer = 5 * 60 * 1000; // 5 minutes
    return this.cache.token !== null && this.cache.expiresAt > (now + buffer);
  }

  // Get cached token or fetch new one
  async getToken(): Promise<string> {
    // Return cached token if valid
    if (this.isTokenValid()) {
      console.log('Using cached Hume access token');
      return this.cache.token!;
    }

    // If already refreshing, wait for that promise
    if (this.isRefreshing && this.refreshPromise) {
      console.log('Waiting for ongoing token refresh...');
      return await this.refreshPromise;
    }

    // Start new refresh
    this.isRefreshing = true;
    this.refreshPromise = this.fetchNewToken();

    try {
      const token = await this.refreshPromise;
      return token;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async fetchNewToken(): Promise<string> {
    try {
      console.log('Fetching new Hume access token...');
      
      const response = await fetch('/api/auth/hume-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch token: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.token) {
        throw new Error('No token received from server');
      }

      // Cache the token (Hume tokens typically expire in 1 hour)
      this.cache.token = data.token;
      this.cache.expiresAt = Date.now() + (55 * 60 * 1000); // 55 minutes
      
      console.log('Successfully cached new Hume access token');
      return data.token;
    } catch (error) {
      console.error('Failed to fetch Hume access token:', error);
      throw error;
    }
  }

  // Clear cache (useful for logout or errors)
  clearCache(): void {
    this.cache = {
      token: null,
      expiresAt: 0,
      isRefreshing: false
    };
    this.refreshPromise = null;
    console.log('Hume token cache cleared');
  }

  // Get cache status for debugging
  getCacheStatus() {
    return {
      hasToken: this.cache.token !== null,
      isValid: this.isTokenValid(),
      isRefreshing: this.isRefreshing,
      expiresAt: new Date(this.cache.expiresAt).toISOString()
    };
  }
}

// Export singleton instance
export const humeTokenCache = new HumeTokenCache();
