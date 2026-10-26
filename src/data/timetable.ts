import type { DB } from "@/data/seed";

export const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"] as const;
export const SLOTS = ["08:30 – 10:30", "10:45 – 12:45", "14:00 – 16:00", "16:15 – 18:15"] as const;
export interface Session { id: string; classId: string; day: number; slot: number; subjectId: string; teacherId: string; room: string }

/** Deterministic weekly timetable derived from classes & subjects. */
export function buildTimetable(db: DB): Session[] {
  const out: Session[] = [];
  db.classes.forEach((c, ci) => {
    for (let day = 0; day < 6; day++) {
      const slots = day === 5 ? 2 : 3;
      for (let k = 0; k < slots; k++) {
        const slot = (k + ci + day) % 4;
        const subj = db.subjects[(ci * 3 + day * 2 + k) % db.subjects.length];
        out.push({ id: `${c.id}-${day}-${slot}`, classId: c.id, day, slot, subjectId: subj.id, teacherId: subj.teacherId, room: `Salle ${String.fromCharCode(65 + ci)}${10 + ((day + k) % 9)}` });
      }
    }
  });
  return out;
}
