import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Clock, MapPin, User as UserIcon } from "lucide-react";
import { useDb, useSession } from "@/lib/store";
import { buildTimetable, DAYS, SLOTS } from "@/data/timetable";
import { PageHeader } from "@/components/shared";

export const Route = createFileRoute("/_app/emploi-du-temps")({
  head: () => ({ meta: [
    { title: "Emploi du temps — EduTrack" },
    { name: "description", content: "Emploi du temps hebdomadaire par classe et par jour." },
    { property: "og:title", content: "Emploi du temps — EduTrack" },
    { property: "og:description", content: "Consultez les cours de la semaine par classe et par jour." },
  ] }),
  component: Timetable,
});

const TONES = ["bg-primary/10 border-primary/30 text-primary", "bg-success/10 border-success/30 text-success", "bg-warning/15 border-warning/40 text-foreground", "bg-accent border-border text-accent-foreground"];

function Timetable() {
  const db = useDb();
  const user = useSession();
  const all = useMemo(() => buildTimetable(db), [db]);
  const ownClass = user?.role === "STUDENT" ? user.classId : user?.role === "PARENT" ? db.users.find((u) => u.id === user.childId)?.classId : undefined;
  const isTeacher = user?.role === "TEACHER";
  const [classId, setClassId] = useState(ownClass ?? (isTeacher ? "mine" : db.classes[0]?.id));
  const [day, setDay] = useState<number | "all">("all");
  if (!user) return null;

  const sessions = all.filter((s) => (classId === "mine" ? s.teacherId === user.id : s.classId === classId));
  const today = (new Date().getDay() + 6) % 7;
  const days = day === "all" ? DAYS.map((_, i) => i) : [day];
  const name = (id: string) => db.subjects.find((m) => m.id === id)?.name ?? "";
  const tName = (id: string) => db.users.find((u) => u.id === id)?.name ?? "";
  const cName = (id: string) => db.classes.find((c) => c.id === id)?.name ?? "";
  const hours = sessions.length * 2;

  return (
    <div>
      <PageHeader title="Emploi du temps" desc={`${sessions.length} séances · ${hours} h par semaine`} action={
        <div className="flex flex-wrap gap-2">
          {!ownClass && (
            <select value={classId} onChange={(e) => setClassId(e.target.value)} className="rounded-lg border bg-card px-3 py-2 text-sm">
              {isTeacher && <option value="mine">Mes cours</option>}
              {db.classes.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.filiere}</option>)}
            </select>
          )}
          <button onClick={() => window.print()} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Imprimer</button>
        </div>
      } />
      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", ...DAYS.map((_, i) => i)] as const).map((d) => (
          <button key={d} onClick={() => setDay(d)} className={`rounded-full border px-4 py-1.5 text-sm transition ${day === d ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent"}`}>
            {d === "all" ? "Semaine" : DAYS[d]}{d === today ? " •" : ""}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="bg-sidebar text-sidebar-foreground">
              <th className="w-32 p-3 text-left font-medium"><Clock className="inline h-4 w-4" /> Horaire</th>
              {days.map((d) => <th key={d} className={`p-3 text-left font-semibold ${d === today ? "text-sidebar-primary" : ""}`}>{DAYS[d]}</th>)}
            </tr>
          </thead>
          <tbody>
            {SLOTS.map((slot, si) => (
              <tr key={slot} className="border-t">
                <td className="p-3 align-top text-xs font-medium text-muted-foreground">{slot}</td>
                {days.map((d) => {
                  const list = sessions.filter((s) => s.day === d && s.slot === si);
                  return (
                    <td key={d} className={`p-2 align-top ${d === today ? "bg-primary/5" : ""}`}>
                      {list.map((s) => (
                        <div key={s.id} className={`mb-1 rounded-xl border p-2.5 ${TONES[Number(s.subjectId.slice(1)) % 4]}`}>
                          <div className="font-semibold">{name(s.subjectId)}</div>
                          <div className="mt-1 flex items-center gap-1 text-xs opacity-80"><MapPin className="h-3 w-3" />{s.room}{classId === "mine" && ` · ${cName(s.classId)}`}</div>
                          {!isTeacher && <div className="flex items-center gap-1 text-xs opacity-80"><UserIcon className="h-3 w-3" />{tName(s.teacherId)}</div>}
                        </div>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
