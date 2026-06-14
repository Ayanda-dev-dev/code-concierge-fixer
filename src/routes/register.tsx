import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSessionRedirectPath, useAuthSession } from "@/lib/edlts-store";
import { registerWithEmailPassword } from "@/lib/firebase";
import { getFirebaseAuth } from "@/lib/firebase";
import { signOut as fbSignOut } from "firebase/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account � eDLTS" }] }),
  component: RegisterPage,
});

function validateFullName(name: string) {
  return /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ '\u2019-][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/u.test(name.trim());
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validatePassword(password: string) {
  return (
    password.length >= 12 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[!@#$%^&*()_\-+=[\]{};:'",.<>/?\\|`~]/.test(password)
  );
}

function validateSAId(id: string) {
  const digits = id.replace(/\D/g, "");
  if (!/^\d{13}$/.test(digits)) return false;

  const year = parseInt(digits.slice(0, 2), 10);
  const month = parseInt(digits.slice(2, 4), 10);
  const day = parseInt(digits.slice(4, 6), 10);
  const fullYear = year > new Date().getFullYear() % 100 ? 1900 + year : 2000 + year;

  const date = new Date(fullYear, month - 1, day);
  if (date.getFullYear() !== fullYear || date.getMonth() + 1 !== month || date.getDate() !== day) {
    return false;
  }

  return luhnCheck(digits);
}

function validateSAPhone(phone: string) {
  const normalized = normalizePhone(phone);
  return /^\+27[6-8]\d{8}$/.test(normalized);
}

function normalizePhone(phone: string) {
  const trimmed = phone.replace(/[^\d+]/g, "");
  if (trimmed.startsWith("+27") && trimmed.length === 12) return trimmed;
  if (trimmed.startsWith("0") && trimmed.length === 10) return `+27${trimmed.slice(1)}`;
  if (trimmed.startsWith("27") && trimmed.length === 11) return `+${trimmed}`;
  return trimmed;
}

function luhnCheck(value: string) {
  let sum = 0;
  let alternate = false;
  for (let i = value.length - 1; i >= 0; i--) {
    let digit = parseInt(value[i], 10);
    if (alternate) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

function RegisterPage() {
  const navigate = useNavigate();
  const { currentUser, isHydrated } = useAuthSession();
  const [form, setForm] = useState({ fullName: "", email: "", idNumber: "", phone: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");

  if (isHydrated && currentUser) {
    return <Navigate to={getSessionRedirectPath(currentUser)} />;
  }

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleRegister() {
    const fullName = form.fullName.trim();
    const email = form.email.trim();
    const idNumber = form.idNumber.trim();
    const phone = form.phone.trim();
    const password = form.password;

    if (!fullName || !email || !idNumber || !phone || !password) return toast.error("Fill in all fields and create a password");
    if (!validateFullName(fullName)) return toast.error("Full name may only contain letters, spaces, apostrophes, and hyphens.");
    if (!validateEmail(email)) return toast.error("Enter a valid email address.");
    if (!validateSAId(idNumber)) return toast.error("Enter a valid 13-digit South African ID number.");
    if (!validateSAPhone(phone)) return toast.error("Enter a valid South African phone number.");
    if (!validatePassword(password)) return toast.error("Password must be 12+ characters and include uppercase, lowercase, number, and special character.");

    const normalizedEmail = email.toLowerCase();
    const normalizedPhone = normalizePhone(phone);

    setIsSubmitting(true);
    try {
      await registerWithEmailPassword(normalizedEmail, password, {
        fullName,
        idNumber,
        phone: normalizedPhone,
        role: "applicant",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to register";
      if (String(message).includes("email-already-in-use")) {
        toast.error("Email already registered. Please log in.");
        setIsSubmitting(false);
        return;
      }
      toast.error(message);
      setIsSubmitting(false);
      return;
    }

    // Sign out immediately so they go through verification + login flow.
    try {
      const auth = getFirebaseAuth();
      if (auth) await fbSignOut(auth);
    } catch {
      /* ignore */
    }
    setVerificationEmail(normalizedEmail);
    setDialogOpen(true);
    setIsSubmitting(false);
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Create your eDLTS account</CardTitle>
          <CardDescription>Create a secure password and verify your email before signing in.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <>
            <Field label="Full name"><Input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} /></Field>
            <Field label="Email"><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
            <Field label="Password"><Input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Create a strong password" /></Field>
            <div className="rounded-lg border border-muted-foreground/20 bg-muted p-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Strong password guidelines</p>
              <ul className="ml-5 list-disc space-y-1 pt-1 text-sm">
                <li>12 or more characters</li>
                <li>Uppercase and lowercase letters</li>
                <li>At least one number</li>
                <li>At least one special character</li>
              </ul>
            </div>
            <Field label="ID number"><Input value={form.idNumber} onChange={(e) => set("idNumber", e.target.value)} maxLength={13} /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+27 82 000 0000" /></Field>
            <Button className="w-full" onClick={handleRegister} disabled={isSubmitting}>{isSubmitting ? "Creating account..." : "Create account"}</Button>
            <div className="text-center text-sm text-muted-foreground">
              Already registered? <Link to="/login" className="font-medium text-primary underline">Sign in</Link>
            </div>
          </>
        </CardContent>
      </Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify your email</DialogTitle>
            <DialogDescription>
              We sent a verification link to <span className="font-medium">{verificationEmail}</span>. Please click the link in your inbox before signing in.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="w-full sm:w-auto" onClick={() => navigate({ to: "/login" })}>
              Go to login
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
