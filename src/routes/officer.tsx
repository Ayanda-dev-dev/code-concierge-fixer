import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { store, useAuthSession, useStore } from "@/lib/edlts-store";
import { Fingerprint, Check, X, QrCode } from "lucide-react";

export const Route = createFileRoute("/officer")({
  head: () => ({ meta: [{ title: "Officer console · eDLTS" }] }),
  component: OfficerPage,
});

function OfficerPage() {
  const { currentUser: user, isHydrated } = useAuthSession();
  const apps = useStore((s) => s.applications);

  if (!isHydrated) return null;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== "officer") return <Navigate to="/" />;

  const queue = apps.filter((a) => ["booked", "checked_in", "in_test"].includes(a.status));

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Licensing officer console</div>
        <h1 className="text-3xl font-bold">Today's queue</h1>
      </div>

      <div className="grid gap-3">
        {queue.length === 0 && <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Queue is empty.</CardContent></Card>}
        {queue.map((a) => {
          const applicant = store.get().users.find((u) => u.id === a.userId);
          return (
            <Card key={a.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{a.queueNumber}</Badge>
                    <span className="font-semibold">{applicant?.fullName ?? "Applicant"}</span>
                    <Badge>{a.type === "learner" ? "Learner's" : "Driver's"}</Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    ID {applicant?.idNumber} · Slot {a.testDate} {a.testTime} · {a.centre}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {a.status === "booked" && (
                    <Button size="sm" variant="outline" onClick={() => store.updateApplication(a.id, { status: "checked_in" })}>
                      <QrCode className="mr-1 h-3.5 w-3.5" /> Verify ID & check in
                    </Button>
                  )}
                  {a.status === "checked_in" && (
                    <Button size="sm" onClick={() => store.updateApplication(a.id, { status: "in_test" })}>
                      <Fingerprint className="mr-1 h-3.5 w-3.5" /> Capture biometrics
                    </Button>
                  )}
                  {a.status === "in_test" && (
                    <>
                      <Button size="sm" variant="default" onClick={() => store.updateApplication(a.id, { status: a.type === "learner" ? "passed" : "producing", productionStage: 1 })}>
                        <Check className="mr-1 h-3.5 w-3.5" /> Pass
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => store.updateApplication(a.id, { status: "failed" })}>
                        <X className="mr-1 h-3.5 w-3.5" /> Fail
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
