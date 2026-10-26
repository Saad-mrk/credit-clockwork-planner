import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { uid, update, useDb } from "@/lib/store";
import type { Role } from "@/data/seed";
import { PageHeader, Panel } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_app/utilisateurs")({
  head: () => ({ meta: [{ title: "Utilisateurs – EduTrack" }, { name: "description", content: "Gestion des utilisateurs" }, { property: "og:title", content: "Utilisateurs – EduTrack" }, { property: "og:description", content: "Gestion des comptes" }] }),
  component: UsersPage,
});

const ROLES: Role[] = ["ADMIN", "TEACHER", "STUDENT", "PARENT"];
const PAGE = 10;

function UsersPage() {
  const db = useDb();
  const [q, setQ] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "STUDENT" as Role });
  const list = db.users.filter((u) => (!role || u.role === role) && (u.name + u.email).toLowerCase().includes(q.toLowerCase()));
  const pages = Math.max(1, Math.ceil(list.length / PAGE));

  const create = () => {
    if (form.name.length < 2 || !/^\S+@\S+\.\S+$/.test(form.email)) return toast.error("Nom ou e-mail invalide");
    update((d) => ({ ...d, users: [{ id: uid(), ...form, active: true, classId: form.role === "STUDENT" ? d.classes[0].id : undefined }, ...d.users] }));
    toast.success("Utilisateur créé"); setOpen(false); setForm({ name: "", email: "", role: "STUDENT" });
  };

  return (
    <>
      <PageHeader title="Utilisateurs" desc={`${list.length} comptes`} action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Nouvel utilisateur</Button>} />
      <Panel>
        <div className="mb-4 flex flex-wrap gap-3">
          <Input placeholder="Rechercher…" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} className="max-w-xs" />
          <select className="rounded-md border bg-background px-3 text-sm" value={role} onChange={(e) => { setRole(e.target.value as Role | ""); setPage(0); }}>
            <option value="">Tous les rôles</option>{ROLES.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground"><tr><th className="py-2">Nom</th><th>E-mail</th><th>Rôle</th><th>Actif</th><th /></tr></thead>
            <tbody className="divide-y">
              {list.slice(page * PAGE, page * PAGE + PAGE).map((u) => (
                <tr key={u.id}>
                  <td className="py-2.5 font-medium">{u.name}</td><td className="text-muted-foreground">{u.email}</td>
                  <td><span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary">{u.role}</span></td>
                  <td><Switch checked={u.active} onCheckedChange={(v) => update((d) => ({ ...d, users: d.users.map((x) => x.id === u.id ? { ...x, active: v } : x) }))} aria-label="Activer" /></td>
                  <td className="text-right"><Button size="icon" variant="ghost" aria-label="Supprimer" onClick={() => { if (confirm(`Supprimer ${u.name} ?`)) { update((d) => ({ ...d, users: d.users.filter((x) => x.id !== u.id) })); toast.success("Supprimé"); } }}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center justify-end gap-2 text-sm">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Précédent</Button>
          <span>{page + 1} / {pages}</span>
          <Button variant="outline" size="sm" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Suivant</Button>
        </div>
      </Panel>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvel utilisateur</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nom complet</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>E-mail</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>Rôle</Label><select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select></div>
            <Button className="w-full" onClick={create}>Créer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
