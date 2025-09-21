// Audio notification utilities for station events

interface AudioNotificationOptions {
  volume?: number;
  loop?: boolean;
  preload?: boolean;
}

class AudioNotificationManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private isEnabled: boolean = true;
  private volume: number = 0.7;

  constructor() {
    // Check if audio is enabled (respect user preferences)
    this.checkAudioPermissions();
  }

  private async checkAudioPermissions(): Promise<void> {
    try {
      // Test audio context creation
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioContext.state === 'suspended') {
        // Audio is suspended, try to resume
        await audioContext.resume();
      }
    } catch (error) {
      console.warn('Audio context not available:', error);
      this.isEnabled = false;
    }
  }

  // Load and cache audio files
  private async loadSound(soundName: string, src: string, options: AudioNotificationOptions = {}): Promise<HTMLAudioElement> {
    if (this.sounds.has(soundName)) {
      return this.sounds.get(soundName)!;
    }

    const audio = new Audio(src);
    audio.volume = options.volume ?? this.volume;
    audio.loop = options.loop ?? false;
    audio.preload = options.preload ?? true;

    // Cache the audio element
    this.sounds.set(soundName, audio);

    return audio;
  }

  // Play a sound notification
  async playSound(soundName: string, src?: string, options: AudioNotificationOptions = {}): Promise<void> {
    if (!this.isEnabled) {
      console.log('Audio notifications disabled');
      return;
    }

    try {
      let audio: HTMLAudioElement;

      if (src) {
        // Load new sound
        audio = await this.loadSound(soundName, src, options);
      } else if (this.sounds.has(soundName)) {
        // Use cached sound
        audio = this.sounds.get(soundName)!;
      } else {
        console.warn(`Sound '${soundName}' not found and no source provided`);
        return;
      }

      // Reset audio to beginning and play
      audio.currentTime = 0;
      await audio.play();
      
      console.log(`Played sound: ${soundName}`);
    } catch (error) {
      console.error(`Failed to play sound '${soundName}':`, error);
    }
  }

  // Stop a sound
  stopSound(soundName: string): void {
    const audio = this.sounds.get(soundName);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  // Stop all sounds
  stopAllSounds(): void {
    this.sounds.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  }

  // Enable/disable audio notifications
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stopAllSounds();
    }
  }

  // Set volume for all sounds
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach(audio => {
      audio.volume = this.volume;
    });
  }

  // Get current volume
  getVolume(): number {
    return this.volume;
  }

  // Check if audio is enabled
  isAudioEnabled(): boolean {
    return this.isEnabled;
  }

  // Preload common sounds
  async preloadCommonSounds(): Promise<void> {
    const commonSounds = [
      { name: 'station-start', src: '/sounds/station-start.mp3' },
      { name: 'station-end', src: '/sounds/station-end.mp3' },
      { name: 'station-end-early', src: '/sounds/station-end-early.mp3' },
      { name: 'time-warning', src: '/sounds/time-warning.mp3' },
    ];

    try {
      await Promise.all(
        commonSounds.map(sound => 
          this.loadSound(sound.name, sound.src, { volume: 0.6 })
        )
      );
      console.log('Common sounds preloaded successfully');
    } catch (error) {
      console.warn('Failed to preload some sounds:', error);
    }
  }

  // Generate system beep sounds as fallback
  async playSystemBeep(type: 'start' | 'end' | 'notification' = 'notification'): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      let frequency: number;
      let duration: number;

      switch (type) {
        case 'start':
          frequency = 800; // Higher pitch for start
          duration = 0.3;
          break;
        case 'end':
          frequency = 400; // Lower pitch for end
          duration = 0.8;
          break;
        default:
          frequency = 600;
          duration = 0.2;
      }

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);

      console.log(`Played system beep: ${type}`);
    } catch (error) {
      console.error('Failed to play system beep:', error);
    }
  }
}

// Export singleton instance
export const audioNotifications = new AudioNotificationManager();

// Preload sounds when module loads
if (typeof window !== 'undefined') {
  setTimeout(() => {
    audioNotifications.preloadCommonSounds().catch(console.warn);
  }, 1000);
}
