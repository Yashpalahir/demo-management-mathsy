-- =======================================
-- Mathsy Teacher Assignment Management
-- Supabase Database Schema
-- =======================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ===========================
-- TEACHERS TABLE
-- ===========================
create table if not exists teachers (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  mobile text not null,
  subjects text[] default '{}',
  available_days text[] default '{}',
  available_slots text[] default '{}',
  status text default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz default now()
);

-- ===========================
-- STUDENTS TABLE
-- ===========================
create table if not exists students (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  standard text not null,
  parent_name text not null,
  board text not null,
  address text not null,
  mobile text not null,
  subject text not null,
  preferred_day text not null,
  preferred_slot text not null,
  assigned_teacher_id uuid references teachers(id) on delete set null,
  status text default 'unassigned' check (status in ('unassigned', 'assigned', 'finalized', 'not_interested')),
  demo_status text default 'pending' check (demo_status in ('pending', 'successful', 'failed')),
  created_at timestamptz default now()
);

-- ===========================
-- TIMESLOTS TABLE
-- ===========================
create table if not exists timeslots (
  id uuid default uuid_generate_v4() primary key,
  teacher_id uuid references teachers(id) on delete cascade not null,
  day text not null,
  slot text not null,
  is_booked boolean default false,
  student_id uuid references students(id) on delete set null,
  created_at timestamptz default now(),
  unique(teacher_id, day, slot)
);

-- ===========================
-- ROW LEVEL SECURITY (RLS)
-- ===========================
alter table teachers enable row level security;
alter table students enable row level security;
alter table timeslots enable row level security;

-- Allow all operations for authenticated/anon (adjust for production)
create policy "Allow all for teachers" on teachers for all using (true) with check (true);
create policy "Allow all for students" on students for all using (true) with check (true);
create policy "Allow all for timeslots" on timeslots for all using (true) with check (true);

-- ===========================
-- INDEXES (for performance with 100+ teachers)
-- ===========================
create index if not exists idx_teachers_status on teachers(status);
create index if not exists idx_teachers_subjects on teachers using gin(subjects);
create index if not exists idx_students_status on students(status);
create index if not exists idx_students_assigned_teacher on students(assigned_teacher_id);
create index if not exists idx_timeslots_teacher on timeslots(teacher_id);
create index if not exists idx_timeslots_booked on timeslots(is_booked);

-- ===========================
-- SAMPLE DATA (Optional)
-- ===========================
-- Insert sample teachers:
insert into teachers (name, mobile, subjects, available_days, available_slots, status) values
  ('Rajesh Kumar', '9876543210', array['Mathematics', 'Physics'], array['Monday', 'Wednesday', 'Friday'], array['6:00 AM - 7:00 AM', '4:00 PM - 5:00 PM', '5:00 PM - 6:00 PM'], 'active'),
  ('Priya Sharma', '9123456789', array['English', 'Hindi'], array['Tuesday', 'Thursday', 'Saturday'], array['7:00 AM - 8:00 AM', '3:00 PM - 4:00 PM'], 'active'),
  ('Amit Singh', '9988776655', array['Chemistry', 'Biology'], array['Monday', 'Tuesday', 'Wednesday'], array['8:00 AM - 9:00 AM', '6:00 PM - 7:00 PM'], 'active');
