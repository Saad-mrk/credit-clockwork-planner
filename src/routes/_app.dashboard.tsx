import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, BookOpen, CalendarX, GraduationCap, School, Trophy, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useDb, useSession } from "@/lib/store";
import { PageHeader, Panel, StatCard, fmt, studentAverages, viewedStudent } from "@/components/shared";
import { absenceAlert, computeRanking, mention } from "@/lib/grades";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Tableau de bord – EduTrack" }, { name: "description", content: "Vue d'ensemble EduTrack" }, { property: "og:title", content: "Tableau de bord – EduTrack" }, { property: "og:description", content: "Vue d'ensemble des notes et absences" }] }),
  component: Dashboard,
});

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function Dashboard() {
  const user = useSession()!;
  const db = useDb();
  if (user.role === "ADMIN") return <AdminDash />;
  if (user.role === "TEACHER") {
    const mine = db.subjects.filter((s) => s.teacherId === user.id);
    const pending = db.absences.filter((a) => a.status === "en attente").length;
    return (
      <>
        <PageHeader title={`Bonjour, ${user.name.split(" ")[0]}`} desc="Votre journée d'enseignement" />
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Mes matières" value={mine.length} icon={BookOpen} />
          <StatCard label="Classes" value={db.classes.length} icon={School} tone="success" />
          <StatCard label="Justificatifs à traiter" value={pending} icon={AlertTriangle} tone="warning" />
        </div>
        <Panel title="Actions rapides" className="mt-6">
          <div className="flex flex-wrap gap-3">
            <Button asChild><Link to="/notes">Saisir des notes</Link></Button>
            <Button asChild variant="outline"><Link to="/appel">Faire l'appel</Link></Button>
          </div>
          <ul className="mt-5 divide-y text-sm">{mine.map((m) => <li key={m.id} className="py-2">{m.name} <span className="text-muted-foreground">· coef {m.coef} · S{m.semester}</span></li>)}</ul>
        </Panel>
      </>
    );
  }
  const s = viewedStudent(db, user)!;
  const { rows, general } = studentAverages(db, s.id);
  const classmates = db.users.filter((u) => u.classId === s.classId);
  const rank = computeRanking(classmates.map((c) => ({ id: c.id, avg: studentAverages(db, c.id).general })))[s.id];
  const unj = db.absences.filter((a) => a.studentId === s.id && a.status === "non justifiée").length;
  return (
    <>
      <PageHeader title={user.role === "PARENT" ? `Suivi de ${s.name}` : `Bonjour, ${s.name.split(" ")[0]}`} desc={db.classes.find((c) => c.id === s.classId)?.name} />
      {absenceAlert(unj, db.threshold - 1) && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm"><AlertTriangle className="h-5 w-5 text-warning" /> {unj} absence(s) non justifiée(s) — seuil : {db.threshold}.</div>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Moyenne générale" value={`${fmt(general)} · ${mention(general)}`} icon={GraduationCap} />
        <StatCard label="Rang" value={`${rank ?? "—"} / ${classmates.length}`} icon={Trophy} tone="success" />
        <StatCard label="Absences non justifiées" value={unj} icon={CalendarX} tone={unj >= db.threshold ? "destructive" : "warning"} />
      </div>
      <Panel title="Moyennes par matière" className="mt-6">
        <div className="h-64"><ResponsiveContainer><BarChart data={rows.map((r) => ({ name: r.subject.name, moy: r.avg }))}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={11} /><YAxis domain={[0, 20]} /><Tooltip /><Bar dataKey="moy" fill="var(--primary)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
      </Panel>
    </>
  );
}

function AdminDash() {
  const db = useDb();
  const students = db.users.filter((u) => u.role === "STUDENT");
  const perClass = db.classes.map((c) => {
    const avgs = students.filter((s) => s.classId === c.id).map((s) => studentAverages(db, s.id).general ?? 0);
    return { name: c.name, moy: +(avgs.reduce((a, b) => a + b, 0) / (avgs.length || 1)).toFixed(2) };
  });
  const months = ["2026-09", "2026-10"].map((m) => ({ mois: m === "2026-09" ? "Sept." : "Oct.", absences: db.absences.filter((a) => a.date.startsWith(m)).length }));
  const mentions: Record<string, number> = {};
  students.forEach((s) => { const m = mention(studentAverages(db, s.id).general); mentions[m] = (mentions[m] ?? 0) + 1; });
  const rate = ((db.absences.length / (students.length * 60)) * 100).toFixed(1);
  return (
    <>
      <PageHeader title="Tableau de bord" desc="Année universitaire 2026–2027" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Étudiants" value={students.length} icon={Users} />
        <StatCard label="Enseignants" value={db.users.filter((u) => u.role === "TEACHER").length} icon={GraduationCap} tone="success" />
        <StatCard label="Classes" value={db.classes.length} icon={School} tone="warning" />
        <StatCard label="Taux d'absentéisme" value={`${rate} %`} icon={CalendarX} tone="destructive" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Moyenne par classe" className="lg:col-span-2"><div className="h-64"><ResponsiveContainer><BarChart data={perClass}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={11} /><YAxis domain={[0, 20]} /><Tooltip /><Bar dataKey="moy" fill="var(--primary)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></Panel>
        <Panel title="Répartition des mentions"><div className="h-64"><ResponsiveContainer><PieChart><Pie data={Object.entries(mentions).map(([name, value]) => ({ name, value }))} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>{Object.keys(mentions).map((k, i) => <Cell key={k} fill={COLORS[i % 5]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div></Panel>
        <Panel title="Évolution des absences" className="lg:col-span-3"><div className="h-56"><ResponsiveContainer><LineChart data={months}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="mois" /><YAxis /><Tooltip /><Line dataKey="absences" stroke="var(--destructive)" strokeWidth={2} /></LineChart></ResponsiveContainer></div></Panel>
      </div>
    </>
  );
}
