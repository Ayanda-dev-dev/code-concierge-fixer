import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSessionRedirectPath, useAuthSession } from "@/lib/edlts-store";
import { loginWithEmailPassword, bootstrapAndSignInDemo } from "@/lib/firebase";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in · eDLTS" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { currentUser, isHydrated } = useAuthSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bootstrapping, setBootstrapping] = useState<"officer" | "admin" | null>(null);

  if (isHydrated && currentUser) {
    return <Navigate to={getSessionRedirectPath(currentUser)} />;
  }

  async function handle() {
    if (!email) return toast.error("Enter your email");
    if (!password) return toast.error("Enter your password");

    const normalizedEmail = email.trim().toLowerCase();
    const isDemoAccount = normalizedEmail === "officer@edlts.gov" || normalizedEmail === "admin@edlts.gov";

    if (isDemoAccount) {
      // Run through the demo bootstrap path so first-time clicks create the
      // Firebase Auth + Firestore profile transparently.
      try {
        await bootstrapAndSignInDemo(normalizedEmail.startsWith("officer") ? "officer" : "admin");
        toast.success("Welcome back");
        // onAuthStateChanged will populate session; redirect after a tick.
        return;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unable to sign in demo account";
        toast.error(message);
        return;
      }
    }

    let credential;
    try {
      credential = await loginWithEmailPassword(normalizedEmail, password);
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
        toast.error("Incorrect email or password.");
      } else if (code === "auth/user-not-found") {
        toast.error("No account found with that email.");
      } else {
        const message = error instanceof Error ? error.message : "Unable to sign in";
        toast.error(message);
      }
      return;
    }

    if (!credential.user.emailVerified) {
      // Profile read may still succeed if staffCreated=true; let session hook
      // pick that up. Otherwise warn and sign back out.
      toast.message("Signed in — verify your email if you can't access protected pages.");
    } else {
      toast.success("Welcome back");
    }
  }

  async function handleDemo(role: "officer" | "admin") {
    setBootstrapping(role);
    try {
      await bootstrapAndSignInDemo(role);
      toast.success(`Signed in as ${role}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to sign in demo account";
      toast.error(message);
    } finally {
      setBootstrapping(null);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4">
      <Card className="w-full">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle>Sign in to eDLTS</CardTitle>
          <CardDescription>Use the email and password you registered with. Staff accounts created by an administrator sign in immediately.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email address</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" onKeyDown={(e) => e.key === "Enter" && handle()} />
          </div>
          <Button className="w-full" onClick={handle}>Continue</Button>
          <div className="space-y-2">
            <div className="text-center text-xs uppercase tracking-wider text-muted-foreground">Staff quick sign-in</div>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" size="sm" disabled={bootstrapping !== null} onClick={() => handleDemo("officer")}>
                {bootstrapping === "officer" ? "Signing in…" : "Officer demo"}
              </Button>
              <Button type="button" variant="outline" size="sm" disabled={bootstrapping !== null} onClick={() => handleDemo("admin")}>
                {bootstrapping === "admin" ? "Signing in…" : "Admin demo"}
              </Button>
            </div>
            <p className="text-center text-[10px] text-muted-foreground">First click creates real Firebase accounts (officer123 / admin123).</p>
          </div>
          <div className="text-center text-sm text-muted-foreground">
            No account? <Link to="/register" className="font-medium text-primary underline">Register</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// silence unused import lint until navigate is needed
void useNavigate;
