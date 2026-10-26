CREATE TABLE public.timetable_sessions (
  id text PRIMARY KEY,
  class_id text NOT NULL,
  day int NOT NULL,
  slot int NOT NULL,
  subject_id text NOT NULL,
  teacher_id text NOT NULL,
  room text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.timetable_sessions TO anon, authenticated;
GRANT ALL ON public.timetable_sessions TO service_role;
ALTER TABLE public.timetable_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read all" ON public.timetable_sessions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "write all" ON public.timetable_sessions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.timetable_sessions;