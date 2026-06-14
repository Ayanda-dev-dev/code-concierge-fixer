import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDate, ROLE_LABELS } from "@/lib/user-management";
import { store } from "@/lib/edlts-store";
import type { User } from "@/lib/edlts-store";

interface UserDetailsDialogProps {
  user: User | null;
  open: boolean;
  onClose: () => void;
}

export function UserDetailsDialog({ user, open, onClose }: UserDetailsDialogProps) {
  if (!user) return null;

  const auditLogs = store.getAuditLogs(user.id);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Full Name</p>
                  <p className="text-sm font-semibold">{user.fullName}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Email</p>
                  <p className="text-sm font-semibold">{user.email}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">ID Number</p>
                  <p className="text-sm font-semibold">{user.idNumber}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Phone</p>
                  <p className="text-sm font-semibold">{user.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Role</p>
                  <Badge variant="outline" className="mt-1">
                    {ROLE_LABELS[user.role]}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Status</p>
                  <Badge
                    variant={user.status === "active" ? "default" : "secondary"}
                    className="mt-1"
                  >
                    {user.status === "active" ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Created</p>
                  <p className="text-sm font-semibold">{formatDate(user.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Last Login</p>
                  <p className="text-sm font-semibold">{formatDate(user.lastLogin)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          {auditLogs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {auditLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex justify-between items-start text-sm">
                      <div>
                        <p className="font-medium capitalize">
                          {log.action.replace("_", " ")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(log.timestamp)}
                        </p>
                      </div>
                      {log.changes && Object.keys(log.changes).length > 0 && (
                        <div className="text-xs text-muted-foreground text-right">
                          {Object.entries(log.changes).map(([key, value]) => (
                            <p key={key}>
                              {key}: {String(value)}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
