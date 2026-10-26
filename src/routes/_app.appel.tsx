import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { uid, update, useDb, useSession } from "@/lib/store";
import { PageHeader, Panel } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_app/appel")({
  head: () => ({ meta: [{ title: "Appel & Justificatifs – EduTrack" }, { name: "description", content: "Faire l'appel et traiter les justificatifs" }, { property: "og:title", content: "Appel – EduTrack" }, { property: "og:description", content: "Gestion des présences" }] }),
  component: Attendance,
});

type St = "Présent" | "Absent" | "Retard";
const sel = "h-9 rounded-md border bg-background px-3 text-sm";

function Attendance() {
  const db = useDb();
  const me = useSession()!;
  const mine = db.subjects.filter((s) => s.teacherId === me.id);
  const [classId, setClassId] = useState(db.classes[0].id);
  const [subjectId, setSubjectId] = useState(mine[0]?.id ?? db.subjects[0].id);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const students = db.users.filter((u) => u.role === "STUDENT" && u.classId === classId);
  const [marks, setMarks] = useState<Record<string, St>>({});
  const get = (id: string): St => marks[id] ?? "Présent";
  const pending = db.absences.filter((a) => a.status === "en attente");

  const save = () => {
    const abs = students.filter((s) => get(s.id) !== "Présent").map((s) => ({ id: uid(), studentId: s.id, subjectId, date, kind: get(s.id) as "Absent" | "Retard", status: "non justifiée" as const }));
    update((d) => ({ ...d, absences: [...abs, ...d.absences] }));
    toast.success(`Appel enregistré : ${abs.length} absence(s)/retard(s)`); setMarks({});
  };
  const decide = (id: string, ok: boolean) => {
    update((d) => ({ ...d, absences: d.absences.map((a) => a.id === id ? { ...a, status: ok ? "justifiée" : "non justifiée" } : a) }));
    toast.success(ok ? "Justificatif approuvé" : "Justificatif rejeté");
  };
  const tone: Record<St, string> = { Présent: "bg-success text-primary-foreground", Absent: "bg-destructive text-destructive-foreground", Retard: "bg-warning text-foreground" };

  return (
    <>
      <PageHeader title="Appel" action={<div className="flex gap-2"><Button variant="outline" onClick={() => setMarks({})}>Tout présent</Button><Button onClick={save}>Valider l'appel</Button></div>} />
      <div className="mb-6 flex flex-wrap gap-3">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" aria-label="Date" />
        <select className={sel} value={classId} onChange={(e) => { setClassId(e.target.value); setMarks({}); }} aria-label="Classe">{db.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select className={sel} value={subjectId} onChange={(e) => setSubjectId(e.target.value)} aria-label="Matière">{(mine.length ? mine : db.subjects).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
      </div>
      <Panel>
        <ul className="divide-y">{students.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
            <span className="font-medium">{s.name}</span>
            <div className="flex gap-1" role="radiogroup" aria-label={s.name}>
              {(["Présent", "Absent", "Retard"] as St[]).map((st) => (
                <button key={st} role="radio" aria-checked={get(s.id) === st} onClick={() => setMarks({ ...marks, [s.id]: st })} className={`rounded-md px-3 py-1 text-xs font-medium transition ${get(s.id) === st ? tone[st] : "bg-muted text-muted-foreground hover:bg-accent"}`}>{st}</button>
              ))}
            </div>
          </li>
        ))}</ul>
      </Panel>
      <Panel title={`Justificatifs en attente (${pending.length})`} className="mt-6">
        {!pending.length ? <p className="text-sm text-muted-foreground">Aucun justificatif à traiter.</p> : (
          <ul className="divide-y text-sm">{pending.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <span><b>{db.users.find((u) => u.id === a.studentId)?.name}</b> · {db.subjects.find((m) => m.id === a.subjectId)?.name} · {a.date}<br /><span className="text-muted-foreground">{a.reason}</span></span>
              <div className="flex gap-2"><Button size="sm" onClick={() => decide(a.id, true)}><Check className="h-4 w-4" /> Approuver</Button><Button size="sm" variant="outline" onClick={() => decide(a.id, false)}><X className="h-4 w-4" /> Rejeter</Button></div>
            </li>
          ))}</ul>
        )}
      </Panel>
    </>
  );
}
