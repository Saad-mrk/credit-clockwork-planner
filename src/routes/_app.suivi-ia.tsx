import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";
import { useDb } from "@/lib/store";
import { PageHeader, Panel } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generateFollowUp } from "@/lib/followup.functions";

export const Route = createFileRoute("/_app/suivi-ia")({
  head: () => ({ meta: [{ title: "Plan de suivi IA – EduTrack" }, { name: "description", content: "Générer un plan de suivi personnalisé pour un élève" }, { property: "og:title", content: "Plan de suivi IA – EduTrack" }, { property: "og:description", content: "Suivi personnalisé des élèves par IA" }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: FollowUp,
});

const sel = "h-9 rounded-md border bg-background px-3 text-sm";

function FollowUp() {
  const db = useDb();
  const run = useServerFn(generateFollowUp);
  const students = db.users.filter((u) => u.role === "STUDENT");
  const [sid, setSid] = useState(students[0]?.id ?? "");
  const [abs, setAbs] = useState("");
  const [obs, setObs] = useState("");
  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const s = students.find((x) => x.id === sid);

  useEffect(() => {
    const list = db.absences.filter((a) => a.studentId === sid);
    setAbs(list.map((a) => `${a.date} · ${db.subjects.find((m) => m.id === a.subjectId)?.name ?? ""} · ${a.kind} · ${a.status}`).join("\n"));
    setPlan("");
  }, [sid]); // eslint-disable-line react-hooks/exhaustive-deps

  const go = async () => {
    if (!s) return;
    if (obs.trim().length < 5) return toast.error("Ajoute des observations (5 caractères min.)");
    setLoading(true);
    try {
      const r = await run({ data: { student: s.name, className: db.classes.find((c) => c.id === s.classId)?.name ?? "", absences: abs, observations: obs } });
      if (r.error) toast.error(r.error); else setPlan(r.plan);
    } catch { toast.error("Le plan n'a pas pu être généré."); }
    finally { setLoading(false); }
  };

  return (
    <>
      <PageHeader title="Plan de suivi IA" desc="Renseigne les absences et observations, l'IA propose un plan personnalisé." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Informations de l'élève">
          <div className="space-y-3">
            <select className={`${sel} w-full`} value={sid} onChange={(e) => setSid(e.target.value)} aria-label="Élève">
              {students.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <label className="block text-sm font-medium">Absences</label>
            <Textarea rows={5} value={abs} onChange={(e) => setAbs(e.target.value)} placeholder="Absences et retards" />
            <label className="block text-sm font-medium">Observations</label>
            <Textarea rows={6} value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Comportement, résultats, difficultés, points forts…" />
            <Button onClick={go} disabled={loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Générer le plan de suivi
            </Button>
          </div>
        </Panel>
        <Panel title="Plan proposé">
          {plan ? <div className="whitespace-pre-wrap text-sm leading-relaxed">{plan.replace(/\*\*/g, "")}</div>
            : <p className="text-sm text-muted-foreground">{loading ? "Génération en cours…" : "Le plan apparaîtra ici."}</p>}
        </Panel>
      </div>
    </>
  );
}
