-- Ensure DELETE changefeeds include full row data for participants
alter table public.quiz_challenge_participants
  replica identity full;


