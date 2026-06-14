import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { store, useAuthSession, getSessionRedirectPath } from "@/lib/edlts-store";
import { FileText, BadgeCheck, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/apply/")({
  head: () => ({ meta: [{ title: "Start application · eDLTS" }] }),
  component: ApplyChoose,
});

function ApplyChoose() {
  const navigate = useNavigate();
  const { currentUser: user, isHydrated } = useAuthSession();

  if (!isHydrated) return null;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== "applicant") return <Navigate to={getSessionRedirectPath(user)} />;

  async function start(type: "learner" | "driver") {
    try {
      const app = await store.createApplication(user!.id, type);
      toast.success(`${type === "learner" ? "Learner's" : "Driver's"} application created`);
      navigate({ to: "/apply/$appId", params: { appId: app.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create application");
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">New application</div>
        <h1 className="text-3xl font-bold">Which licence are you applying for?</h1>
        <p className="mt-1 text-sm text-muted-foreground">You'll complete every step online and only visit the centre for biometrics and the test.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Choice
          icon={FileText}
          title="Learner's Licence"
          price="R150"
          steps={["Online application", "1 visit · written test", "Required for driver's later"]}
          onClick={() => start("learner")}
        />
        <Choice
          icon={BadgeCheck}
          title="Driver's Licence"
          price="R300"
          steps={["Requires valid learner's", "1 test visit + 1 collection", "Card production tracked"]}
          onClick={() => start("driver")}
        />
      </div>
    </main>
  );
}

function Choice({ icon: Icon, title, price, steps, onClick }: { icon: any; title: string; price: string; steps: string[]; onClick: () => void }) {
  return (
    <Card className="group cursor-pointer transition hover:shadow-elevated" onClick={onClick}>
      <CardContent className="p-7">
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground"><Icon className="h-6 w-6" /></div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Fee</div>
            <div className="text-lg font-bold text-gold-foreground">{price}</div>
          </div>
        </div>
        <h3 className="mt-5 text-xl font-semibold">{title}</h3>
        <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
          {steps.map((s) => <li key={s} className="flex items-start gap-2"><span className="mt-1.5 h-1 w-1 rounded-full bg-primary" />{s}</li>)}
        </ul>
        <Button className="mt-6 w-full" variant="outline">Start <ArrowRight className="ml-1 h-4 w-4 transition group-hover:translate-x-0.5" /></Button>
      </CardContent>
    </Card>
  );
}
