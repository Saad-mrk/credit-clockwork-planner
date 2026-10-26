import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Clock, MapPin, Pencil, Plus, Trash2, User as UserIcon, X } from "lucide-react";
import { toast } from "sonner";
import { uid, useDb, useSession } from "@/lib/store";
import { deleteSession, saveSession, useSharedSessions } from "@/lib/timetable-db";
import { buildTimetable, DAYS, SLOTS, type Session } from "@/data/timetable";
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
  const { rows, reload } = useSharedSessions();
  const remoteEmpty = rows !== null && rows.length === 0;
  const all = useMemo(() => (rows && rows.length ? rows : buildTimetable(db)), [rows, db]);
  const ownClass = user?.role === "STUDENT" ? user.classId : user?.role === "PARENT" ? db.users.find((u) => u.id === user.childId)?.classId : undefined;
  const isTeacher = user?.role === "TEACHER";
  const isAdmin = user?.role === "ADMIN";
  const [classId, setClassId] = useState(ownClass ?? (isTeacher ? "mine" : db.classes[0]?.id));
  const [day, setDay] = useState<number | "all">("all");
  const [edit, setEdit] = useState<Session | null>(null);
  if (!user) return null;

  const sessions = all.filter((s) => (classId === "mine" ? s.teacherId === user.id : s.classId === classId));
  const today = (new Date().getDay() + 6) % 7;
  const days = day === "all" ? DAYS.map((_, i) => i) : [day];
  const name = (id: string) => db.subjects.find((m) => m.id === id)?.name ?? "";
  const tName = (id: string) => db.users.find((u) => u.id === id)?.name ?? "";
  const cName = (id: string) => db.classes.find((c) => c.id === id)?.name ?? "";
  const canEdit = isAdmin && classId !== "mine";

  const submit = async (s: Session) => {
    const clash = all.find((x) => x.id !== s.id && x.day === s.day && x.slot === s.slot && (x.classId === s.classId || x.teacherId === s.teacherId));
    if (clash) return toast.error(clash.classId === s.classId ? "Cette classe a déjà un cours sur ce créneau." : "Cet enseignant a déjà un cours sur ce créneau.");
    try { await saveSession(s, all, remoteEmpty); await reload(); toast.success("Cours enregistré"); setEdit(null); }
    catch { toast.error("Échec de l'enregistrement"); }
  };
  const remove = async (s: Session) => {
    if (!confirm(`Supprimer ${name(s.subjectId)} (${DAYS[s.day]}, ${SLOTS[s.slot]}) ?`)) return;
    try { await deleteSession(s, all, remoteEmpty); await reload(); toast.success("Cours supprimé"); setEdit(null); }
    catch { toast.error("Échec de la suppression"); }
  };
  const blank = (d: number, slot: number): Session => {
    const m = db.subjects[0];
    return { id: `new-${uid()}`, classId, day: d, slot, subjectId: m.id, teacherId: m.teacherId, room: "" };
  };

  return (
    <div>
      <PageHeader title="Emploi du temps" desc={`${sessions.length} séances · ${sessions.length * 2} h par semaine`} action={
        <div className="flex flex-wrap gap-2">
          {!ownClass && (
            <select value={classId} onChange={(e) => setClassId(e.target.value)} className="rounded-lg border bg-card px-3 py-2 text-sm">
              {isTeacher && <option value="mine">Mes cours</option>}
              {db.classes.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.filiere}</option>)}
            </select>
          )}
          {canEdit && <button onClick={() => setEdit(blank(day === "all" ? 0 : day, 0))} className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4" /> Ajouter un cours</button>}
          <button onClick={() => window.print()} className="rounded-lg border bg-card px-4 py-2 text-sm font-medium hover:bg-accent">Imprimer</button>
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
                    <td key={d} className={`group p-2 align-top ${d === today ? "bg-primary/5" : ""}`}>
                      {list.map((s) => (
                        <div key={s.id} className={`relative mb-1 rounded-xl border p-2.5 ${TONES[Number(s.subjectId.slice(1)) % 4]}`}>
                          <div className="pr-12 font-semibold">{name(s.subjectId)}</div>
                          <div className="mt-1 flex items-center gap-1 text-xs opacity-80"><MapPin className="h-3 w-3" />{s.room || "—"}{classId === "mine" && ` · ${cName(s.classId)}`}</div>
                          {!isTeacher && <div className="flex items-center gap-1 text-xs opacity-80"><UserIcon className="h-3 w-3" />{tName(s.teacherId)}</div>}
                          {canEdit && (
                            <div className="absolute right-1.5 top-1.5 flex gap-0.5">
                              <button aria-label="Modifier" onClick={() => setEdit(s)} className="rounded p-1 hover:bg-card"><Pencil className="h-3.5 w-3.5" /></button>
                              <button aria-label="Supprimer" onClick={() => remove(s)} className="rounded p-1 text-destructive hover:bg-card"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                          )}
                        </div>
                      ))}
                      {canEdit && !list.length && (
                        <button onClick={() => setEdit(blank(d, si))} className="flex w-full items-center justify-center rounded-xl border border-dashed py-3 text-xs text-muted-foreground opacity-0 transition hover:bg-accent group-hover:opacity-100"><Plus className="h-3.5 w-3.5" /> Ajouter</button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {edit && <EditDialog value={edit} isNew={!all.some((x) => x.id === edit.id)} onClose={() => setEdit(null)} onSave={submit} onDelete={remove} />}
    </div>
  );
}

function EditDialog({ value, isNew, onClose, onSave, onDelete }: { value: Session; isNew: boolean; onClose: () => void; onSave: (s: Session) => void; onDelete: (s: Session) => void }) {
  const db = useDb();
  const [s, setS] = useState(value);
  const set = (p: Partial<Session>) => setS((x) => ({ ...x, ...p }));
  const field = "mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm";
  const teachers = db.users.filter((u) => u.role === "TEACHER");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); onSave({ ...s, id: isNew ? uid() : s.id }); }} className="w-full max-w-md space-y-3 rounded-2xl border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{isNew ? "Nouveau cours" : "Modifier le cours"}</h2>
          <button type="button" onClick={onClose} aria-label="Fermer"><X className="h-5 w-5" /></button>
        </div>
        <label className="block text-sm">Classe
          <select className={field} value={s.classId} onChange={(e) => set({ classId: e.target.value })}>{db.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">Jour
            <select className={field} value={s.day} onChange={(e) => set({ day: +e.target.value })}>{DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}</select>
          </label>
          <label className="block text-sm">Horaire
            <select className={field} value={s.slot} onChange={(e) => set({ slot: +e.target.value })}>{SLOTS.map((d, i) => <option key={d} value={i}>{d}</option>)}</select>
          </label>
        </div>
        <label className="block text-sm">Matière
          <select className={field} value={s.subjectId} onChange={(e) => set({ subjectId: e.target.value, teacherId: db.subjects.find((m) => m.id === e.target.value)?.teacherId ?? s.teacherId })}>{db.subjects.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
        </label>
        <label className="block text-sm">Enseignant
          <select className={field} value={s.teacherId} onChange={(e) => set({ teacherId: e.target.value })}>{teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
        </label>
        <label className="block text-sm">Salle
          <input required className={field} value={s.room} onChange={(e) => set({ room: e.target.value })} placeholder="Ex. Salle B12" />
        </label>
        <div className="flex justify-between gap-2 pt-2">
          {!isNew ? <button type="button" onClick={() => onDelete(value)} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /> Supprimer</button> : <span />}
          <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Enregistrer</button>
        </div>
      </form>
    </div>
  );
}
