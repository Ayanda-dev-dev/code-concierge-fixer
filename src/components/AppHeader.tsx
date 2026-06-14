import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ShieldCheck, LogOut, LayoutDashboard, FileText, Activity, UserCog } from "lucide-react";
import { store, useAuthSession } from "@/lib/edlts-store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";

export function AppHeader() {
  const { currentUser, isHydrated } = useAuthSession();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false);

  const navItems = !isHydrated
    ? []
    : currentUser?.role === "applicant"
      ? [
          { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { to: "/apply", label: "Apply", icon: FileText },
          { to: "/queue", label: "Queue", icon: Activity },
        ]
      : currentUser?.role === "officer"
        ? [{ to: "/officer", label: "Officer Console", icon: UserCog }]
        : currentUser?.role === "admin"
          ? [{ to: "/admin", label: "Admin", icon: LayoutDashboard }]
          : [];

  return (
    <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold tracking-tight">eDLTS</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Dept. of Transport</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((it) => {
            const active = pathname.startsWith(it.to);
            const Icon = it.icon;
            return (
              <Link
                key={it.to}
                to={it.to}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition ${
                  active ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {it.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {currentUser ? (
            <>
              <div className="hidden text-right sm:block">
                <div className="text-xs font-medium">{currentUser.fullName}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{currentUser.role}</div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSignOutDialogOpen(true)}
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link to="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
              <Link to="/register"><Button size="sm">Get started</Button></Link>
            </>
          )}
        </div>
        <Dialog open={signOutDialogOpen} onOpenChange={setSignOutDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sign out</DialogTitle>
              <DialogDescription>Are you sure you want to sign out? This will end your current session and return you to the public landing page.</DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setSignOutDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={() => {
                  store.signOut();
                  setSignOutDialogOpen(false);
                  navigate({ to: "/" });
                }}
              >
                Sign out
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="gold-line h-px" />
    </header>
  );
}
