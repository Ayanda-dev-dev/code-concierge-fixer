import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Webcam from "react-webcam";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getSessionRedirectPath,
  store,
  useAuthSession,
  useStore,
  type Application,
  type ApplicationAddress,
  type ApplicationDocuments,
} from "@/lib/edlts-store";
import { uploadToCatbox, dataUrlToBlob, CatboxError } from "@/lib/catbox";
import { IDCameraCapture } from "@/components/IDCameraCapture";
import { GoogleMapsLocation } from "@/components/GoogleMapsLocation";
import { toast } from "sonner";
import {
  AlertCircle,
  Camera,
  CalendarCheck2,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  ExternalLink,
  FileCheck2,
  Loader2,
  MapPin,
  PenLine,
  RotateCcw,
  ScanLine,
  Upload,
} from "lucide-react";

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

type StepKey = (typeof STEPS)[number]["key"];

const STRIPE_PAYMENT_LINKS: Record<"learner" | "driver", string> = {
  learner: "https://buy.stripe.com/test_28E00j7H37xN0ov8bS2cg00",
  driver: "https://buy.stripe.com/test_bJe3cv7H3dWb5IP63K2cg01",
};

type StripeVerifyResult =
  | {
      paid: true;
      sessionId: string;
      transactionId: string;
      amount: number;
      currency: string;
      paidAt: number;
    }
  | { paid: false; error?: string };

async function verifyStripePayment(appId: string): Promise<StripeVerifyResult> {
  const res = await fetch("/api/public/stripe/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ appId }),
  });

  const payload = (await res.json().catch(() => ({}))) as Partial<StripeVerifyResult>;
  if (!res.ok) {
    return {
      paid: false,
      error: "error" in payload && typeof payload.error === "string" ? payload.error : `Verification failed (${res.status})`,
    };
  }

  return payload as StripeVerifyResult;
}

/* ===================================================================== */
/* Validation                                                            */
/* ===================================================================== */

function requiredDocsForType(type: Application["type"]) {
  const base = ["certifiedIdUrl", "proofResidenceUrl", "eyeCertUrl"] as const;
  return type === "driver" ? [...base, "learnerCertUrl"] : [...base];
}

function isStepComplete(
  key: StepKey,
  app: Application,
  draftAddress: ApplicationAddress,
): { ok: boolean; reason?: string } {
  switch (key) {
    case "id":
      if (!app.documents.idScanUrl || !app.documents.idScanBackUrl)
        return { ok: false, reason: "Capture both the front and back of your ID." };
      return { ok: true };
    case "location":
      if (!app.location?.latitude || !app.location?.longitude)
        return { ok: false, reason: "Capture your current location." };
      if (!app.location.selectedStation)
        return { ok: false, reason: "Select a nearby testing station." };
      return { ok: true };
    case "photo":
      if ((app.documents.photoUrls?.length ?? 0) < 2)
        return { ok: false, reason: "Capture two clear photos of yourself." };
      return { ok: true };
    case "details": {
      const a = app.address ?? draftAddress;
      const missing = (["street", "suburb", "city", "province", "postal"] as const).filter(
        (k) => !a[k]?.trim(),
      );
      if (missing.length)
        return { ok: false, reason: `Fill in: ${missing.join(", ")}.` };
      return { ok: true };
    }
    case "signature":
      if (!app.documents.signatureUrl)
        return { ok: false, reason: "Provide and save your signature." };
      return { ok: true };
    case "docs": {
      const required = requiredDocsForType(app.type);
      const missing = required.filter((k) => !(app.documents[k as keyof ApplicationDocuments]));
      if (missing.length)
        return { ok: false, reason: "Upload every required supporting document." };
      return { ok: true };
    }
    case "payment":
      if (app.payment?.status !== "paid")
        return { ok: false, reason: "Complete payment before continuing." };
      return { ok: true };
    case "booking":
      if (!app.booking?.date || !app.booking?.time)
        return { ok: false, reason: "Pick a booking date and time." };
      return { ok: true };
  }
}

/* ===================================================================== */
/* Wizard                                                                */
/* ===================================================================== */

function ApplyWizard() {
  const { appId } = Route.useParams();
  const navigate = useNavigate();
  const { currentUser: user, isHydrated } = useAuthSession();
  const app = useStore((s) => s.applications.find((a) => a.id === appId));
  const [step, setStep] = useState(0);
  const [draftAddress, setDraftAddress] = useState<ApplicationAddress>({
    street: "",
    suburb: "",
    city: "",
    province: "",
    postal: "",
  });

  // Sync draft address from persisted record once available.
  useEffect(() => {
    if (app?.address) setDraftAddress(app.address);
  }, [app?.address]);

  if (!isHydrated) return null;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== "applicant") return <Navigate to={getSessionRedirectPath(user)} />;
  if (!app) return <Navigate to="/apply" />;

  const stepKey = STEPS[step].key;
  const validation = isStepComplete(stepKey, app, draftAddress);
  const isLast = step === STEPS.length - 1;

  async function next() {
    // Persist Details step on transition.
    if (stepKey === "details" && !app!.address) {
      try {
        await store.updateApplication(app!.id, { address: draftAddress });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not save address");
        return;
      }
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }
  function prev() {
    setStep((s) => Math.max(0, s - 1));
  }

  async function complete() {
    const booking = app!.booking!;
    await store.updateApplication(app!.id, {
      status: "booked",
      paid: true,
      centre: booking.centre,
      testDate: booking.date,
      testTime: booking.time,
      queueNumber: `A-${Math.floor(Math.random() * 90 + 10)}`,
      queuePosition: Math.floor(Math.random() * 12 + 3),
      booking: { ...booking, status: "confirmed" },
    });
    toast.success("Application submitted · test booked");
    navigate({ to: "/dashboard" });
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          {app.type === "learner" ? "Learner's" : "Driver's"} Licence · {app.id.toUpperCase()}
        </div>
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
                <div
                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs transition ${active ? "bg-primary text-primary-foreground" : done ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                  <span className="font-medium">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-px w-6 ${done ? "bg-success" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Card>
        <CardContent className="p-6 md:p-8">
          {stepKey === "id" && <IdScanStep app={app} />}
          {stepKey === "location" && <LocationStep app={app} />}
          {stepKey === "photo" && <PhotoStep app={app} />}
          {stepKey === "details" && (
            <DetailsStep app={app} draft={draftAddress} setDraft={setDraftAddress} />
          )}
          {stepKey === "signature" && <SignatureStep app={app} />}
          {stepKey === "docs" && <DocsStep app={app} />}
          {stepKey === "payment" && <PaymentStep app={app} />}
          {stepKey === "booking" && <BookingStep app={app} />}

          {!validation.ok && (
            <div className="mt-6 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{validation.reason}</span>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between border-t pt-6">
            <Button variant="ghost" onClick={prev} disabled={step === 0}>
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
            {!isLast ? (
              <Button onClick={next} disabled={!validation.ok}>
                Continue <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={complete} disabled={!validation.ok}>
                Submit & confirm booking
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

/* ===================================================================== */
/* Steps                                                                 */
/* ===================================================================== */

function IdScanStep({ app }: { app: Application }) {
  const captured = !!(app.documents.idScanUrl && app.documents.idScanBackUrl);
  return (
    <div>
      <StepHeader
        title="Scan your ID using your camera"
        desc="We'll capture two live photos of your ID document (front and back). Files are uploaded securely to our hosting service."
      />
      <IDCameraCapture
        appId={app.id}
        isUploaded={captured}
        onCapturesComplete={(data) => {
          store.updateApplication(app.id, {
            documents: {
              idScan: true,
              idScanUrl: data.frontUrl,
              idScanBackUrl: data.backUrl,
            },
          });
          toast.success("ID photos captured and uploaded successfully");
        }}
      />
    </div>
  );
}

function LocationStep({ app }: { app: Application }) {
  return (
    <div>
      <StepHeader
        title="Find your nearest testing station"
        desc="We'll use your GPS coordinates to show nearby testing stations. Tap a station to select it for your booking."
      />
      <GoogleMapsLocation
        appId={app.id}
        onLocationCapture={(data) => {
          store.updateApplication(app.id, {
            location: {
              latitude: data.latitude,
              longitude: data.longitude,
              accuracy: data.accuracy,
              address: data.address,
              selectedStation: data.selectedStation,
            },
          });
          if (data.selectedStation) {
            toast.success(`${data.selectedStation.name} selected`);
          }
        }}
      />
      {app.location?.selectedStation && (
        <div className="mt-4 rounded-md border border-success/40 bg-success/5 p-3 text-sm">
          <div className="font-medium">Selected: {app.location.selectedStation.name}</div>
          <div className="text-xs text-muted-foreground">
            {app.location.selectedStation.address} ·{" "}
            {app.location.selectedStation.distance.toFixed(1)} km away
          </div>
        </div>
      )}
    </div>
  );
}

/* --------------- Selfie / Photo step (live camera capture) ----------- */

function PhotoStep({ app }: { app: Application }) {
  const webcamRef = useRef<Webcam>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const urls = app.documents.photoUrls ?? [];
  const slot = urls.length; // 0 or 1 (we need 2)

  const handleCapture = useCallback(() => {
    if (!webcamRef.current) return;
    const shot = webcamRef.current.getScreenshot();
    if (!shot) {
      setError("Could not capture photo");
      return;
    }
    setPreview(shot);
    setError(null);
  }, []);

  const handleRetake = () => {
    setPreview(null);
    setError(null);
  };

  const handleConfirm = async () => {
    if (!preview) return;
    setBusy(true);
    try {
      const blob = dataUrlToBlob(preview);
      const filename = `photo-${app.id}-${slot + 1}.jpg`;
      const url = await uploadToCatbox(blob, filename);
      const next = [...urls, url].slice(0, 2);
      await store.updateApplication(app.id, {
        documents: {
          photo: next.length >= 2,
          photoUrls: next,
          selfieUrl: app.documents.selfieUrl ?? url,
        },
      });
      toast.success(`Photo ${next.length} of 2 uploaded`);
      setPreview(null);
    } catch (e) {
      const msg = e instanceof CatboxError ? e.message : e instanceof Error ? e.message : "Upload failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <StepHeader
        title="Take two photos of yourself"
        desc="Use your device camera. Clear, well-lit photos of your face. Both will be uploaded securely and stored against your application."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="aspect-square overflow-hidden rounded-xl border-2 border-dashed bg-secondary/40"
          >
            <div className="flex h-full items-center justify-center">
              {urls[i] ? (
                <img
                  src={urls[i]}
                  alt={`Photo ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="text-center text-xs text-muted-foreground">
                  <Camera className="mx-auto mb-1 h-8 w-8" />
                  Photo {i + 1}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {urls.length < 2 && (
        <div className="rounded-xl border bg-card p-4">
          {preview ? (
            <div className="space-y-3">
              <img
                src={preview}
                alt="Preview"
                className="mx-auto h-72 w-full rounded-md object-cover"
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleRetake} disabled={busy} className="flex-1">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Retake
                </Button>
                <Button onClick={handleConfirm} disabled={busy} className="flex-1">
                  {busy ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading…
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Use this photo
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative overflow-hidden rounded-md bg-black">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ width: 1280, height: 720, facingMode: "user" }}
                  onUserMedia={() => setCameraReady(true)}
                  onUserMediaError={() =>
                    setError("Camera access denied. Check browser permissions.")
                  }
                  className="h-72 w-full object-cover"
                />
                {!cameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
                )}
              </div>
              <Button onClick={handleCapture} disabled={!cameraReady} className="w-full">
                <Camera className="mr-2 h-4 w-4" />
                Capture photo {slot + 1} of 2
              </Button>
            </div>
          )}

          {error && (
            <div className="mt-3 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5" />
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* --------------- Details (residential address) ---------------------- */

function DetailsStep({
  app,
  draft,
  setDraft,
}: {
  app: Application;
  draft: ApplicationAddress;
  setDraft: (a: ApplicationAddress) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function persist(patch: Partial<ApplicationAddress>) {
    const merged = { ...draft, ...patch };
    setDraft(merged);
    // Auto-save on blur to keep Firebase in sync.
    setBusy(true);
    try {
      await store.updateApplication(app.id, { address: merged });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save address");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <StepHeader
        title="Confirm your residential address"
        desc="All fields are required. Saved automatically when you tab away."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Street address">
          <Input
            value={draft.street}
            onChange={(e) => setDraft({ ...draft, street: e.target.value })}
            onBlur={(e) => persist({ street: e.target.value })}
          />
        </Field>
        <Field label="Suburb">
          <Input
            value={draft.suburb}
            onChange={(e) => setDraft({ ...draft, suburb: e.target.value })}
            onBlur={(e) => persist({ suburb: e.target.value })}
          />
        </Field>
        <Field label="City">
          <Input
            value={draft.city}
            onChange={(e) => setDraft({ ...draft, city: e.target.value })}
            onBlur={(e) => persist({ city: e.target.value })}
          />
        </Field>
        <Field label="Province">
          <select
            value={draft.province}
            onChange={(e) => {
              const v = e.target.value;
              setDraft({ ...draft, province: v });
              void persist({ province: v });
            }}
            className="w-full rounded-md border bg-card px-3 py-2 text-sm"
          >
            <option value="">Select province…</option>
            {[
              "Eastern Cape",
              "Free State",
              "Gauteng",
              "KwaZulu-Natal",
              "Limpopo",
              "Mpumalanga",
              "Northern Cape",
              "North West",
              "Western Cape",
            ].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Postal code">
          <Input
            value={draft.postal}
            onChange={(e) => setDraft({ ...draft, postal: e.target.value })}
            onBlur={(e) => persist({ postal: e.target.value })}
          />
        </Field>
      </div>
      {busy && (
        <div className="mt-3 text-xs text-muted-foreground">
          <Loader2 className="mr-1 inline h-3 w-3 animate-spin" /> Saving…
        </div>
      )}
    </div>
  );
}

/* --------------- Signature ------------------------------------------ */

function SignatureStep({ app }: { app: Application }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);
  const [busy, setBusy] = useState(false);
  const saved = !!app.documents.signatureUrl;

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
  function end() {
    drawing.current = false;
  }
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
      await store.updateApplication(app.id, {
        documents: { signature: dataUrl, signatureUrl: url },
      });
      toast.success("Signature saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save signature");
    } finally {
      setBusy(false);
    }
  }

  if (saved) {
    return (
      <div>
        <StepHeader title="Signature saved" desc="Your signature has been securely uploaded." />
        <div className="rounded-xl border-success/40 border bg-success/5 p-4">
          <img
            src={app.documents.signatureUrl}
            alt="Signature"
            className="mx-auto h-32 object-contain"
          />
          <div className="mt-3 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                store.updateApplication(app.id, {
                  documents: { signatureUrl: undefined, signature: undefined },
                })
              }
            >
              <RotateCcw className="mr-2 h-3.5 w-3.5" />
              Redo signature
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <StepHeader
        title="Sign on the line"
        desc="Your e‑signature is legally binding under the ECT Act. Use a finger, stylus, or mouse."
      />
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
          <button className="underline" onClick={clear}>
            Clear
          </button>
        </div>
      </div>
      <div className="mt-5 flex justify-center">
        <Button disabled={!hasInk || busy} onClick={accept}>
          {busy ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Saving…
            </>
          ) : (
            "Accept signature"
          )}
        </Button>
      </div>
    </div>
  );
}

/* --------------- Documents ------------------------------------------ */

function DocsStep({ app }: { app: Application }) {
  const required = useMemo(() => {
    const list: { key: keyof ApplicationDocuments; urlKey: keyof ApplicationDocuments; label: string }[] = [
      { key: "certifiedId", urlKey: "certifiedIdUrl", label: "Certified copy of ID" },
      { key: "proofResidence", urlKey: "proofResidenceUrl", label: "Proof of residence (≤ 3 months)" },
      { key: "eyeCert", urlKey: "eyeCertUrl", label: "Eye certificate — digitally signed by optometrist" },
    ];
    if (app.type === "driver")
      list.push({ key: "learnerCert", urlKey: "learnerCertUrl", label: "Valid Learner's certificate" });
    return list;
  }, [app.type]);

  return (
    <div>
      <StepHeader
        title="Upload supporting documents"
        desc="PDF, JPG or PNG · max 10MB each. Eye certificates must be digitally signed by a registered optometrist."
      />
      <div className="grid gap-3">
        {required.map((d) => (
          <DocRow key={d.key as string} app={app} fieldKey={d.key} urlKey={d.urlKey} label={d.label} />
        ))}
      </div>
    </div>
  );
}

function DocRow({
  app,
  fieldKey,
  urlKey,
  label,
}: {
  app: Application;
  fieldKey: keyof ApplicationDocuments;
  urlKey: keyof ApplicationDocuments;
  label: string;
}) {
  const [busy, setBusy] = useState(false);
  const url = app.documents[urlKey] as string | undefined;

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const uploaded = await uploadToCatbox(file);
      const existingMeta = app.documents.supportingDocs ?? [];
      const nextMeta = [
        ...existingMeta.filter((m) => m.url !== url),
        { name: file.name, type: file.type, url: uploaded, uploadedAt: Date.now() },
      ];
      await store.updateApplication(app.id, {
        documents: {
          [fieldKey]: true,
          [urlKey]: uploaded,
          supportingDocs: nextMeta,
        } as Partial<ApplicationDocuments>,
      });
      toast.success(`${label} uploaded`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`flex items-center justify-between rounded-lg border p-4 ${url ? "border-success/40 bg-success/5" : ""}`}
    >
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">
          {url ? (
            <a href={url} target="_blank" rel="noreferrer" className="underline">
              View uploaded file
            </a>
          ) : (
            "Required"
          )}
        </div>
      </div>
      <label className="cursor-pointer">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        <span
          className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${url ? "border bg-card text-foreground" : "bg-primary text-primary-foreground"}`}
        >
          {busy ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…
            </>
          ) : url ? (
            <>
              <Check className="h-3.5 w-3.5" /> Replace
            </>
          ) : (
            <>
              <Upload className="h-3.5 w-3.5" /> Upload
            </>
          )}
        </span>
      </label>
    </div>
  );
}

/* --------------- Stripe Payment ------------------------------------- */

function PaymentStep({ app }: { app: Application }) {
  const [verifying, setVerifying] = useState(false);
  const [opened, setOpened] = useState(false);
  const paid = app.payment?.status === "paid";
  const link = `${STRIPE_PAYMENT_LINKS[app.type]}?client_reference_id=${encodeURIComponent(app.id)}`;

  function openCheckout() {
    setOpened(true);
    window.open(link, "_blank", "noopener,noreferrer");
  }

  async function verify() {
    setVerifying(true);
    try {
      const result = await verifyStripePayment(app.id);
      if (result.paid) {
        await store.updateApplication(app.id, {
          paid: true,
          payment: {
            status: "paid",
            sessionId: result.sessionId,
            transactionId: result.transactionId,
            amount: result.amount,
            paidAt: result.paidAt,
          },
        });
        toast.success("Payment verified");
      } else {
        toast.error(
          result.error
            ? `Verification failed: ${result.error}`
            : "No completed payment found yet. Try again in a few seconds.",
        );
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div>
      <StepHeader
        title="Pay your application fee"
        desc={`Secure payment via Stripe for the ${app.type === "learner" ? "learner's" : "driver's"} licence application.`}
      />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-secondary/30 p-5">
          <div className="flex items-baseline justify-between">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Total due</div>
            <div className="text-3xl font-bold">R{app.fee}</div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Stripe-hosted checkout opens in a new tab. After payment, return here and tap “I've completed
            payment” to verify.
          </div>
        </div>

        <div>
          {paid ? (
            <div className="flex h-full flex-col items-center justify-center rounded-lg border bg-success/10 p-8 text-center">
              <Check className="h-10 w-10 text-success" />
              <div className="mt-2 font-semibold">Payment received</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Transaction {app.payment?.transactionId?.slice(0, 14) ?? "—"} ·{" "}
                {app.payment?.amount ? `${(app.payment.amount / 100).toFixed(2)} ${app.payment.sessionId ? "" : ""}` : ""}
              </div>
            </div>
          ) : (
            <div className="space-y-3 rounded-lg border p-5">
              <Button onClick={openCheckout} className="w-full" size="lg">
                <ExternalLink className="mr-2 h-4 w-4" />
                Pay R{app.fee} with Stripe
              </Button>
              <Button
                onClick={verify}
                variant="outline"
                disabled={!opened || verifying}
                className="w-full"
              >
                {verifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying…
                  </>
                ) : (
                  "I've completed payment — verify"
                )}
              </Button>
              {!opened && (
                <p className="text-center text-xs text-muted-foreground">
                  Open Stripe Checkout to enable verification.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* --------------- Booking (3-month calendar) ------------------------- */

function BookingStep({ app }: { app: Application }) {
  const centre = app.location?.selectedStation;
  const [date, setDate] = useState(app.booking?.date ?? "");
  const [time, setTime] = useState(app.booking?.time ?? "");

  // Build 3 months of dates starting today.
  const months = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const result: { label: string; days: { date: string; available: boolean; past: boolean }[] }[] = [];
    for (let m = 0; m < 3; m++) {
      const start = new Date(now.getFullYear(), now.getMonth() + m, 1);
      const end = new Date(now.getFullYear(), now.getMonth() + m + 1, 0);
      const label = start.toLocaleDateString(undefined, { month: "long", year: "numeric" });
      const days: { date: string; available: boolean; past: boolean }[] = [];
      for (let d = 1; d <= end.getDate(); d++) {
        const dt = new Date(start.getFullYear(), start.getMonth(), d);
        const iso = dt.toISOString().slice(0, 10);
        const past = dt < now;
        // Weekdays available; closed weekends. Deterministic "unavailable" sprinkle.
        const wd = dt.getDay();
        const isWeekend = wd === 0 || wd === 6;
        const blocked = (dt.getDate() % 7 === 3) && m === 0; // sample blocked day
        days.push({ date: iso, available: !past && !isWeekend && !blocked, past });
      }
      result.push({ label, days });
    }
    return result;
  }, []);

  // Available time slots — derived deterministically from selected date.
  const times = useMemo(() => {
    if (!date) return [] as string[];
    const all = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00"];
    const hash = date.split("-").reduce((a, b) => a + Number(b), 0);
    // Hide a deterministic subset to simulate availability.
    return all.filter((_, i) => (i + hash) % 4 !== 0);
  }, [date]);

  async function pickDate(d: string) {
    setDate(d);
    setTime("");
  }

  async function pickTime(t: string) {
    if (!centre) return;
    setTime(t);
    await store.updateApplication(app.id, {
      booking: {
        centre: centre.name,
        date,
        time: t,
        status: "pending",
        createdAt: Date.now(),
      },
    });
  }

  return (
    <div>
      <StepHeader
        title="Book your test slot"
        desc="Your centre is pre-selected from the location step. Pick an available date and time."
      />

      <div className="mb-4 rounded-md border bg-secondary/30 p-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Licensing centre</div>
        {centre ? (
          <>
            <div className="mt-1 font-semibold">{centre.name}</div>
            <div className="text-xs text-muted-foreground">
              {centre.address} · {centre.distance.toFixed(1)} km away
            </div>
          </>
        ) : (
          <div className="mt-1 text-sm text-amber-700">Select a station in the Location step first.</div>
        )}
      </div>

      <div className="space-y-6">
        {months.map((month) => (
          <div key={month.label}>
            <div className="mb-2 text-sm font-semibold">{month.label}</div>
            <div className="grid grid-cols-7 gap-1.5">
              {month.days.map((d) => {
                const selected = d.date === date;
                return (
                  <button
                    key={d.date}
                    disabled={!d.available}
                    onClick={() => pickDate(d.date)}
                    className={[
                      "rounded-md border p-2 text-xs transition",
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : d.available
                          ? "border-green-300 bg-green-50 text-green-900 hover:bg-green-100"
                          : "cursor-not-allowed border-border bg-muted text-muted-foreground opacity-60",
                    ].join(" ")}
                  >
                    <div className="font-semibold">
                      {new Date(d.date).toLocaleDateString(undefined, { weekday: "short" })}
                    </div>
                    <div>{new Date(d.date).getDate()}</div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {date && (
        <div className="mt-6">
          <Label>Available times</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {times.length === 0 && (
              <div className="text-xs text-muted-foreground">No availability for this date.</div>
            )}
            {times.map((t) => (
              <button
                key={t}
                disabled={!centre}
                onClick={() => pickTime(t)}
                className={`rounded-md border px-3 py-1.5 text-sm transition ${time === t ? "border-primary bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* --------------- Bits ------------------------------------------------ */

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
