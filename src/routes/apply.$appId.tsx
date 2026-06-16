import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSessionRedirectPath, store, useAuthSession, useStore, type Application, type ApplicationDocuments } from "@/lib/edlts-store";
import { uploadToCatbox, dataUrlToBlob, CatboxError } from "@/lib/catbox";
import { IDCameraCapture } from "@/components/IDCameraCapture";
import { GoogleMapsLocation } from "@/components/GoogleMapsLocation";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight, ScanLine, Camera, PenLine, Upload, CreditCard, CalendarCheck2, FileCheck2, Loader2, MapPin } from "lucide-react";

export const Route = createFileRoute("/apply/$appId")({
  head: () => ({ meta: [{ title: "Application · eDLTS" }] }),
  component: ApplyWizard,
});

const STEPS = [
  { key: "id", label: "ID scan", icon: ScanLine },
  { key: "location", label: "Location", icon: MapPin },
  { key: "photo", label: "Photos", icon: Camera },
  { key: "details", label: "Details", icon: FileCheck2 },
  { key: "signature", label: "Signature", icon: PenLine },
  { key: "docs", label: "Documents", icon: Upload },
  { key: "payment", label: "Payment", icon: CreditCard },
  { key: "booking", label: "Booking", icon: CalendarCheck2 },
] as const;

const CENTRES = ["Sandton", "Midrand", "Pretoria North", "Centurion", "Randburg"];

function ApplyWizard() {
  const { appId } = Route.useParams();
  const navigate = useNavigate();
  const { currentUser: user, isHydrated } = useAuthSession();
  const app = useStore((s) => s.applications.find((a) => a.id === appId));
  const [step, setStep] = useState(0);
  const [details, setDetails] = useState({ address: "", suburb: "", city: "", postal: "" });
  const [centre, setCentre] = useState(CENTRES[0]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  if (!isHydrated) return null;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== "applicant") return <Navigate to={getSessionRedirectPath(user)} />;
  if (!app) return <Navigate to="/apply" />;

  const stepKey = STEPS[step].key;

  function next() { setStep((s) => Math.min(STEPS.length - 1, s + 1)); }
  function prev() { setStep((s) => Math.max(0, s - 1)); }

  function complete() {
    store.updateApplication(app!.id, {
      status: "booked",
      paid: true,
      centre,
      testDate: date,
      testTime: time,
      queueNumber: `A-${Math.floor(Math.random() * 90 + 10)}`,
      queuePosition: Math.floor(Math.random() * 12 + 3),
    });
    toast.success("Application submitted · test booked");
    navigate({ to: "/dashboard" });
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{app.type === "learner" ? "Learner's" : "Driver's"} Licence · {app.id.toUpperCase()}</div>
        <h1 className="text-2xl font-bold">Complete your application</h1>
      </div>

      {/* Stepper */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex min-w-max items-center gap-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i < step;
            const active = i === step;
            return (
              <div key={s.key} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs transition ${active ? "bg-primary text-primary-foreground" : done ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                  {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                  <span className="font-medium">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`h-px w-6 ${done ? "bg-success" : "bg-border"}`} />}
              </div>
            );
          })}
        </div>
      </div>

      <Card>
        <CardContent className="p-6 md:p-8">
          {stepKey === "id" && <IdScanStep app={app} onDone={next} />}
          {stepKey === "location" && <LocationStep app={app} />}
          {stepKey === "photo" && <PhotoStep app={app} onDone={next} />}
          {stepKey === "details" && <DetailsStep details={details} setDetails={setDetails} />}
          {stepKey === "signature" && <SignatureStep app={app} onDone={next} />}
          {stepKey === "docs" && <DocsStep app={app} />}
          {stepKey === "payment" && <PaymentStep app={app} />}
          {stepKey === "booking" && <BookingStep centre={centre} setCentre={setCentre} date={date} setDate={setDate} time={time} setTime={setTime} />}

          <div className="mt-8 flex items-center justify-between border-t pt-6">
            <Button variant="ghost" onClick={prev} disabled={step === 0}><ChevronLeft className="h-4 w-4" /> Back</Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={next}>Continue <ChevronRight className="ml-1 h-4 w-4" /></Button>
            ) : (
              <Button onClick={complete} disabled={!date || !time}>Submit & confirm booking</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

/* ----- Individual steps ----- */

function uploadHandler(
  file: File | Blob,
  filename: string | undefined,
  onUrl: (url: string) => Promise<void> | void,
  setBusy: (b: boolean) => void,
) {
  return async () => {
    setBusy(true);
    try {
      const url = await uploadToCatbox(file, filename);
      await onUrl(url);
      toast.success("Uploaded");
    } catch (e) {
      const msg = e instanceof CatboxError ? e.message : e instanceof Error ? e.message : "Upload failed";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };
}

function IdScanStep({ app, onDone }: { app: Application; onDone: () => void }) {
  const hasBothCaptures = app.documents.idScanUrl && app.documents.idScanUrl.includes("front");
  
  return (
    <div>
      <StepHeader 
        title="Scan your ID using your camera" 
        desc="We'll capture 2 live photos of your South African ID (front and back). No file uploads needed."
      />
      <IDCameraCapture
        appId={app.id}
        isUploaded={hasBothCaptures}
        onCapturesComplete={(data) => {
          store.updateApplication(app.id, {
            documents: {
              idScan: true,
              idScanUrl: data.frontUrl,
              idScanBackUrl: data.backUrl,
            },
          });
          toast.success("ID photos captured and uploaded successfully");
          setTimeout(onDone, 500);
        }}
      />
    </div>
  );
}

function LocationStep({ app }: { app: Application; onDone?: () => void }) {
  return (
    <div>
      <StepHeader
        title="Find your nearest testing station"
        desc="We'll use your location to show available testing stations in Durban. This helps us understand your preferred testing centre."
      />
      <GoogleMapsLocation
        appId={app.id}
        onLocationCapture={(data) => {
          store.updateApplication(app.id, {
            location: {
              latitude: data.latitude,
              longitude: data.longitude,
              address: data.address,
            },
          });
          toast.success("Location saved");
        }}
      />
    </div>
  );
}

function PhotoStep({ app, onDone }: { app: Application; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const urls = app.documents.photoUrls ?? [];

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const uploaded = await uploadToCatbox(file);
      const next = [...urls, uploaded].slice(0, 2);
      await store.updateApplication(app.id, {
        documents: {
          photo: next.length >= 2,
          photoUrls: next,
          selfieUrl: app.documents.selfieUrl ?? uploaded, // reuse first photo as selfie
        },
      });
      toast.success(`Photo ${next.length} of 2 uploaded`);
      if (next.length >= 2) setTimeout(onDone, 400);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <StepHeader title="Upload 2 photos of yourself" desc="Clear, recent face photos. Used for biometric matching on test day. JPG/PNG, max 10MB each." />
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="aspect-square overflow-hidden rounded-xl border-2 border-dashed bg-secondary/40">
            <div className="flex h-full items-center justify-center">
              {urls[i] ? (
                <img src={urls[i]} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
              ) : (
                <Camera className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex justify-center">
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={busy || urls.length >= 2}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          <span className={`inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium ${urls.length >= 2 ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}>
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</> : urls.length >= 2 ? "Captured" : `Add photo ${urls.length + 1} of 2`}
          </span>
        </label>
      </div>
    </div>
  );
}

function DetailsStep({ details, setDetails }: any) {
  return (
    <div>
      <StepHeader title="Confirm your details" desc="These match the information on your ID. Update your residential address." />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Street address"><Input value={details.address} onChange={(e: any) => setDetails({ ...details, address: e.target.value })} /></Field>
        <Field label="Suburb"><Input value={details.suburb} onChange={(e: any) => setDetails({ ...details, suburb: e.target.value })} /></Field>
        <Field label="City"><Input value={details.city} onChange={(e: any) => setDetails({ ...details, city: e.target.value })} /></Field>
        <Field label="Postal code"><Input value={details.postal} onChange={(e: any) => setDetails({ ...details, postal: e.target.value })} /></Field>
      </div>
    </div>
  );
}

function SignatureStep({ app, onDone }: { app: Application; onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);
  const [busy, setBusy] = useState(false);

  function pos(e: React.PointerEvent) {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height };
  }

  function start(e: React.PointerEvent) {
    drawing.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function move(e: React.PointerEvent) {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.strokeStyle = "#1e2a4a";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasInk(true);
  }

  function end() { drawing.current = false; }
  function clear() {
    const c = canvasRef.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setHasInk(false);
  }

  async function accept() {
    setBusy(true);
    try {
      const dataUrl = canvasRef.current!.toDataURL("image/png");
      const blob = dataUrlToBlob(dataUrl);
      const url = await uploadToCatbox(blob, `signature-${app.id}.png`);
      await store.updateApplication(app.id, { documents: { signature: dataUrl, signatureUrl: url } });
      toast.success("Signature saved");
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save signature");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <StepHeader title="Sign on the line" desc="Your e‑signature is legally binding under the ECT Act. Use a finger, stylus, or mouse." />
      <div className="rounded-xl border-2 border-dashed bg-secondary/40 p-4">
        <canvas
          ref={canvasRef}
          width={800}
          height={240}
          className="block h-48 w-full touch-none rounded-md bg-card"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
        />
        <div className="mt-3 flex justify-between text-xs text-muted-foreground">
          <span>× Sign above</span>
          <button className="underline" onClick={clear}>Clear</button>
        </div>
      </div>
      <div className="mt-5 flex justify-center">
        <Button disabled={!hasInk || busy} onClick={accept}>
          {busy ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Saving…</> : "Accept signature"}
        </Button>
      </div>
    </div>
  );
}

function DocsStep({ app }: { app: Application }) {
  const required = useMemo(() => {
    const list: { key: keyof ApplicationDocuments; urlKey: keyof ApplicationDocuments; label: string }[] = [
      { key: "certifiedId", urlKey: "certifiedIdUrl", label: "Certified copy of ID" },
      { key: "proofResidence", urlKey: "proofResidenceUrl", label: "Proof of residence (≤ 3 months)" },
      { key: "eyeCert", urlKey: "eyeCertUrl", label: "Eye certificate — digitally signed by optometrist" },
    ];
    if (app.type === "driver") list.push({ key: "learnerCert", urlKey: "learnerCertUrl", label: "Valid Learner's certificate" });
    return list;
  }, [app.type]);

  return (
    <div>
      <StepHeader title="Upload supporting documents" desc="PDF, JPG or PNG · max 10MB each. Eye certificates must be digitally signed by a registered optometrist." />
      <div className="grid gap-3">
        {required.map((d) => (
          <DocRow key={d.key as string} app={app} fieldKey={d.key} urlKey={d.urlKey} label={d.label} />
        ))}
      </div>
    </div>
  );
}

function DocRow({
  app, fieldKey, urlKey, label,
}: { app: Application; fieldKey: keyof ApplicationDocuments; urlKey: keyof ApplicationDocuments; label: string }) {
  const [busy, setBusy] = useState(false);
  const url = app.documents[urlKey] as string | undefined;

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const uploaded = await uploadToCatbox(file);
      await store.updateApplication(app.id, { documents: { [fieldKey]: true, [urlKey]: uploaded } as Partial<ApplicationDocuments> });
      toast.success(`${label} uploaded`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`flex items-center justify-between rounded-lg border p-4 ${url ? "border-success/40 bg-success/5" : ""}`}>
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">
          {url ? <a href={url} target="_blank" rel="noreferrer" className="underline">View uploaded file</a> : "Required"}
        </div>
      </div>
      <label className="cursor-pointer">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          disabled={busy}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        <span className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${url ? "border bg-card text-foreground" : "bg-primary text-primary-foreground"}`}>
          {busy ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…</> : url ? <><Check className="h-3.5 w-3.5" /> Replace</> : <><Upload className="h-3.5 w-3.5" /> Upload</>}
        </span>
      </label>
    </div>
  );
}

function PaymentStep({ app }: { app: any }) {
  const [method, setMethod] = useState("card");
  const [paid, setPaid] = useState(app.paid);
  return (
    <div>
      <StepHeader title="Pay your application fee" desc={`Secure digital payment for the ${app.type === "learner" ? "learner's" : "driver's"} licence application.`} />
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <div className="rounded-lg border bg-secondary/30 p-5">
            <div className="flex items-baseline justify-between">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Total due</div>
              <div className="text-3xl font-bold">R{app.fee}</div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">Includes test slot and one re-attempt window. Receipt stored in your account — no paper required.</div>
          </div>
          <div className="mt-4 space-y-2">
            {[
              { id: "card", label: "Credit / debit card" },
              { id: "eft", label: "EFT instant pay" },
              { id: "mobile", label: "Mobile money" },
            ].map((m) => (
              <label key={m.id} className={`flex cursor-pointer items-center justify-between rounded-md border p-3 text-sm ${method === m.id ? "border-primary bg-primary/5" : ""}`}>
                <span>{m.label}</span>
                <input type="radio" checked={method === m.id} onChange={() => setMethod(m.id)} className="accent-[var(--primary)]" />
              </label>
            ))}
          </div>
        </div>
        <div>
          {paid ? (
            <div className="flex h-full flex-col items-center justify-center rounded-lg border bg-success/10 p-8 text-center">
              <Check className="h-10 w-10 text-success" />
              <div className="mt-2 font-semibold">Payment received</div>
              <div className="mt-1 text-xs text-muted-foreground">Receipt EDL-{Date.now().toString().slice(-6)} stored in your account.</div>
            </div>
          ) : (
            <div className="rounded-lg border p-5">
              <div className="text-sm font-medium">Card details</div>
              <div className="mt-3 grid gap-3">
                <Input placeholder="Card number" defaultValue="4242 4242 4242 4242" />
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="MM / YY" defaultValue="12/28" />
                  <Input placeholder="CVC" defaultValue="123" />
                </div>
                <Button onClick={() => { store.updateApplication(app.id, { paid: true }); setPaid(true); toast.success("Payment successful"); }}>Pay R{app.fee}</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BookingStep({ centre, setCentre, date, setDate, time, setTime }: any) {
  const today = new Date();
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i + 1);
    return d.toISOString().slice(0, 10);
  });
  const times = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00"];

  return (
    <div>
      <StepHeader title="Book your test slot" desc="Choose a centre, date and time. We'll send confirmation by SMS and email." />
      <Field label="Licensing centre">
        <select value={centre} onChange={(e) => setCentre(e.target.value)} className="w-full rounded-md border bg-card px-3 py-2 text-sm">
          {CENTRES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </Field>

      <div className="mt-5">
        <Label>Date</Label>
        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-7">
          {dates.map((d) => (
            <button
              key={d}
              onClick={() => setDate(d)}
              className={`rounded-md border p-2 text-xs transition ${date === d ? "border-primary bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
            >
              <div className="font-semibold">{new Date(d).toLocaleDateString(undefined, { weekday: "short" })}</div>
              <div>{new Date(d).getDate()}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <Label>Time</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {times.map((t) => (
            <button
              key={t}
              onClick={() => setTime(t)}
              className={`rounded-md border px-3 py-1.5 text-sm transition ${time === t ? "border-primary bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function StepHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
