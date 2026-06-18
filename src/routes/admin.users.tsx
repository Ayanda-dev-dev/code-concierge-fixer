import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthSession, useStore, store, type User } from "@/lib/edlts-store";
import { adminCreateStaffUser } from "@/lib/firebase";
import { logAuditAction } from "@/lib/audit-trail";
import { toast } from "sonner";
import { ArrowLeft, Plus, Pencil, Trash2, Search, ShieldCheck, UserCircle } from "lucide-react";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "User Management · eDLTS" }] }),
  component: UserManagementPage,
});

const ROLE_LABELS: Record<string, string> = {
  applicant: "Applicant",
  officer: "Officer",
  admin: "Administrator",
};

const ROLE_COLORS: Record<string, string> = {
  applicant: "bg-muted text-muted-foreground",
  officer: "bg-primary/10 text-primary",
  admin: "bg-gold/15 text-gold-foreground",
};

function UserManagementPage() {
  const { currentUser: user, isHydrated } = useAuthSession();
  const allUsers = useStore((s) => s.users);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    idNumber: "",
    phone: "",
    role: "applicant" as "applicant" | "officer" | "admin",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);

  if (!isHydrated) return null;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== "admin") return <Navigate to="/" />;

  const filtered = allUsers.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.idNumber.includes(q)
    );
  });

  function openCreate() {
    setEditingUser(null);
    setForm({ fullName: "", email: "", idNumber: "", phone: "", role: "applicant", password: "" });
    setDialogOpen(true);
  }

  function openEdit(u: User) {
    setEditingUser(u);
    setForm({
      fullName: u.fullName,
      email: u.email,
      idNumber: u.idNumber,
      phone: u.phone,
      role: u.role,
      password: "",
    });
    setDialogOpen(true);
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      if (editingUser) {
        const { password: _pw, ...rest } = form;
        await store.updateUser(editingUser.id, rest);
        await logAuditAction({
          userId: user.id,
          userName: user.fullName,
          userRole: user.role,
          action: "user_updated",
          relatedUserId: editingUser.id,
          details: { updatedFields: Object.keys(rest) },
        });
        toast.success("User updated");
      } else {
        const { password, ...profile } = form;
        if (profile.role === "applicant") {
          toast.error("Applicants must self-register from the public registration page.");
          setSubmitting(false);
          return;
        }
        // Staff users (officer/admin) created via Firebase Auth + Firestore.
        if (!password || password.length < 6) {
          toast.error("Password must be at least 6 characters");
          setSubmitting(false);
          return;
        }
        try {
          await adminCreateStaffUser(profile.email.trim().toLowerCase(), password, profile);
          await logAuditAction({
            userId: user.id,
            userName: user.fullName,
            userRole: user.role,
            action: "user_created",
            details: { newUserRole: profile.role, email: profile.email },
          });
          toast.success("Staff user created");
        } catch (err: any) {
          const code = err?.code || "";
          if (code === "auth/email-already-in-use") {
            toast.error("A Firebase account with that email already exists.");
          } else {
            toast.error(err?.message || "Failed to create staff user");
          }
          setSubmitting(false);
          return;
        }
      }
      setDialogOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to save user");
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete(u: User) {
    try {
      await store.deleteUser(u.id);
      await logAuditAction({
        userId: user.id,
        userName: user.fullName,
        userRole: user.role,
        action: "user_deleted",
        relatedUserId: u.id,
        details: { deletedUserEmail: u.email, deletedUserRole: u.role },
      });
      toast.success("User deleted (Firestore profile removed).");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete user");
    }
    setDeleteTarget(null);
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link to="/admin" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
          </Link>
          <div className="mt-2">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Administrator</div>
            <h1 className="text-3xl font-bold">User management</h1>
          </div>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" /> Add user
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email or ID number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 pr-4">User</th>
                  <th className="py-3 pr-4">ID Number</th>
                  <th className="py-3 pr-4">Phone</th>
                  <th className="py-3 pr-4">Role</th>
                  <th className="py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No users found.
                    </td>
                  </tr>
                )}
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30 transition">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <UserCircle className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{u.fullName}</div>
                          <div className="text-xs text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 tabular-nums text-muted-foreground">{u.idNumber}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{u.phone}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${ROLE_COLORS[u.role]}`}>
                        {u.role === "admin" && <ShieldCheck className="h-3 w-3" />}
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(u)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog open={deleteTarget?.id === u.id} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(u)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete user?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently remove <strong>{u.fullName}</strong> and all their applications. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancel</AlertDialogCancel>
                              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => confirmDelete(u)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit user" : "Create user"}</DialogTitle>
            <DialogDescription>
              {editingUser ? "Update the user's details below." : "Add a new user to the system."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="e.g. Thabo Mokoena" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="e.g. thabo@edlts.gov" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>ID number</Label>
                <Input value={form.idNumber} onChange={(e) => setForm({ ...form, idNumber: e.target.value })} placeholder="13 digits" maxLength={13} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+27..." />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as any })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="applicant">Applicant</SelectItem>
                  <SelectItem value="officer">Officer</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.role !== "applicant" && !editingUser && (
              <div className="space-y-1.5">
                <Label>Initial password</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="At least 6 characters"
                />
                <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                  Staff account (Officer/Admin) will be created in Firebase Authentication and Firestore immediately. They can sign in with this email + password — no email verification required. This action will be logged in the audit trail.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting || !form.fullName || !form.email || !form.idNumber || !form.phone || (!editingUser && form.role !== "applicant" && !form.password)}>
              {submitting ? "Saving..." : editingUser ? "Save changes" : "Create user"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
