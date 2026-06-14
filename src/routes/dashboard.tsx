import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getSessionRedirectPath, store, useStore, useAuthSession, type Application } from "@/lib/edlts-store";
import { FileText, Calendar, CreditCard, BadgeCheck, Plus, ArrowRight, Clock, MapPin } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · eDLTS" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { currentUser: user, isHydrated } = useAuthSession();
  const apps = useStore((s) => (user ? s.applications.filter((a) => a.userId === user.id) : []));

  if (!isHydrated) return null;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== "applicant") return <Navigate to={getSessionRedirectPath(user)} />;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Citizen portal</div>
          <h1 className="text-3xl font-bold">Welcome, {user.fullName.split(" ")[0]}.</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your applications, bookings and licence card from one place.</p>
        </div>
        <Link to="/apply"><Button><Plus className="mr-1.5 h-4 w-4" />New application</Button></Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard icon={FileText} label="Active applications" value={String(apps.filter((a) => a.status !== "collected").length)} />
        <KpiCard icon={Calendar} label="Upcoming tests" value={String(apps.filter((a) => ["booked", "checked_in"].includes(a.status)).length)} />
        <KpiCard icon={BadgeCheck} label="Cards in production" value={String(apps.filter((a) => ["producing", "ready"].includes(a.status)).length)} />
      </div>

      <div className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Your applications</h2>
        {apps.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <div className="font-medium">No applications yet</div>
              <p className="max-w-sm text-sm text-muted-foreground">Start your learner's or driver's licence application — it takes under 10 minutes.</p>
              <Link to="/apply"><Button>Start new application</Button></Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {apps.sort((a, b) => b.createdAt - a.createdAt).map((a) => <AppRow key={a.id} app={a} />)}
          </div>
        )}
      </div>
    </main>
  );
}

function KpiCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="text-2xl font-bold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

const STATUS_META: Record<Application["status"], { label: string; tone: string }> = {
  draft: { label: "Draft", tone: "bg-muted text-muted-foreground" },
  submitted: { label: "Submitted", tone: "bg-warning/15 text-warning-foreground border-warning/40" },
  booked: { label: "Booked", tone: "bg-primary/10 text-primary" },
  checked_in: { label: "Checked in", tone: "bg-primary/10 text-primary" },
  in_test: { label: "Testing", tone: "bg-primary/10 text-primary" },
  passed: { label: "Passed", tone: "bg-success/15 text-success" },
  failed: { label: "Failed", tone: "bg-destructive/15 text-destructive" },
  producing: { label: "In production", tone: "bg-gold/20 text-gold-foreground" },
  ready: { label: "Ready for collection", tone: "bg-success/15 text-success" },
  collected: { label: "Collected", tone: "bg-muted text-muted-foreground" },
};

function AppRow({ app }: { app: Application }) {
  const meta = STATUS_META[app.status];
  return (
    <Card className="transition hover:shadow-card">
      <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
            {app.type === "learner" ? <FileText className="h-5 w-5" /> : <BadgeCheck className="h-5 w-5" />}
          </div>
          <div>
            <div className="font-semibold">{app.type === "learner" ? "Learner's Licence" : "Driver's Licence"}</div>
            <div className="text-xs text-muted-foreground">Ref · {app.id.toUpperCase()}</div>
            <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
              {app.testDate && <span><Calendar className="mr-1 inline h-3 w-3" />{app.testDate} · {app.testTime}</span>}
              {app.centre && <span><MapPin className="mr-1 inline h-3 w-3" />{app.centre}</span>}
              {!app.paid && <span><CreditCard className="mr-1 inline h-3 w-3" />R{app.fee} due</span>}
              {app.queueNumber && <span><Clock className="mr-1 inline h-3 w-3" />Queue {app.queueNumber}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={meta.tone + " border"}>{meta.label}</Badge>
          <ContinueAction app={app} />
        </div>
      </CardContent>
    </Card>
  );
}

function ContinueAction({ app }: { app: Application }) {
  if (app.status === "draft" || app.status === "submitted") {
    return <Link to="/apply/$appId" params={{ appId: app.id }}><Button size="sm" variant="outline">Continue <ArrowRight className="ml-1 h-3.5 w-3.5" /></Button></Link>;
  }
  if (["booked", "checked_in", "in_test"].includes(app.status)) {
    return <Link to="/queue"><Button size="sm">Track <ArrowRight className="ml-1 h-3.5 w-3.5" /></Button></Link>;
  }
  if (["passed", "producing", "ready", "collected"].includes(app.status)) {
    return <Link to="/tracking/$appId" params={{ appId: app.id }}><Button size="sm" variant="outline">Production <ArrowRight className="ml-1 h-3.5 w-3.5" /></Button></Link>;
  }
  return null;
}

export { store }; // avoid tree-shake warnings
