import { createFileRoute } from "@tanstack/react-router";
import { update, useDb } from "@/lib/store";
import { PageHeader, Panel } from "@/components/shared";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/notifications")({
  head: () => ({ meta: [{ title: "Notifications – EduTrack" }, { name: "description", content: "Centre de notifications" }, { property: "og:title", content: "Notifications – EduTrack" }, { property: "og:description", content: "Vos notifications" }] }),
  component: Notifs,
});

function Notifs() {
  const db = useDb();
  return (
    <>
      <PageHeader title="Notifications" action={<Button variant="outline" onClick={() => update((d) => ({ ...d, notifications: d.notifications.map((n) => ({ ...n, read: true })) }))}>Tout marquer comme lu</Button>} />
      <Panel>
        <ul className="divide-y">{db.notifications.map((n) => (
          <li key={n.id}>
            <button className="flex w-full items-center gap-3 py-3 text-left text-sm" onClick={() => update((d) => ({ ...d, notifications: d.notifications.map((x) => x.id === n.id ? { ...x, read: !x.read } : x) }))}>
              <span className={`h-2 w-2 rounded-full ${n.read ? "bg-muted" : "bg-primary"}`} />
              <span className={`flex-1 ${n.read ? "text-muted-foreground" : "font-medium"}`}>{n.title}</span>
              <span className="text-xs text-muted-foreground">{new Date(n.date).toLocaleDateString("fr-FR")}</span>
            </button>
          </li>
        ))}</ul>
      </Panel>
    </>
  );
}
