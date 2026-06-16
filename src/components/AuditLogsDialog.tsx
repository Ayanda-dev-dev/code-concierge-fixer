import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/user-management";
import { store } from "@/lib/edlts-store";
import type { AuditLog } from "@/lib/edlts-store";

const ACTION_LABELS: Record<string, string> = {
  user_created: "User Created",
  user_updated: "User Updated",
  user_deleted: "User Deleted",
  role_changed: "Role Changed",
  password_reset: "Password Reset",
  account_activated: "Account Activated",
  account_deactivated: "Account Deactivated",
};

const ACTION_COLORS: Record<string, string> = {
  user_created: "bg-green-100 text-green-800",
  user_updated: "bg-blue-100 text-blue-800",
  user_deleted: "bg-red-100 text-red-800",
  role_changed: "bg-purple-100 text-purple-800",
  password_reset: "bg-orange-100 text-orange-800",
  account_activated: "bg-green-100 text-green-800",
  account_deactivated: "bg-gray-100 text-gray-800",
};

interface AuditLogsDialogProps {
  open: boolean;
  onClose: () => void;
  userId?: string;
}

export function AuditLogsDialog({ open, onClose, userId }: AuditLogsDialogProps) {
  const [filterAction, setFilterAction] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const auditLogs = userId ? store.getAuditLogs(userId) : store.getAuditLogs();

  // Get user names for display
  const getUserName = (userId: string) => {
    const user = store.getUser(userId);
    return user?.fullName || "Unknown User";
  };

  // Filter logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesAction = filterAction === "all" || log.action === filterAction;
      const matchesSearch =
        !searchQuery ||
        getUserName(log.userId).toLowerCase().includes(searchQuery.toLowerCase()) ||
        getUserName(log.adminId).toLowerCase().includes(searchQuery.toLowerCase());
      return matchesAction && matchesSearch;
    });
  }, [auditLogs, filterAction, searchQuery]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Audit Logs</DialogTitle>
          <DialogDescription>
            {userId
              ? "Activity history for this user"
              : "System-wide administrative actions and changes"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filters */}
          <div className="grid gap-4 md:grid-cols-3">
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {Object.entries(ACTION_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Search by user name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div className="text-sm text-muted-foreground pt-2">
              {filteredLogs.length} log{filteredLogs.length !== 1 ? "s" : ""} found
            </div>
          </div>

          {/* Logs Table */}
          <div className="overflow-x-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>User Affected</TableHead>
                  <TableHead>Administrator</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Changes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge className={ACTION_COLORS[log.action] || "bg-gray-100 text-gray-800"}>
                          {ACTION_LABELS[log.action] || log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{getUserName(log.userId)}</TableCell>
                      <TableCell className="text-sm">{getUserName(log.adminId)}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {formatDate(log.timestamp)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {log.changes && Object.keys(log.changes).length > 0 ? (
                          <div className="space-y-1">
                            {Object.entries(log.changes).map(([key, value]) => (
                              <div key={key} className="text-muted-foreground">
                                <span className="font-semibold">{key}:</span> {String(value)}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
