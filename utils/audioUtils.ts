// Audio utility functions for station sounds

export interface AudioConfig {
  enabled: boolean;
  volume: number;
}

class AudioManager {
  private config: AudioConfig = {
    enabled: true,
    volume: 0.7
  };

  private sounds: Map<string, HTMLAudioElement> = new Map();

  constructor() {
    // Load default sounds
    this.initializeSounds();
    
    // Load user preferences from localStorage
    this.loadUserPreferences();
  }

  private initializeSounds() {
    // Station start sound (gentle notification)
    const startSound = new Audio();
    startSound.src = '/sounds/station-start.mp3';
    startSound.preload = 'auto';
    startSound.volume = this.config.volume;
    this.sounds.set('start', startSound);

    // Station end sound (time up notification)
    const endSound = new Audio();
    endSound.src = '/sounds/station-end.mp3';
    endSound.preload = 'auto';
    endSound.volume = this.config.volume;
    this.sounds.set('end', endSound);

    // Warning sound (1 minute remaining)
    const warningSound = new Audio();
    warningSound.src = '/sounds/time-warning.mp3';
    warningSound.preload = 'auto';
    warningSound.volume = this.config.volume;
    this.sounds.set('warning', warningSound);
  }

  private loadUserPreferences() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('audioConfig');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          this.config = { ...this.config, ...parsed };
          this.updateVolume();
        } catch (error) {
          console.warn('Failed to parse audio preferences:', error);
        }
      }
    }
  }

  private saveUserPreferences() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('audioConfig', JSON.stringify(this.config));
    }
  }

  private updateVolume() {
    this.sounds.forEach(sound => {
      sound.volume = this.config.volume;
    });
  }

  async playSound(soundType: 'start' | 'end' | 'warning'): Promise<void> {
    if (!this.config.enabled) return;

    try {
      const sound = this.sounds.get(soundType);
      if (!sound) {
        console.warn(`Sound '${soundType}' not found`);
        return;
      }

      // Reset audio to beginning
      sound.currentTime = 0;
      
      // Play the sound
      await sound.play();
      console.log(`Played ${soundType} sound`);
    } catch (error) {
      console.warn(`Failed to play ${soundType} sound:`, error);
      // Don't throw - audio failures shouldn't break the app
    }
  }

  setEnabled(enabled: boolean) {
    this.config.enabled = enabled;
    this.saveUserPreferences();
  }

  setVolume(volume: number) {
    this.config.volume = Math.max(0, Math.min(1, volume));
    this.updateVolume();
    this.saveUserPreferences();
  }

  getConfig(): AudioConfig {
    return { ...this.config };
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  getVolume(): number {
    return this.config.volume;
  }
}

// Export singleton instance
export const audioManager = new AudioManager();

// Helper functions for common use cases
export const playStationStartSound = () => audioManager.playSound('start');
export const playStationEndSound = () => audioManager.playSound('end');
export const playTimeWarningSound = () => audioManager.playSound('warning');
