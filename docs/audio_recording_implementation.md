# Audio Recording & Transcription Implementation

## Overview
Implemented live audio recording with real-time transcription using Web Speech API for level-007.

## What Was Changed

### 1. `lib/transcriber.ts`
- **Removed**: File upload transcription (wasn't working due to mic permission issues)
- **Added**: `startRecording()` function for live microphone recording
- Uses Web Speech API (designed for live mic input)
- Returns control object with `stop()` method
- Provides callbacks for transcript updates and errors

### 2. `components/FileSystemExplorer.tsx`
- **Added**: Recording UI in level-007
  - "Start Recording" button (red, with mic icon)
  - "Stop Recording" button (animated pulse when active)
  - Live transcript preview during recording
- **Added**: State management for recording
  - `isRecording`: tracks recording state
  - `recordingTranscript`: accumulates final transcripts
  - `recordingControl`: holds stop() method
- **Simplified**: File upload (removed audio file handling)
- **Auto-creates**: `.txt` file with transcription when stopped

### 3. `pages/play/[level].tsx`
- **Simplified**: `handleUploadFile()` signature (removed transcription param)

## How It Works

1. User clicks "Start Recording" in level-007's File Explorer
2. If `audio_transcription.txt` exists, confirmation dialog appears
3. Browser requests microphone permission (user must allow)
4. Web Speech API starts listening
5. As user speaks:
   - Interim results show in real-time (preview)
   - Final results accumulate in transcript
6. User clicks "Stop Recording"
7. System creates/overwrites `audio_transcription.txt` with full transcription
8. **File is automatically committed** (made available to agent)
9. Success message: "Transcription saved and committed as audio_transcription.txt"

## User Experience

✅ Simple "Start/Stop Recording" buttons
✅ Real-time transcript preview
✅ Auto-saves to `audio_transcription.txt` (fixed filename)
✅ **Auto-commits** file (immediately available to agent)
✅ Overwrite protection with confirmation dialog
✅ Works entirely client-side (no server costs)
✅ Good accuracy for clear speech
⚠️ Requires microphone permission
⚠️ Chrome/Edge recommended (best Speech API support)

## Testing Checklist

**First Recording:**
- [ ] Navigate to level-007
- [ ] Click "Start Recording" button
- [ ] Allow microphone permission
- [ ] Speak clearly: "This is a test transcription"
- [ ] Verify live preview shows text
- [ ] Click "Stop Recording"
- [ ] Verify success message: "Transcription saved and committed as audio_transcription.txt"
- [ ] Verify `audio_transcription.txt` appears in File Explorer
- [ ] Click on file to view content
- [ ] Verify transcription accuracy
- [ ] Verify file is already committed (no "U" badge, available to agent)

**Second Recording (Overwrite Test):**
- [ ] Click "Start Recording" again
- [ ] Verify confirmation dialog appears
- [ ] Click "Cancel" → Recording should not start
- [ ] Click "Start Recording" again
- [ ] Click "OK" on confirmation
- [ ] Speak new text: "This is the second recording"
- [ ] Click "Stop Recording"
- [ ] Verify file content is replaced with new text
- [ ] Verify file is auto-committed again

## Browser Compatibility

- ✅ Chrome/Edge: Full support
- ⚠️ Firefox: Limited support
- ❌ Safari: Partial support (may require prefix)

## Configuration

### Debug Logging
Debug logs can be enabled/disabled via `config/transcriber.json`:
```json
{
  "enableDebugLogging": false
}
```
Set to `true` to see detailed console logs for debugging.

## File Naming & Overwrite Protection

- Transcription is saved as **`audio_transcription.txt`** (fixed name)
- If file already exists, user is prompted to confirm overwrite
- Confirmation dialog: "A file named 'audio_transcription.txt' already exists. Recording will overwrite it. Continue?"
- If user cancels, recording is not started
- If confirmed, new recording replaces the old file

## Notes

- Transcription quality depends on:
  - Clear speech
  - Good microphone
  - Low background noise
  - Internet connection (API uses cloud processing)
