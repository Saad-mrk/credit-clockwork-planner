import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { DB, User } from "@/data/seed";
import { subjectAverage, weightedAverage } from "@/lib/grades";

export function PageHeader({ title, desc, action }: { title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {desc && <p className="text-sm text-muted-foreground">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, tone = "primary" }: { label: string; value: ReactNode; icon: LucideIcon; tone?: "primary" | "success" | "warning" | "destructive" }) {
  const tones = { primary: "bg-primary/10 text-primary", success: "bg-success/10 text-success", warning: "bg-warning/15 text-warning", destructive: "bg-destructive/10 text-destructive" };
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={`rounded-lg p-2 ${tones[tone]}`}><Icon className="h-4 w-4" /></span>
      </div>
      <div className="mt-3 text-2xl font-bold">{value}</div>
    </div>
  );
}

export function Panel({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border bg-card p-5 shadow-sm ${className}`}>
      {title && <h2 className="mb-4 font-semibold">{title}</h2>}
      {children}
    </section>
  );
}

/** Student viewed by current user (self for student, child for parent) */
export function viewedStudent(db: DB, user: User): User | undefined {
  const id = user.role === "PARENT" ? user.childId : user.id;
  return db.users.find((u) => u.id === id);
}

export function studentAverages(db: DB, studentId: string, semester?: 1 | 2) {
  const rows = db.subjects
    .filter((s) => !semester || s.semester === semester)
    .map((s) => {
      const gs = db.grades.filter((g) => g.studentId === studentId && g.subjectId === s.id);
      return { subject: s, grades: gs, avg: subjectAverage(gs) };
    })
    .filter((r) => r.grades.length);
  return { rows, general: weightedAverage(rows.map((r) => ({ avg: r.avg, coef: r.subject.coef }))) };
}

export const fmt = (n: number | null) => (n === null ? "—" : n.toFixed(2));
