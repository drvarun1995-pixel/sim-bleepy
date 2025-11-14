alter table public.quiz_questions
  add column if not exists asset_folder_id text;

update public.quiz_questions
set asset_folder_id = id
where asset_folder_id is null;

alter table public.quiz_questions
  alter column asset_folder_id set not null;


