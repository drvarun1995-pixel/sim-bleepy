# Station Sound Effects

This directory contains audio files for the Bleepy station experience.

## Required Sound Files

### 1. `station-start.mp3`
- **Purpose**: Played when a station session begins
- **Duration**: 2-3 seconds
- **Style**: Gentle, welcoming notification sound
- **Suggestions**: Soft chime, bell, or notification tone

### 2. `station-end-early.mp3`
- **Purpose**: Played at 7:55 minutes (5 seconds before timer expires)
- **Duration**: 2-3 seconds
- **Style**: Clear, attention-grabbing sound to indicate session ending soon
- **Suggestions**: Bell, chime, or notification tone

### 3. `station-end.mp3`
- **Purpose**: Played when the 8-minute station timer expires
- **Duration**: 3-4 seconds
- **Style**: Clear, attention-grabbing sound to indicate time is up
- **Suggestions**: Alarm bell, buzzer, or distinctive notification

### 4. `time-warning.mp3`
- **Purpose**: Played 1 minute before the station ends (at 7 minutes)
- **Duration**: 1-2 seconds
- **Style**: Subtle warning sound
- **Suggestions**: Soft beep, gentle chime, or quiet notification

## Audio Specifications

- **Format**: MP3 (for broad browser compatibility)
- **Quality**: 128kbps or higher
- **Sample Rate**: 44.1kHz
- **Channels**: Mono or Stereo
- **File Size**: Keep under 100KB each for fast loading

## Free Sound Resources

### Recommended Sources:
1. **Freesound.org** - Creative Commons licensed sounds
2. **Zapsplat** - Professional sound effects (free with account)
3. **BBC Sound Effects** - High-quality, royalty-free sounds
4. **Adobe Audition** - Built-in sound library
5. **GarageBand** - Built-in loops and sounds (Mac)

### Search Terms:
- "notification chime"
- "bell sound"
- "alarm notification"
- "timer beep"
- "medical equipment sounds"

## Implementation Notes

- Sounds are automatically preloaded for faster playback
- Volume can be controlled by users in the interface
- Audio can be disabled for users who prefer silent operation
- Sounds work across all modern browsers with audio support

## Testing

To test the sound system:
1. Place your MP3 files in this directory
2. Start a station session - you should hear the start sound
3. Wait for 7 minutes - you should hear the warning sound
4. Wait for 7:55 minutes - you should hear the early end sound
5. Wait for 8 minutes - you should hear the final end sound

## Troubleshooting

If sounds don't play:
1. Check browser audio permissions
2. Ensure files are in MP3 format
3. Verify file paths are correct
4. Check browser console for errors
5. Test with different browsers
