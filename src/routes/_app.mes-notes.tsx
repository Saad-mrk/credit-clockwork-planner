import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download } from "lucide-react";
import { useDb, useSession } from "@/lib/store";
import { PageHeader, Panel, fmt, studentAverages, viewedStudent } from "@/components/shared";
import { mention } from "@/lib/grades";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/mes-notes")({
  head: () => ({ meta: [{ title: "Mes notes – EduTrack" }, { name: "description", content: "Relevé de notes" }, { property: "og:title", content: "Mes notes – EduTrack" }, { property: "og:description", content: "Notes et moyennes" }] }),
  component: MyGrades,
});

function MyGrades() {
  const db = useDb();
  const s = viewedStudent(db, useSession()!)!;
  const [sem, setSem] = useState<1 | 2>(1);
  const { rows, general } = studentAverages(db, s.id, sem);
  return (
    <>
      <PageHeader title={`Notes de ${s.name}`} desc={`Moyenne S${sem} : ${fmt(general)} · ${mention(general)}`} action={<Button variant="outline" onClick={() => window.print()}><Download className="h-4 w-4" /> Relevé PDF</Button>} />
      <div className="mb-4 flex gap-2">{([1, 2] as const).map((n) => <Button key={n} size="sm" variant={sem === n ? "default" : "outline"} onClick={() => setSem(n)}>Semestre {n}</Button>)}</div>
      <Panel>
        {!rows.length ? <p className="text-sm text-muted-foreground">Aucune note pour ce semestre.</p> : (
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground"><tr><th className="py-2">Matière</th><th>Coef</th><th>DS</th><th>TP</th><th>Examen</th><th>Moyenne</th></tr></thead>
            <tbody className="divide-y">{rows.map((r) => (
              <tr key={r.subject.id}><td className="py-2 font-medium">{r.subject.name}</td><td>{r.subject.coef}</td>
                {(["DS", "TP", "Examen"] as const).map((t) => <td key={t}>{r.grades.find((g) => g.type === t)?.value ?? "—"}</td>)}
                <td className={`font-semibold ${(r.avg ?? 0) < 10 ? "text-destructive" : "text-success"}`}>{fmt(r.avg)}</td></tr>
            ))}</tbody>
          </table>
        )}
      </Panel>
    </>
  );
}
