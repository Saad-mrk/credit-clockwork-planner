import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { update, useDb, useSession } from "@/lib/store";
import { PageHeader, Panel, viewedStudent } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AbsStatus } from "@/data/seed";

export const Route = createFileRoute("/_app/mes-absences")({
  head: () => ({ meta: [{ title: "Absences – EduTrack" }, { name: "description", content: "Absences et justificatifs" }, { property: "og:title", content: "Absences – EduTrack" }, { property: "og:description", content: "Suivi des absences" }] }),
  component: MyAbsences,
});

const TONE: Record<AbsStatus, string> = { "justifiée": "bg-success/15 text-success", "non justifiée": "bg-destructive/10 text-destructive", "en attente": "bg-warning/15 text-warning" };

function MyAbsences() {
  const db = useDb();
  const user = useSession()!;
  const s = viewedStudent(db, user)!;
  const list = db.absences.filter((a) => a.studentId === s.id).sort((a, b) => b.date.localeCompare(a.date));
  const [target, setTarget] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [file, setFile] = useState<string | null>(null);
  const submit = () => {
    if (reason.trim().length < 5) return toast.error("Motif trop court (5 caractères min.)");
    update((d) => ({ ...d, absences: d.absences.map((a) => a.id === target ? { ...a, status: "en attente", reason } : a) }));
    toast.success("Justificatif envoyé"); setTarget(null); setReason(""); setFile(null);
  };
  return (
    <>
      <PageHeader title={`Absences de ${s.name}`} desc={`${list.filter((a) => a.status === "non justifiée").length} non justifiée(s) · seuil ${db.threshold}`} />
      <Panel>
        {!list.length ? <p className="text-sm text-muted-foreground">Aucune absence. Bravo !</p> : (
          <ul className="divide-y text-sm">{list.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <span><b>{new Date(a.date).toLocaleDateString("fr-FR", { dateStyle: "long" })}</b> · {db.subjects.find((m) => m.id === a.subjectId)?.name} · {a.kind}</span>
              <span className="flex items-center gap-2">
                <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${TONE[a.status]}`}>{a.status}</span>
                {a.status === "non justifiée" && user.role === "STUDENT" && <Button size="sm" variant="outline" onClick={() => setTarget(a.id)}>Justifier</Button>}
              </span>
            </li>
          ))}</ul>
        )}
      </Panel>
      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Envoyer un justificatif</DialogTitle></DialogHeader>
          <Textarea placeholder="Motif de l'absence" value={reason} onChange={(e) => setReason(e.target.value)} />
          <input type="file" accept="image/*,application/pdf" className="text-sm" onChange={(e) => { const f = e.target.files?.[0]; setFile(f && f.type.startsWith("image/") ? URL.createObjectURL(f) : null); }} />
          {file && <img src={file} alt="Aperçu du justificatif" className="max-h-40 rounded-lg border" />}
          <Button onClick={submit}>Envoyer</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
