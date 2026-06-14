import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthSession, useStore } from "@/lib/edlts-store";
import { Users, FileText, BadgeCheck, Activity, Settings } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin · eDLTS" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { currentUser: user, isHydrated } = useAuthSession();
  const users = useStore((s) => s.users);
  const apps = useStore((s) => s.applications);

  if (!isHydrated) return null;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== "admin") return <Navigate to="/" />;

  const citizens = users.filter((u) => u.role === "applicant");
  const passed = apps.filter((a) => ["passed", "producing", "ready", "collected"].includes(a.status)).length;
  const bookings = apps.filter((a) => ["booked", "checked_in", "in_test"].includes(a.status)).length;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Administrator</div>
          <h1 className="text-3xl font-bold">System overview</h1>
        </div>
        <Link to="/admin/users">
          <Button variant="outline"><Settings className="mr-1.5 h-4 w-4" /> User Management</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Kpi icon={Users} label="Citizens registered" value={citizens.length} />
        <Kpi icon={FileText} label="Applications" value={apps.length} />
        <Kpi icon={Activity} label="Active bookings" value={bookings} />
        <Kpi icon={BadgeCheck} label="Tests passed" value={passed} />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold">Applications by status</h3>
            <div className="mt-4 space-y-2">
              {(["draft", "booked", "checked_in", "in_test", "passed", "failed", "producing", "ready", "collected"] as const).map((s) => {
                const count = apps.filter((a) => a.status === s).length;
                const pct = apps.length ? (count / apps.length) * 100 : 0;
                return (
                  <div key={s}>
                    <div className="flex justify-between text-xs">
                      <span className="capitalize">{s.replace("_", " ")}</span>
                      <span className="font-medium tabular-nums">{count}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-primary" style={{ width: `${Math.max(2, pct)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold">Registered citizens</h3>
            <div className="mt-4 divide-y">
              {citizens.length === 0 && <div className="py-6 text-center text-sm text-muted-foreground">No citizens yet.</div>}
              {citizens.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-medium">{c.fullName}</div>
                    <div className="text-xs text-muted-foreground">{c.email} · ID {c.idNumber}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{apps.filter((a) => a.userId === c.id).length} apps</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function Kpi({ icon: Icon, label, value }: any) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="text-2xl font-bold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
