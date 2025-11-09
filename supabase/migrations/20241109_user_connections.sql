CREATE TABLE IF NOT EXISTS public.user_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  connection_type TEXT NOT NULL CHECK (connection_type IN ('friend', 'mentor')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'blocked', 'snoozed')) DEFAULT 'pending',
  initiated_by_requester BOOLEAN NOT NULL DEFAULT TRUE,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
  responded_at TIMESTAMPTZ,
  snoozed_until TIMESTAMPTZ,
  notes TEXT,
  CONSTRAINT requester_not_addressee CHECK (requester_id <> addressee_id)
);

CREATE INDEX IF NOT EXISTS idx_user_connections_requester_id ON public.user_connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_addressee_id ON public.user_connections(addressee_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_status ON public.user_connections(status);

CREATE UNIQUE INDEX IF NOT EXISTS user_connections_unique_pair
  ON public.user_connections (
    connection_type,
    LEAST(requester_id, addressee_id),
    GREATEST(requester_id, addressee_id)
  )
  WHERE status IN ('pending', 'accepted', 'snoozed');

COMMENT ON TABLE public.user_connections IS 'Stores friend and mentor connections between users';
COMMENT ON COLUMN public.user_connections.notes IS 'Optional notes provided when accepting mentor relationships';
COMMENT ON COLUMN public.user_connections.snoozed_until IS 'Timestamp until which the request is snoozed';

ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS pause_connection_requests BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.user_preferences.pause_connection_requests IS 'When true, blocks incoming friend and mentor requests.';

CREATE OR REPLACE FUNCTION public.is_staff_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'meded_team', 'ctf')
  );
$$;

CREATE POLICY "Connections visible to participants or staff"
  ON public.user_connections
  FOR SELECT
  USING (
    requester_id = auth.uid()
    OR addressee_id = auth.uid()
    OR public.is_staff_user()
  );

CREATE POLICY "Users can create connection requests"
  ON public.user_connections
  FOR INSERT
  WITH CHECK (
    requester_id = auth.uid()
    OR public.is_staff_user()
  );

CREATE POLICY "Participants or staff can update connections"
  ON public.user_connections
  FOR UPDATE
  USING (
    requester_id = auth.uid()
    OR addressee_id = auth.uid()
    OR public.is_staff_user()
  )
  WITH CHECK (
    requester_id = auth.uid()
    OR addressee_id = auth.uid()
    OR public.is_staff_user()
  );

CREATE POLICY "Participants or staff can delete connections"
  ON public.user_connections
  FOR DELETE
  USING (
    requester_id = auth.uid()
    OR addressee_id = auth.uid()
    OR public.is_staff_user()
  );
