import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, ScanLine, CalendarCheck2, Activity, Fingerprint, BadgeCheck, ArrowRight, Clock, Smartphone, FileCheck2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "eDLTS — Apply online. Test once. Bring only your ID." },
      { name: "description", content: "Electronic Driver Licensing and Tracking System — the fully digital way to apply for your learner's or driver's licence." },
      { property: "og:title", content: "eDLTS — Electronic Driver Licensing & Tracking" },
      { property: "og:description", content: "Apply online, pay digitally, track your queue, and visit the centre only for testing." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <main>
      {/* HERO */}
      <section className="relative overflow-hidden gov-gradient text-primary-foreground">
        <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 md:grid-cols-2 md:py-28">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              Department of Transport · Pilot Release
            </div>
            <h1 className="text-4xl font-bold leading-[1.05] md:text-6xl">
              Apply online. <br />
              <span className="text-gold">Test once.</span> Track everything.
            </h1>
            <p className="mt-5 max-w-lg text-base text-white/75 md:text-lg">
              The Electronic Driver Licensing & Tracking System digitises every step of the licensing process — so you only visit the centre for biometrics and testing. Bring only your original ID.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register">
                <Button size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90">
                  Start application <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
                  Sign in
                </Button>
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-6 text-xs text-white/60">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-gold" /> POPIA compliant</span>
              <span className="flex items-center gap-1.5"><Fingerprint className="h-3.5 w-3.5 text-gold" /> Biometric secure</span>
              <span className="flex items-center gap-1.5"><BadgeCheck className="h-3.5 w-3.5 text-gold" /> Legally binding e-signature</span>
            </div>
          </div>

          {/* Hero card mock */}
          <div className="relative">
            <div className="absolute -inset-6 rounded-3xl bg-white/5 blur-2xl" />
            <Card className="relative border-white/10 bg-card/95 text-card-foreground shadow-elevated">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Driver's Licence · Application</div>
                  <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-medium text-success">Booked</span>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary"><FileCheck2 className="h-6 w-6" /></div>
                  <div>
                    <div className="font-semibold">Sipho M. Dlamini</div>
                    <div className="text-xs text-muted-foreground">Ref · EDL-2026-04781</div>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <Stat label="Test date" value="12 Jun 2026" />
                  <Stat label="Time" value="09:30" />
                  <Stat label="Centre" value="Sandton" />
                  <Stat label="Queue" value="#A‑014" />
                </div>
                <div className="mt-5 rounded-md border bg-secondary/40 p-3 text-xs text-muted-foreground">
                  <Clock className="mr-1 inline h-3.5 w-3.5" /> Avg. wait at your slot: <span className="font-semibold text-foreground">8 min</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* JOURNEY */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="mb-12 max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">The eDLTS journey</div>
          <h2 className="mt-2 text-3xl font-bold md:text-4xl">Four steps. One centre visit.</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-4">
          <Step n="01" icon={ScanLine} title="Apply online" body="Scan your ID, capture photos, e-sign, upload documents and pay — all from your phone." />
          <Step n="02" icon={CalendarCheck2} title="Book your slot" body="Pick a centre, date, and time. Get instant confirmation and reminders." />
          <Step n="03" icon={Fingerprint} title="Visit the centre" body="Check in by QR. Officer captures fingerprints, you take the test." />
          <Step n="04" icon={BadgeCheck} title="Track & collect" body="Watch your card move through production. Collect when ready — bring only your ID." />
        </div>
      </section>

      {/* COMPARE */}
      <section className="border-y bg-secondary/40 py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 md:grid-cols-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">Before vs after</div>
            <h2 className="mt-2 text-3xl font-bold md:text-4xl">From 4–6 visits down to 1.</h2>
            <p className="mt-3 text-muted-foreground">eDLTS replaces paperwork, cash payments and queue confusion with secure digital flows and live tracking.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Metric value="–82%" label="Time at centre" />
              <Metric value="100%" label="Digital records" />
              <Metric value="0" label="Paper receipts" />
              <Metric value="24/7" label="Self‑service" />
            </div>
          </div>
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3">Aspect</th>
                    <th className="px-4 py-3">Manual</th>
                    <th className="px-4 py-3 text-primary">eDLTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[
                    ["Apply", "Visit centre", "Online, 10 min"],
                    ["Payment", "Cash at centre", "Card / EFT / Mobile"],
                    ["Receipt", "Paper (lost)", "Digital, stored"],
                    ["Queue", "Physical, unknown", "Live mobile tracker"],
                    ["Test day", "ID + receipt + docs", "ID only"],
                    ["Licence tracking", "Call/visit", "Push notifications"],
                  ].map((r) => (
                    <tr key={r[0]}>
                      <td className="px-4 py-3 font-medium">{r[0]}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r[1]}</td>
                      <td className="px-4 py-3 font-medium text-primary">{r[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 text-center">
        <Smartphone className="mx-auto mb-4 h-8 w-8 text-primary" />
        <h2 className="mx-auto max-w-2xl text-3xl font-bold md:text-4xl">Ready to skip the queue?</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Create your account and complete a learner's or driver's licence application in under 10 minutes.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/register"><Button size="lg">Create account</Button></Link>
          <Link to="/login"><Button size="lg" variant="outline">Sign in</Button></Link>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Staff demo: officer@edlts.gov · admin@edlts.gov</p>

      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-semibold">{value}</div>
    </div>
  );
}

function Step({ n, icon: Icon, title, body }: { n: string; icon: any; title: string; body: string }) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="absolute right-4 top-4 text-3xl font-bold text-muted-foreground/15">{n}</div>
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
        <div className="mt-4 font-semibold">{title}</div>
        <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-2xl font-bold text-primary">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
