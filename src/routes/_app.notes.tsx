import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { uid, update, useDb, useSession } from "@/lib/store";
import { type EvalType, isValidGrade } from "@/lib/grades";
import { PageHeader, Panel, StatCard, fmt } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sigma, TrendingDown, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_app/notes")({
  head: () => ({ meta: [{ title: "Saisie des notes – EduTrack" }, { name: "description", content: "Saisie des notes par classe" }, { property: "og:title", content: "Saisie des notes – EduTrack" }, { property: "og:description", content: "Saisie des évaluations" }] }),
  component: GradeEntry,
});

const sel = "h-9 rounded-md border bg-background px-3 text-sm";

function GradeEntry() {
  const db = useDb();
  const me = useSession()!;
  const mySubjects = db.subjects.filter((s) => s.teacherId === me.id);
  const [classId, setClassId] = useState(db.classes[0].id);
  const [subjectId, setSubjectId] = useState(mySubjects[0]?.id ?? "");
  const [type, setType] = useState<EvalType>("DS");
  const students = db.users.filter((u) => u.role === "STUDENT" && u.classId === classId);
  const key = `${classId}-${subjectId}-${type}`;
  const initial = useMemo(() => Object.fromEntries(students.map((s) => [s.id, String(db.grades.find((g) => g.studentId === s.id && g.subjectId === subjectId && g.type === type)?.value ?? "")])), [key]); // eslint-disable-line
  const [vals, setVals] = useState<Record<string, string>>({});
  const v = { ...initial, ...(vals.__key === key ? vals : {}) };
  const set = (id: string, x: string) => setVals({ ...(vals.__key === key ? vals : {}), __key: key, [id]: x });
  const nums = students.map((s) => parseFloat(v[s.id])).filter((n) => isValidGrade(n));
  const invalid = students.some((s) => v[s.id] !== "" && !isValidGrade(parseFloat(v[s.id])));

  const save = () => {
    if (invalid) return toast.error("Certaines notes ne sont pas entre 0 et 20");
    update((d) => {
      const rest = d.grades.filter((g) => !(g.subjectId === subjectId && g.type === type && students.some((s) => s.id === g.studentId)));
      const added = students.filter((s) => v[s.id] !== "").map((s) => ({ id: uid(), studentId: s.id, subjectId, type, value: parseFloat(v[s.id]) }));
      return { ...d, grades: [...rest, ...added] };
    });
    toast.success(`${nums.length} notes enregistrées`);
  };

  if (!mySubjects.length) return <PageHeader title="Saisie des notes" desc="Aucune matière ne vous est attribuée." />;
  return (
    <>
      <PageHeader title="Saisie des notes" action={<Button onClick={save} disabled={invalid}>Enregistrer tout</Button>} />
      <div className="mb-6 flex flex-wrap gap-3">
        <select className={sel} value={classId} onChange={(e) => setClassId(e.target.value)} aria-label="Classe">{db.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select className={sel} value={subjectId} onChange={(e) => setSubjectId(e.target.value)} aria-label="Matière">{mySubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <select className={sel} value={type} onChange={(e) => setType(e.target.value as EvalType)} aria-label="Évaluation">{["DS", "TP", "Examen"].map((t) => <option key={t}>{t}</option>)}</select>
      </div>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Moyenne de la classe" value={fmt(nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null)} icon={Sigma} />
        <StatCard label="Note max" value={nums.length ? Math.max(...nums) : "—"} icon={TrendingUp} tone="success" />
        <StatCard label="Note min" value={nums.length ? Math.min(...nums) : "—"} icon={TrendingDown} tone="warning" />
      </div>
      <Panel>
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground"><tr><th className="py-2">Étudiant</th><th className="w-32">Note /20</th></tr></thead>
          <tbody className="divide-y">{students.map((s) => {
            const bad = v[s.id] !== "" && !isValidGrade(parseFloat(v[s.id]));
            return (
              <tr key={s.id}><td className="py-2">{s.name}</td>
                <td><Input type="number" step="0.25" min={0} max={20} value={v[s.id]} onChange={(e) => set(s.id, e.target.value)} aria-invalid={bad} className={bad ? "border-destructive" : ""} />
                  {bad && <p className="text-xs text-destructive">Entre 0 et 20</p>}</td></tr>
            );
          })}</tbody>
        </table>
      </Panel>
    </>
  );
}
