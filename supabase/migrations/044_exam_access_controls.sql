-- 1. Create exam_access_controls table
create table if not exists exam_access_controls (
  id uuid default gen_random_uuid() primary key,
  batch text,
  student_id uuid references profiles(id),
  test_id uuid references exam_tests(id) not null,
  is_active boolean default false,
  teacher_id uuid references profiles(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. Enable RLS
alter table exam_access_controls enable row level security;

-- 3. Policy
create policy "Allow all access for now" on exam_access_controls
  for all using (true) with check (true);

-- 4. Unique constraints
alter table exam_access_controls 
add constraint exam_access_batch_unique unique (batch, test_id);

alter table exam_access_controls 
add constraint exam_access_student_unique unique (student_id, test_id);
