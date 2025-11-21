-- Add music_track_id column to quiz_practice_sessions table
-- This allows users to select background music for their practice sessions

ALTER TABLE quiz_practice_sessions
ADD COLUMN IF NOT EXISTS music_track_id TEXT;

COMMENT ON COLUMN quiz_practice_sessions.music_track_id IS 'ID of the selected music track for the practice session. References tracks from challengeMusicTracks.';

