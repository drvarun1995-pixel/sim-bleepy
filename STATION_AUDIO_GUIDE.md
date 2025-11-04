# Station Audio Notifications Guide

This guide explains the audio notification system implemented for Bleepy medical simulation stations.

## 🔊 Audio Events

### 1. **Station Start Sound**
- **When**: Plays immediately when user clicks "Start Session"
- **Purpose**: Confirms the session has begun
- **File**: `/sounds/station-start.mp3`
- **Fallback**: System beep (800Hz, 0.5s)

### 2. **Time Warning Sound**
- **When**: Plays at 7 minutes (1 minute remaining)
- **Purpose**: Warns user that time is running out
- **File**: `/sounds/time-warning.mp3`
- **Fallback**: System beep (600Hz, 0.3s)

### 3. **Early End Sound**
- **When**: Plays at 7:55 minutes (5 seconds remaining)
- **Purpose**: Warns that session is ending very soon
- **File**: `/sounds/station-end-early.mp3`
- **Fallback**: System beep (500Hz, 0.8s)

### 4. **Final End Sound**
- **When**: Plays when 8-minute timer expires
- **Purpose**: Signals that the session has ended
- **File**: `/sounds/station-end.mp3`
- **Fallback**: System beep (400Hz, 1.0s)

## 🎛️ Sound Controls

### Sound Settings Component
- **Location**: Top-right of station interface
- **Features**:
  - Enable/disable audio notifications
  - Volume control (0-100%)
  - Test sound buttons
  - Persistent preferences (saved to localStorage)

### User Preferences
- Settings are automatically saved to browser localStorage
- Preferences persist across sessions
- Audio can be completely disabled for accessibility

## 🛠️ Implementation Details

### Audio Management
```typescript
import { audioNotifications } from '@/utils/audioNotifications';

// Play a sound with fallback
audioNotifications.playSound('station-start', '/sounds/station-start.mp3')
  .catch(() => {
    // Fallback to system beep
    audioNotifications.playSystemBeep('start');
  });
```

### Timer Integration
```typescript
// In StationInterface.tsx timer logic
if (prev <= 1) {
  // Play final end sound before ending session
  audioNotifications.playSound('station-end', '/sounds/station-end.mp3')
    .catch(() => audioNotifications.playSystemBeep('end'));
  handleEndSession();
} else if (prev === 5) {
  // Play early end sound at 5 seconds remaining
  audioNotifications.playSound('station-end-early', '/sounds/station-end-early.mp3')
    .catch(() => audioNotifications.playSystemBeep('end'));
} else if (prev === 60) {
  // Play warning at 1 minute remaining
  audioNotifications.playSound('time-warning', '/sounds/time-warning.mp3')
    .catch(() => audioNotifications.playSystemBeep('notification'));
}
```

## 📁 File Structure

```
public/sounds/
├── station-start.mp3      # Session start notification
├── time-warning.mp3       # 1-minute warning
├── station-end-early.mp3  # 5-second warning
├── station-end.mp3        # Final session end notification
├── README.md             # Sound file specifications
└── create-test-sounds.html # Test sound generator
```

## 🎵 Sound File Specifications

### Technical Requirements
- **Format**: MP3 (for broad browser compatibility)
- **Quality**: 128kbps or higher
- **Sample Rate**: 44.1kHz
- **Channels**: Mono or Stereo
- **File Size**: Under 100KB each for fast loading

### Recommended Characteristics

#### Station Start Sound
- **Duration**: 2-3 seconds
- **Style**: Gentle, welcoming notification
- **Suggestions**: Soft chime, bell, or notification tone
- **Mood**: Encouraging, professional

#### Time Warning Sound
- **Duration**: 1-2 seconds
- **Style**: Subtle warning sound
- **Suggestions**: Soft beep, gentle chime
- **Mood**: Alerting but not alarming

#### Station End Sound
- **Duration**: 3-4 seconds
- **Style**: Clear, attention-grabbing
- **Suggestions**: Alarm bell, buzzer, distinctive notification
- **Mood**: Definitive, time's up

## 🔧 Setup Instructions

### 1. Add Sound Files
1. Create or download MP3 files for each notification
2. Place them in the `public/sounds/` directory
3. Ensure filenames match exactly:
   - `station-start.mp3`
   - `time-warning.mp3`
   - `station-end.mp3`

### 2. Test the System
1. Start a station session
2. Listen for the start sound
3. Wait for 7 minutes to hear the warning
4. Wait for 8 minutes to hear the end sound

### 3. Fallback Testing
1. Remove or rename the MP3 files
2. Test that system beeps still work
3. Verify no errors in console

## 🎨 Customization

### Volume Control
- Users can adjust volume from 0-100%
- Settings persist across sessions
- Default volume is 70%

### Audio Preferences
- Users can disable audio entirely
- Settings are saved to localStorage
- Respects user accessibility preferences

### Fallback Sounds
- System beeps are generated using Web Audio API
- Different frequencies for different events
- No external dependencies required

## 🐛 Troubleshooting

### Common Issues

#### No Sound Plays
1. Check browser audio permissions
2. Verify MP3 files exist in `/public/sounds/`
3. Check browser console for errors
4. Test with system beep fallback

#### Sound Files Not Loading
1. Ensure files are in MP3 format
2. Check file paths are correct
3. Verify files are under 100KB
4. Test in different browsers

#### Volume Issues
1. Check system volume
2. Verify browser audio permissions
3. Test volume slider in settings
4. Try different browsers

### Debug Mode
```typescript
// Check audio system status
console.log(audioNotifications.getCacheStatus());

// Test individual sounds
audioNotifications.playSystemBeep('start');
audioNotifications.playSystemBeep('notification');
audioNotifications.playSystemBeep('end');
```

## 🌟 Best Practices

1. **Keep files small** - Under 100KB for fast loading
2. **Use clear sounds** - Distinctive for each event
3. **Respect accessibility** - Always provide disable option
4. **Test thoroughly** - Verify across different browsers
5. **Provide fallbacks** - System beeps when files fail
6. **Save preferences** - Remember user settings

## 📱 Browser Compatibility

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support
- **Mobile browsers**: Full support

## 🔮 Future Enhancements

1. **Custom sound uploads** - Let users upload their own sounds
2. **Sound themes** - Different sound sets for different stations
3. **Advanced timing** - Multiple warning intervals
4. **Voice announcements** - Spoken time warnings
5. **Haptic feedback** - Vibration for mobile devices

The audio notification system enhances the user experience by providing clear auditory feedback for important station events, while maintaining accessibility and user control.
