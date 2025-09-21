// Hume EVI preloading utility
// This helps preload connection components and tokens for faster station starts

import { humeTokenCache } from './humeTokenCache';

class HumePreloader {
  private preloadPromise: Promise<void> | null = null;
  private isPreloading = false;

  // Preload Hume connection components
  async preload(): Promise<void> {
    if (this.isPreloading && this.preloadPromise) {
      return this.preloadPromise;
    }

    this.isPreloading = true;
    this.preloadPromise = this.performPreload();

    try {
      await this.preloadPromise;
    } finally {
      this.isPreloading = false;
    }
  }

  private async performPreload(): Promise<void> {
    try {
      console.log('Preloading Hume EVI components...');
      
      // Preload access token
      await humeTokenCache.getToken();
      
      // Preload dynamic imports
      const [
        { useVoice },
        { connect, disconnect }
      ] = await Promise.all([
        import('@humeai/voice-react'),
        // We can't actually import the voice functions without a provider,
        // but we can prepare the module
        Promise.resolve({ connect: null, disconnect: null })
      ]);
      
      console.log('Hume EVI components preloaded successfully');
    } catch (error) {
      console.warn('Failed to preload Hume EVI components:', error);
      // Don't throw - preloading is optional
    }
  }

  // Check if preloading is complete
  isPreloaded(): boolean {
    return !this.isPreloading && this.preloadPromise !== null;
  }

  // Clear preload cache
  clearPreload(): void {
    this.preloadPromise = null;
    this.isPreloading = false;
  }
}

// Export singleton instance
export const humePreloader = new HumePreloader();

// Auto-preload when this module is imported (optional)
if (typeof window !== 'undefined') {
  // Only preload on client side
  setTimeout(() => {
    humePreloader.preload().catch(console.warn);
  }, 1000); // Delay to not interfere with initial page load
}
