// Microphone permission management utility
// Handles persistent microphone permissions and audio context management

interface MicrophonePermissionState {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
  lastChecked: number;
}

class MicrophonePermissionManager {
  private permissionState: MicrophonePermissionState = {
    granted: false,
    denied: false,
    prompt: true,
    lastChecked: 0
  };

  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;

  constructor() {
    // Check if we have cached permission state
    this.loadCachedPermissionState();
  }

  private loadCachedPermissionState(): void {
    try {
      const cached = localStorage.getItem('microphone-permission-state');
      if (cached) {
        const parsed = JSON.parse(cached);
        // Only use cached state if it's less than 24 hours old
        if (Date.now() - parsed.lastChecked < 24 * 60 * 60 * 1000) {
          this.permissionState = parsed;
          console.log('Loaded cached microphone permission state:', this.permissionState);
        }
      }
    } catch (error) {
      console.warn('Failed to load cached microphone permission state:', error);
    }
  }

  private savePermissionState(): void {
    try {
      this.permissionState.lastChecked = Date.now();
      localStorage.setItem('microphone-permission-state', JSON.stringify(this.permissionState));
    } catch (error) {
      console.warn('Failed to save microphone permission state:', error);
    }
  }

  // Check current microphone permission status
  async checkMicrophonePermission(): Promise<MicrophonePermissionState> {
    try {
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        
        this.permissionState.granted = permission.state === 'granted';
        this.permissionState.denied = permission.state === 'denied';
        this.permissionState.prompt = permission.state === 'prompt';
        
        console.log('Microphone permission status:', permission.state);
        
        // Listen for permission changes
        permission.onchange = () => {
          this.permissionState.granted = permission.state === 'granted';
          this.permissionState.denied = permission.state === 'denied';
          this.permissionState.prompt = permission.state === 'prompt';
          this.savePermissionState();
          console.log('Microphone permission changed to:', permission.state);
        };
      } else {
        // Fallback for browsers that don't support permissions API
        console.log('Permissions API not supported, will request permission when needed');
      }
      
      this.savePermissionState();
      return this.permissionState;
    } catch (error) {
      console.warn('Failed to check microphone permission:', error);
      return this.permissionState;
    }
  }

  // Request microphone access with proper error handling
  async requestMicrophoneAccess(): Promise<boolean> {
    try {
      // Check if we already have permission
      if (this.permissionState.granted && this.mediaStream) {
        console.log('Microphone already granted and stream available');
        return true;
      }

      console.log('Requesting microphone access...');
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });

      this.mediaStream = stream;
      this.permissionState.granted = true;
      this.permissionState.denied = false;
      this.permissionState.prompt = false;
      
      console.log('Microphone access granted');
      this.savePermissionState();
      
      // Initialize audio context if needed
      await this.initializeAudioContext();
      
      return true;
    } catch (error) {
      console.error('Microphone access denied or failed:', error);
      
      this.permissionState.granted = false;
      this.permissionState.denied = true;
      this.permissionState.prompt = false;
      this.savePermissionState();
      
      // Clean up any existing stream
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
        this.mediaStream = null;
      }
      
      return false;
    }
  }

  // Initialize audio context for mobile compatibility
  async initializeAudioContext(): Promise<void> {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Ensure audio context is running (required for mobile)
      if (this.audioContext.state === 'suspended') {
        console.log('Resuming suspended audio context');
        await this.audioContext.resume();
      }

      console.log('Audio context initialized:', this.audioContext.state);
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }

  // Get current permission state
  getPermissionState(): MicrophonePermissionState {
    return { ...this.permissionState };
  }

  // Check if microphone is currently available
  isMicrophoneAvailable(): boolean {
    return this.permissionState.granted && this.mediaStream !== null;
  }

  // Get the current media stream (if available)
  getMediaStream(): MediaStream | null {
    return this.mediaStream;
  }

  // Get the audio context (if available)
  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  // Clean up resources
  cleanup(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  // Reset permission state (for testing or user logout)
  resetPermissionState(): void {
    this.cleanup();
    this.permissionState = {
      granted: false,
      denied: false,
      prompt: true,
      lastChecked: 0
    };
    localStorage.removeItem('microphone-permission-state');
  }
}

// Export singleton instance
export const microphonePermissions = new MicrophonePermissionManager();

// Initialize permission check on module load
if (typeof window !== 'undefined') {
  setTimeout(() => {
    microphonePermissions.checkMicrophonePermission().catch(console.warn);
  }, 1000);
}
