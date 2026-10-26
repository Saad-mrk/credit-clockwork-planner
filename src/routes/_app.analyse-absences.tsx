import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarX, Clock, Percent, ShieldCheck } from "lucide-react";
import { useDb } from "@/lib/store";
import { PageHeader, Panel, StatCard } from "@/components/shared";

export const Route = createFileRoute("/_app/analyse-absences")({
  head: () => ({ meta: [
    { title: "Analyse des absences — EduTrack" },
    { name: "description", content: "Comparer les taux d'absence par mois, filière et classe." },
    { property: "og:title", content: "Analyse des absences — EduTrack" },
    { property: "og:description", content: "Tendances et taux d'absence avec graphiques interactifs." },
  ] }),
  component: Analysis,
});

const SESSIONS_PER_MONTH = 30;
const MONTH_FR = ["Janv.", "Févr.", "Mars", "Avr.", "Mai", "Juin", "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc."];

function Analysis() {
  const db = useDb();
  const [dim, setDim] = useState<"class" | "filiere" | "subject">("class");
  const [month, setMonth] = useState("all");
  const [kind, setKind] = useState("all");
  const students = db.users.filter((u) => u.role === "STUDENT");
  const clsOf = (sid: string) => db.classes.find((c) => c.id === students.find((s) => s.id === sid)?.classId);
  const months = useMemo(() => [...new Set(db.absences.map((a) => a.date.slice(0, 7)))].sort(), [db]);
  const mLabel = (m: string) => `${MONTH_FR[+m.slice(5) - 1]} ${m.slice(0, 4)}`;
  const list = db.absences.filter((a) => (month === "all" || a.date.startsWith(month)) && (kind === "all" || a.kind === kind));
  const nMonths = month === "all" ? months.length || 1 : 1;
  const rate = (n: number, pop: number) => +((n / (Math.max(pop, 1) * SESSIONS_PER_MONTH * nMonths)) * 100).toFixed(2);

  const groups = dim === "class"
    ? db.classes.map((c) => ({ key: c.name, pop: students.filter((s) => s.classId === c.id).length, match: (a: typeof list[0]) => clsOf(a.studentId)?.id === c.id }))
    : dim === "filiere"
    ? [...new Set(db.classes.map((c) => c.filiere))].map((f) => ({ key: f, pop: students.filter((s) => db.classes.find((c) => c.id === s.classId)?.filiere === f).length, match: (a: typeof list[0]) => clsOf(a.studentId)?.filiere === f }))
    : db.subjects.map((m) => ({ key: m.name, pop: students.length, match: (a: typeof list[0]) => a.subjectId === m.id }));
  const compare = groups.map((g) => {
    const l = list.filter(g.match);
    return { name: g.key, taux: rate(l.length, g.pop), justifiées: l.filter((a) => a.status === "justifiée").length, "non justifiées": l.filter((a) => a.status === "non justifiée").length, "en attente": l.filter((a) => a.status === "en attente").length };
  }).sort((a, b) => b.taux - a.taux);

  const trend = months.map((m) => {
    const row: Record<string, string | number> = { mois: mLabel(m) };
    db.classes.forEach((c) => { row[c.name] = db.absences.filter((a) => a.date.startsWith(m) && (kind === "all" || a.kind === kind) && clsOf(a.studentId)?.id === c.id).length; });
    return row;
  });
  const weekday = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d, i) => ({ jour: d, absences: list.filter((a) => (new Date(a.date).getDay() + 6) % 7 === i).length }));
  const justified = list.length ? Math.round((list.filter((a) => a.status === "justifiée").length / list.length) * 100) : 0;
  const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--primary)"];
  const sel = "rounded-lg border bg-card px-3 py-2 text-sm";

  return (
    <>
      <PageHeader title="Analyse des absences" desc="Comparez les mois, filières et classes" action={
        <div className="flex flex-wrap gap-2">
          <select className={sel} value={month} onChange={(e) => setMonth(e.target.value)}><option value="all">Tous les mois</option>{months.map((m) => <option key={m} value={m}>{mLabel(m)}</option>)}</select>
          <select className={sel} value={kind} onChange={(e) => setKind(e.target.value)}><option value="all">Absences & retards</option><option value="Absent">Absences</option><option value="Retard">Retards</option></select>
        </div>
      } />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total" value={list.length} icon={CalendarX} />
        <StatCard label="Taux global" value={`${rate(list.length, students.length)} %`} icon={Percent} tone="destructive" />
        <StatCard label="Retards" value={list.filter((a) => a.kind === "Retard").length} icon={Clock} tone="warning" />
        <StatCard label="Taux de justification" value={`${justified} %`} icon={ShieldCheck} tone="success" />
      </div>
      <Panel title="Comparaison" className="mt-6">
        <div className="mb-4 flex flex-wrap gap-2">
          {([["class", "Classes"], ["filiere", "Filières"], ["subject", "Matières"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setDim(k)} className={`rounded-full border px-4 py-1.5 text-sm ${dim === k ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent"}`}>{l}</button>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-72"><ResponsiveContainer><BarChart data={compare} layout="vertical" margin={{ left: 40 }}><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" unit=" %" /><YAxis type="category" dataKey="name" fontSize={11} width={110} /><Tooltip formatter={(v) => `${v} %`} /><Bar dataKey="taux" name="Taux d'absence" fill="var(--destructive)" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer></div>
          <div className="h-72"><ResponsiveContainer><BarChart data={compare}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={10} /><YAxis /><Tooltip /><Legend /><Bar dataKey="justifiées" stackId="a" fill="var(--success)" /><Bar dataKey="en attente" stackId="a" fill="var(--warning)" /><Bar dataKey="non justifiées" stackId="a" fill="var(--destructive)" /></BarChart></ResponsiveContainer></div>
        </div>
      </Panel>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Tendance mensuelle par classe" className="lg:col-span-2"><div className="h-72"><ResponsiveContainer><AreaChart data={trend}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="mois" /><YAxis /><Tooltip /><Legend />{db.classes.map((c, i) => <Area key={c.id} type="monotone" dataKey={c.name} stackId="1" stroke={colors[i % 6]} fill={colors[i % 6]} fillOpacity={0.35} />)}</AreaChart></ResponsiveContainer></div></Panel>
        <Panel title="Par jour de la semaine"><div className="h-72"><ResponsiveContainer><BarChart data={weekday}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="jour" /><YAxis /><Tooltip /><Bar dataKey="absences" fill="var(--primary)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></Panel>
      </div>
    </>
  );
}
