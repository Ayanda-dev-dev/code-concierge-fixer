import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getSessionRedirectPath, store, useStore, useAuthSession } from "@/lib/edlts-store";
import { QrCode, Activity, MapPin, Clock, Users, Fingerprint } from "lucide-react";

export const Route = createFileRoute("/queue")({
  head: () => ({ meta: [{ title: "Live queue · eDLTS" }] }),
  component: QueuePage,
});

function QueuePage() {
  const { currentUser: user, isHydrated } = useAuthSession();
  const apps = useStore((s) => (user ? s.applications.filter((a) => a.userId === user.id && ["booked", "checked_in", "in_test"].includes(a.status)) : []));

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 4000);
    return () => clearInterval(id);
  }, []);

  // Simulate queue movement
  useEffect(() => {
    apps.forEach((a) => {
      if (a.queuePosition && a.queuePosition > 0 && a.status === "checked_in") {
        store.updateApplication(a.id, { queuePosition: Math.max(0, (a.queuePosition ?? 0) - 1) });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  if (!isHydrated) return null;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== "applicant") return <Navigate to={getSessionRedirectPath(user)} />;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Live tracking</div>
        <h1 className="text-3xl font-bold">Your queue</h1>
        <p className="mt-1 text-sm text-muted-foreground">Check in at the centre by scanning the QR code below — your position updates in real time.</p>
      </div>

      {apps.length === 0 ? (
        <Card><CardContent className="py-14 text-center text-sm text-muted-foreground">No active bookings. Book a test from your dashboard.</CardContent></Card>
      ) : (
        <div className="grid gap-6">
          {apps.map((a) => {
            const position = a.queuePosition ?? 0;
            const ahead = Math.max(0, position - 1);
            return (
              <Card key={a.id}>
                <CardContent className="p-6">
                  <div className="grid gap-6 md:grid-cols-[1fr_auto]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge>{a.type === "learner" ? "Learner's" : "Driver's"} · Test day</Badge>
                        <Badge variant="outline" className="bg-primary/5 text-primary">{a.status === "booked" ? "Booked" : a.status === "checked_in" ? "Checked in" : "In test"}</Badge>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <Info icon={MapPin} label="Centre" value={a.centre ?? "—"} />
                        <Info icon={Clock} label="Slot" value={`${a.testDate ?? "—"} · ${a.testTime ?? ""}`} />
                        <Info icon={Users} label="Queue #" value={a.queueNumber ?? "—"} />
                        <Info icon={Activity} label="Wait" value={`${ahead * 4} min`} />
                      </div>

                      <div className="mt-6 rounded-xl border bg-gradient-to-br from-primary/5 to-transparent p-5">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">Position in queue</div>
                        <div className="mt-2 flex items-baseline gap-3">
                          <div className="text-5xl font-bold tabular-nums">{position}</div>
                          <div className="text-sm text-muted-foreground">{ahead} {ahead === 1 ? "person" : "people"} ahead of you</div>
                        </div>
                        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div className="h-full bg-primary transition-all" style={{ width: `${Math.max(5, 100 - position * 8)}%` }} />
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        {a.status === "booked" && (
                          <Button onClick={() => store.updateApplication(a.id, { status: "checked_in" })}>
                            <QrCode className="mr-2 h-4 w-4" /> Simulate check-in
                          </Button>
                        )}
                        {a.status === "checked_in" && position <= 1 && (
                          <Button onClick={() => store.updateApplication(a.id, { status: "in_test" })}>
                            <Fingerprint className="mr-2 h-4 w-4" /> Biometrics & start test
                          </Button>
                        )}
                        {a.status === "in_test" && (
                          <>
                            <Button onClick={() => store.updateApplication(a.id, { status: a.type === "learner" ? "passed" : "producing", productionStage: 1 })}>Mark passed</Button>
                            <Button variant="outline" onClick={() => store.updateApplication(a.id, { status: "failed" })}>Mark failed</Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* QR */}
                    <div className="flex flex-col items-center justify-center rounded-xl border bg-card p-5">
                      <FakeQr seed={a.id} />
                      <div className="mt-3 text-center text-[10px] uppercase tracking-wider text-muted-foreground">Check-in QR</div>
                      <div className="text-xs font-mono">{a.id.toUpperCase()}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}

function Info({ icon: Icon, label, value }: any) {
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground"><Icon className="h-3 w-3" />{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}

function FakeQr({ seed }: { seed: string }) {
  // deterministic pseudo-QR using seed
  const size = 13;
  const cells: boolean[] = [];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  for (let i = 0; i < size * size; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    cells.push((h & 1) === 1);
  }
  return (
    <div className="grid p-2 rounded-md bg-white" style={{ gridTemplateColumns: `repeat(${size}, 8px)`, gap: 1 }}>
      {cells.map((c, i) => <div key={i} className={c ? "bg-foreground" : "bg-transparent"} style={{ width: 8, height: 8 }} />)}
    </div>
  );
}
