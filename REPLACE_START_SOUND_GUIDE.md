# Replace Start Sound Guide

This guide explains how to replace the default start sound with your own custom audio file.

## 🎵 Quick Setup

### 1. Prepare Your Audio File
- **Format**: MP3 (recommended for best compatibility)
- **Duration**: 2-3 seconds recommended
- **File Size**: Keep under 100KB for fast loading
- **Quality**: 128kbps or higher
- **Style**: Gentle, welcoming notification sound

### 2. Replace the File
1. Navigate to the `public/sounds/` directory
2. Replace the existing `station-start.mp3` file with your own
3. Keep the exact filename: `station-start.mp3`

### 3. Test Your Sound
1. Open `/test-audio.html` in your browser
2. Click the "🎬 Start Sound" button
3. Verify your custom sound plays correctly

## 🎯 Sound Recommendations

### Good Start Sounds
- **Soft chimes** - Gentle, welcoming
- **Notification tones** - Professional, clear
- **Bell sounds** - Classic, attention-grabbing
- **Musical notes** - Pleasant, non-intrusive

### Avoid These
- **Loud alarms** - Too jarring for start
- **Long sounds** - Keep under 3 seconds
- **Complex music** - Simple tones work better
- **Very low/high frequencies** - May not be heard clearly

## 🔧 Technical Details

### File Requirements
```
Filename: station-start.mp3
Location: public/sounds/station-start.mp3
Format: MP3
Duration: 2-3 seconds
Size: < 100KB
Sample Rate: 44.1kHz
Channels: Mono or Stereo
```

### Fallback Behavior
- If your MP3 file fails to load, the system will automatically play a system beep (800Hz, 0.5s)
- This ensures the audio notification always works, even with file issues

## 🧪 Testing Checklist

### Before Going Live
- [ ] File is named exactly `station-start.mp3`
- [ ] File is in the correct location: `public/sounds/`
- [ ] File plays correctly in `/test-audio.html`
- [ ] File plays when starting a station session
- [ ] Volume level is appropriate (not too loud/quiet)
- [ ] Sound doesn't interfere with voice conversation

### Browser Testing
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test on mobile devices

## 🎨 Customization Options

### Volume Control
Users can adjust the volume of your start sound using the sound settings panel in the station interface.

### Complete Replacement
If you want to replace ALL sounds (not just start), you'll need these files:
- `station-start.mp3` - Your custom start sound
- `time-warning.mp3` - Warning at 7 minutes
- `station-end-early.mp3` - Warning at 7:55
- `station-end.mp3` - Final end at 8 minutes

## 🐛 Troubleshooting

### Sound Doesn't Play
1. **Check filename**: Must be exactly `station-start.mp3`
2. **Check location**: Must be in `public/sounds/` directory
3. **Check format**: Must be MP3 format
4. **Check size**: Should be under 100KB
5. **Check browser**: Test in different browsers

### Sound Plays But Wrong Timing
- The start sound plays immediately when "Start Session" is clicked
- If it's playing at the wrong time, check the StationInterface.tsx code

### Sound Quality Issues
- **Too quiet**: Increase volume in your audio editor
- **Too loud**: Decrease volume in your audio editor
- **Distorted**: Check file quality and compression settings
- **Too long**: Trim to 2-3 seconds maximum

## 📱 Mobile Considerations

### iOS Safari
- May require user interaction before playing audio
- Test on actual iOS devices

### Android Chrome
- Generally works well with MP3 files
- Test volume levels on mobile speakers

## 🔄 Updating Your Sound

### To Replace Again
1. Simply replace the `station-start.mp3` file
2. Clear browser cache if needed
3. Test the new sound

### Version Control
- Consider backing up your original sound file
- Keep track of which sound file is currently in use
- Document any changes for team members

## 🎵 Audio Creation Tips

### Free Tools
- **Audacity** - Free audio editor
- **GarageBand** (Mac) - Built-in audio creation
- **Online tone generators** - Create simple beeps/chimes

### Professional Tools
- **Adobe Audition** - Professional audio editing
- **Logic Pro** (Mac) - Music production
- **Pro Tools** - Professional audio editing

### Online Resources
- **Freesound.org** - Free audio samples
- **Zapsplat** - Professional sound effects
- **BBC Sound Effects** - High-quality, royalty-free sounds

## 📋 Final Checklist

Before deploying your custom start sound:

- [ ] ✅ File is properly named and located
- [ ] ✅ Sound plays correctly in test page
- [ ] ✅ Sound plays when starting stations
- [ ] ✅ Volume is appropriate
- [ ] ✅ Duration is 2-3 seconds
- [ ] ✅ File size is under 100KB
- [ ] ✅ Tested on multiple browsers
- [ ] ✅ Tested on mobile devices
- [ ] ✅ Fallback system beep still works if file fails

Your custom start sound will now play every time a user begins a medical simulation station, providing a personalized touch to the Sim-Bleepy experience!
