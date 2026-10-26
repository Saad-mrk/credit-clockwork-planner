import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BarChart3, Bell, BookOpen, CalendarCheck, CalendarDays, ClipboardList, GraduationCap, LayoutDashboard, LogOut, Menu, Users, FileText } from "lucide-react";
import { logout, useDb, useSession } from "@/lib/store";
import type { Role } from "@/data/seed";

const NAV: { to: string; label: string; icon: typeof Users; roles: Role[] }[] = [
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard, roles: ["ADMIN", "TEACHER", "STUDENT", "PARENT"] },
  { to: "/utilisateurs", label: "Utilisateurs", icon: Users, roles: ["ADMIN"] },
  { to: "/matieres", label: "Classes & Matières", icon: BookOpen, roles: ["ADMIN"] },
  { to: "/notes", label: "Saisie des notes", icon: ClipboardList, roles: ["TEACHER"] },
  { to: "/appel", label: "Appel & Justificatifs", icon: CalendarCheck, roles: ["TEACHER"] },
  { to: "/mes-notes", label: "Notes", icon: GraduationCap, roles: ["STUDENT", "PARENT"] },
  { to: "/mes-absences", label: "Absences", icon: FileText, roles: ["STUDENT", "PARENT"] },
  { to: "/emploi-du-temps", label: "Emploi du temps", icon: CalendarDays, roles: ["ADMIN", "TEACHER", "STUDENT", "PARENT"] },
  { to: "/analyse-absences", label: "Analyse des absences", icon: BarChart3, roles: ["ADMIN", "TEACHER"] },
  { to: "/notifications", label: "Notifications", icon: Bell, roles: ["ADMIN", "TEACHER", "STUDENT", "PARENT"] },
];
const ROLE_FR: Record<Role, string> = { ADMIN: "Administrateur", TEACHER: "Enseignant", STUDENT: "Étudiant", PARENT: "Parent" };

export const Route = createFileRoute("/_app")({ component: AppLayout });

function AppLayout() {
  const user = useSession();
  const db = useDb();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  useEffect(() => { if (user === null) nav({ to: "/" }); }, [user, nav]);
  if (!user) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Chargement…</div>;
  const unread = db.notifications.filter((n) => !n.read).length;
  const items = NAV.filter((n) => n.roles.includes(user.role));

  return (
    <div className="flex min-h-screen">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r bg-sidebar p-4 transition-transform md:static md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="mb-8 flex items-center gap-2 px-2 text-lg font-bold text-sidebar-foreground">
          <span className="rounded-xl bg-sidebar-primary p-1.5 text-sidebar-primary-foreground"><GraduationCap className="h-5 w-5" /></span> EduTrack
        </div>
        <nav className="space-y-1">
          {items.map((i) => (
            <Link key={i.to} to={i.to} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-sidebar-foreground/75 transition hover:bg-sidebar-accent hover:text-sidebar-foreground" activeProps={{ className: "!bg-sidebar-primary font-semibold !text-sidebar-primary-foreground shadow-sm" }}>
              <i.icon className="h-4 w-4" /> {i.label}
            </Link>
          ))}
        </nav>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-foreground/30 md:hidden" onClick={() => setOpen(false)} />}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur md:px-8">
          <button className="md:hidden" aria-label="Menu" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
          <div className="flex-1" />
          <Link to="/notifications" className="relative rounded-lg p-2 hover:bg-accent" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            {unread > 0 && <span className="absolute -right-0.5 -top-0.5 rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">{unread}</span>}
          </Link>
          <div className="text-right text-sm leading-tight">
            <div className="font-semibold">{user.name}</div>
            <div className="text-xs text-muted-foreground">{ROLE_FR[user.role]}</div>
          </div>
          <button onClick={() => { logout(); nav({ to: "/" }); }} className="rounded-lg p-2 hover:bg-accent" aria-label="Déconnexion"><LogOut className="h-5 w-5" /></button>
        </header>
        <main className="flex-1 p-4 md:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
