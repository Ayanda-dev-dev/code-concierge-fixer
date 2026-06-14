import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSessionRedirectPath, store, useAuthSession, useStore } from "@/lib/edlts-store";
import { Check, Factory, Truck, Building2, BadgeCheck } from "lucide-react";

export const Route = createFileRoute("/tracking/$appId")({
  head: () => ({ meta: [{ title: "Production tracking · eDLTS" }] }),
  component: TrackingPage,
});

const STAGES = [
  { icon: Factory, label: "Production started", desc: "Card details sent to production facility." },
  { icon: BadgeCheck, label: "Card printed", desc: "Personalisation and security features applied." },
  { icon: Truck, label: "In transit to centre", desc: "Secure delivery to your licensing centre." },
  { icon: Building2, label: "Ready for collection", desc: "Bring your original ID to collect — no other documents needed." },
];

function TrackingPage() {
  const { appId } = Route.useParams();
  const { currentUser: user, isHydrated } = useAuthSession();
  const app = useStore((s) => s.applications.find((a) => a.id === appId));

  if (!isHydrated) return null;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== "applicant") return <Navigate to={getSessionRedirectPath(user)} />;
  if (!app) return <Navigate to="/dashboard" />;

  const stage = app.productionStage ?? 1;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Production tracking</div>
        <h1 className="text-3xl font-bold">{app.type === "learner" ? "Learner's" : "Driver's"} Licence Card</h1>
        <p className="mt-1 text-sm text-muted-foreground">Ref · {app.id.toUpperCase()} · {app.centre}</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <ol className="relative space-y-6 border-l-2 border-border pl-6">
            {STAGES.map((s, i) => {
              const Icon = s.icon;
              const done = i < stage;
              const active = i === stage - 1;
              return (
                <li key={s.label} className="relative">
                  <div className={`absolute -left-[35px] flex h-7 w-7 items-center justify-center rounded-full border-2 ${done ? "border-success bg-success text-success-foreground" : active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>
                    {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                  </div>
                  <div className={`font-medium ${active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</div>
                  <div className="text-xs text-muted-foreground">{s.desc}</div>
                </li>
              );
            })}
          </ol>

          <div className="mt-8 flex flex-wrap gap-2 border-t pt-6">
            {stage < STAGES.length && (
              <Button onClick={() => {
                const next = stage + 1;
                store.updateApplication(app.id, {
                  productionStage: next,
                  status: next >= STAGES.length ? "ready" : "producing",
                });
              }}>Advance stage</Button>
            )}
            {app.status === "ready" && (
              <Button variant="outline" onClick={() => store.updateApplication(app.id, { status: "collected" })}>Mark collected</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
