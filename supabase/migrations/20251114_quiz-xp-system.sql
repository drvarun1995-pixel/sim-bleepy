-- Quiz XP + Leaderboard system

-- Create table to store aggregated quiz XP per user
CREATE TABLE IF NOT EXISTS quiz_user_xp (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  level_progress INTEGER NOT NULL DEFAULT 0,
  xp_to_next INTEGER NOT NULL DEFAULT 1000,
  last_awarded_at TIMESTAMPTZ
);

-- Detailed ledger of XP awards for transparency/debugging
CREATE TABLE IF NOT EXISTS quiz_xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  source_type TEXT,
  source_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_xp_transactions_user ON quiz_xp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_xp_transactions_created ON quiz_xp_transactions(created_at DESC);

-- Prevent duplicate awards for the same source (e.g., session or challenge)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_quiz_xp_transactions_source
  ON quiz_xp_transactions(user_id, source_type, source_id)
  WHERE source_type IS NOT NULL AND source_id IS NOT NULL;

-- Snapshot table for future weekly/monthly leaderboard caching
CREATE TABLE IF NOT EXISTS quiz_leaderboard_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period TEXT NOT NULL CHECK (period IN ('weekly', 'monthly', 'all_time')),
  snapshot_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_xp INTEGER NOT NULL,
  rank INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quiz_leaderboard_snapshots_period_date
  ON quiz_leaderboard_snapshots(period, snapshot_date DESC);

-- Flag for users opting in to the quiz leaderboard
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS show_quiz_leaderboard BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill XP for existing quiz activity using the new formulas
WITH practice_totals AS (
  SELECT
    user_id,
    COALESCE(SUM(COALESCE(correct_count, 0) * 100 + CASE WHEN completed THEN 25 ELSE 0 END), 0) AS practice_xp
  FROM quiz_practice_sessions
  GROUP BY user_id
),
challenge_totals AS (
  SELECT
    user_id,
    COALESCE(SUM(GREATEST(0, COALESCE(final_score, 0) / 2) + 100), 0) AS challenge_xp
  FROM quiz_challenge_participants
  GROUP BY user_id
),
xp_source AS (
  SELECT
    u.id AS user_id,
    COALESCE(pt.practice_xp, 0) + COALESCE(ct.challenge_xp, 0) AS total_xp
  FROM users u
  LEFT JOIN practice_totals pt ON pt.user_id = u.id
  LEFT JOIN challenge_totals ct ON ct.user_id = u.id
)
INSERT INTO quiz_user_xp (user_id, total_xp, current_level, level_progress, xp_to_next, last_awarded_at)
SELECT
  user_id,
  total_xp,
  GREATEST(1, FLOOR(COALESCE(total_xp, 0) / 1000) + 1) AS current_level,
  MOD(COALESCE(total_xp, 0), 1000) AS level_progress,
  1000 AS xp_to_next,
  NOW() AS last_awarded_at
FROM xp_source
WHERE total_xp > 0
ON CONFLICT (user_id) DO UPDATE
SET
  total_xp = EXCLUDED.total_xp,
  current_level = EXCLUDED.current_level,
  level_progress = EXCLUDED.level_progress,
  xp_to_next = EXCLUDED.xp_to_next,
  last_awarded_at = EXCLUDED.last_awarded_at;


