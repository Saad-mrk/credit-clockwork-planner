import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { uid, update, useDb, resetDb } from "@/lib/store";
import { PageHeader, Panel } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_app/matieres")({
  head: () => ({ meta: [{ title: "Classes & Matières – EduTrack" }, { name: "description", content: "Filières, classes et matières" }, { property: "og:title", content: "Classes & Matières – EduTrack" }, { property: "og:description", content: "Gestion pédagogique" }] }),
  component: Subjects,
});

function Subjects() {
  const db = useDb();
  const teachers = db.users.filter((u) => u.role === "TEACHER");
  const [f, setF] = useState({ name: "", coef: 2, semester: 1 as 1 | 2, teacherId: teachers[0]?.id ?? "" });
  const add = () => {
    if (f.name.length < 2 || f.coef < 1) return toast.error("Nom ou coefficient invalide");
    update((d) => ({ ...d, subjects: [...d.subjects, { id: uid(), ...f }] }));
    setF({ ...f, name: "" }); toast.success("Matière ajoutée");
  };
  return (
    <>
      <PageHeader title="Classes & Matières" action={<Button variant="outline" onClick={() => { if (confirm("Réinitialiser toutes les données de démo ?")) resetDb(); }}>Réinitialiser les données</Button>} />
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Classes">
          <ul className="divide-y text-sm">{db.classes.map((c) => <li key={c.id} className="flex justify-between py-2"><span><b>{c.name}</b> <span className="text-muted-foreground">· {c.filiere}</span></span><span>{db.users.filter((u) => u.classId === c.id).length} étud.</span></li>)}</ul>
          <div className="mt-6 space-y-2 border-t pt-4 text-sm">
            <Label2>Seuil d'absences non justifiées</Label2>
            <Input type="number" min={1} value={db.threshold} onChange={(e) => update((d) => ({ ...d, threshold: Math.max(1, +e.target.value) }))} />
          </div>
        </Panel>
        <Panel title="Matières" className="lg:col-span-2">
          <div className="mb-4 grid gap-2 sm:grid-cols-5">
            <Input className="sm:col-span-2" placeholder="Nom de la matière" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <Input type="number" min={1} max={6} aria-label="Coefficient" value={f.coef} onChange={(e) => setF({ ...f, coef: +e.target.value })} />
            <select className="rounded-md border bg-background px-2 text-sm" value={f.teacherId} onChange={(e) => setF({ ...f, teacherId: e.target.value })}>{teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
            <Button onClick={add}>Ajouter</Button>
          </div>
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground"><tr><th className="py-2">Matière</th><th>Coef</th><th>Semestre</th><th>Enseignant</th><th /></tr></thead>
            <tbody className="divide-y">{db.subjects.map((s) => (
              <tr key={s.id}><td className="py-2 font-medium">{s.name}</td><td>{s.coef}</td><td>S{s.semester}</td><td>{db.users.find((u) => u.id === s.teacherId)?.name}</td>
                <td className="text-right"><Button size="icon" variant="ghost" aria-label="Supprimer" onClick={() => confirm("Supprimer cette matière ?") && update((d) => ({ ...d, subjects: d.subjects.filter((x) => x.id !== s.id) }))}><Trash2 className="h-4 w-4 text-destructive" /></Button></td></tr>
            ))}</tbody>
          </table>
        </Panel>
      </div>
    </>
  );
}
const Label2 = ({ children }: { children: string }) => <p className="font-medium">{children}</p>;
