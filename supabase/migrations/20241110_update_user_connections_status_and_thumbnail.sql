ALTER TABLE public.user_connections
  DROP CONSTRAINT IF EXISTS user_connections_status_check;

ALTER TABLE public.user_connections
  ADD CONSTRAINT user_connections_status_check
  CHECK (status IN ('pending', 'accepted', 'blocked', 'snoozed', 'declined'));

DROP INDEX IF EXISTS user_connections_unique_pair;

CREATE UNIQUE INDEX user_connections_unique_pair
  ON public.user_connections (
    connection_type,
    LEAST(requester_id, addressee_id),
    GREATEST(requester_id, addressee_id)
  )
  WHERE status IN ('pending', 'accepted', 'snoozed', 'declined');

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS avatar_thumbnail TEXT;
