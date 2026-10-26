import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@/data/timetable";

type Row = { id: string; class_id: string; day: number; slot: number; subject_id: string; teacher_id: string; room: string };
const toS = (r: Row): Session => ({ id: r.id, classId: r.class_id, day: r.day, slot: r.slot, subjectId: r.subject_id, teacherId: r.teacher_id, room: r.room });
const toR = (s: Session): Row => ({ id: s.id, class_id: s.classId, day: s.day, slot: s.slot, subject_id: s.subjectId, teacher_id: s.teacherId, room: s.room });

/** Shared timetable stored in Lovable Cloud; null = not loaded, [] = empty (use default). */
export function useSharedSessions() {
  const [rows, setRows] = useState<Session[] | null>(null);
  const load = useCallback(async () => {
    const { data } = await supabase.from("timetable_sessions").select("*");
    setRows((data ?? []).map(toS));
  }, []);
  useEffect(() => {
    load();
    const ch = supabase.channel(`tt-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "timetable_sessions" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);
  return { rows, reload: load };
}

export async function saveSession(s: Session, base: Session[], remoteEmpty: boolean) {
  const list = remoteEmpty ? base.filter((x) => x.id !== s.id).concat(s) : [s];
  const { error } = await supabase.from("timetable_sessions").upsert(list.map(toR));
  if (error) throw error;
}

export async function deleteSession(s: Session, base: Session[], remoteEmpty: boolean) {
  if (remoteEmpty) {
    const { error } = await supabase.from("timetable_sessions").upsert(base.filter((x) => x.id !== s.id).map(toR));
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from("timetable_sessions").delete().eq("id", s.id);
  if (error) throw error;
}
