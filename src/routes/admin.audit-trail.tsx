import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthSession } from "@/lib/edlts-store";
import { getAuditLogs, getActionLabel, getActionColor, type AuditLog } from "@/lib/audit-trail";
import { ArrowLeft, Filter, X } from "lucide-react";

export const Route = createFileRoute("/admin/audit-trail")({
  head: () => ({ meta: [{ title: "Audit Trail · eDLTS" }] }),
  component: AdminAuditTrailPage,
});

function AdminAuditTrailPage() {
  const { currentUser: user, isHydrated } = useAuthSession();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [userFilter, setUserFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("");
  const [daysFilter, setDaysFilter] = useState("7");

  if (!isHydrated) return null;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== "admin") return <Navigate to="/" />;

  // Load logs on mount and when filters change
  useEffect(() => {
    loadLogs();
  }, [userFilter, roleFilter, actionFilter, daysFilter]);

  async function loadLogs() {
    setLoading(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(daysFilter));

      const logs = await getAuditLogs({
        startDate,
        userRole: roleFilter || undefined,
        action: actionFilter as any || undefined,
        limit: 500,
      });

      setLogs(logs);
    } catch (error) {
      console.error("Failed to load audit logs:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (userFilter && !log.userName.toLowerCase().includes(userFilter.toLowerCase())) return false;
      return true;
    });
  }, [logs, userFilter]);

  // Get unique actions from logs for the action filter dropdown
  const allActions = Array.from(new Set(logs.map((l) => l.action)));

  const getDetailsSummary = (log: AuditLog) => {
    const details: string[] = [];
    if (log.relatedUserId) {
      details.push(`User: ${log.relatedUserId.slice(0, 8)}`);
    }
    if (log.relatedAppId) {
      details.push(`App: ${log.relatedAppId.slice(0, 8).toUpperCase()}`);
    }
    if (log.details) {
      if (log.details.newUserRole) {
        details.push(`Role: ${log.details.newUserRole}`);
      }
      if (log.details.deletedUserRole) {
        details.push(`Was: ${log.details.deletedUserRole}`);
      }
      if (log.details.score !== undefined) {
        details.push(`Score: ${log.details.score}`);
      }
      if (log.details.passed !== undefined) {
        details.push(`${log.details.passed ? "Passed" : "Failed"}`);
      }
      if (log.details.updatedFields) {
        details.push(`Fields: ${Array.isArray(log.details.updatedFields) ? log.details.updatedFields.join(", ") : log.details.updatedFields}`);
      }
    }
    return details.length > 0 ? details.join(" • ") : "—";
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link to="/admin" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
          </Link>
          <div className="mt-2">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">System Administration</div>
            <h1 className="text-3xl font-bold">Audit Trail</h1>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">User Name</Label>
              <Input
                placeholder="Search by user..."
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="officer">Officer</SelectItem>
                  <SelectItem value="applicant">Applicant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Action</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Actions</SelectItem>
                  {allActions.map((action) => (
                    <SelectItem key={action} value={action}>
                      {getActionLabel(action as any)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Time Range</Label>
              <Select value={daysFilter} onValueChange={setDaysFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Last 24 hours</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="p-3 pr-4">Time</th>
                  <th className="p-3 pr-4">User</th>
                  <th className="p-3 pr-4">Role</th>
                  <th className="p-3 pr-4">Action</th>
                  <th className="p-3 pr-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      Loading audit logs...
                    </td>
                  </tr>
                )}
                {!loading && filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No audit logs found.
                    </td>
                  </tr>
                )}
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition">
                    <td className="p-3 pr-4 text-xs whitespace-nowrap">
                      {log.timestamp?.toDate ? new Date(log.timestamp.toDate()).toLocaleString() : new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3 pr-4 font-medium text-sm">{log.userName}</td>
                    <td className="p-3 pr-4">
                      <Badge variant="outline" className="capitalize text-xs">
                        {log.userRole}
                      </Badge>
                    </td>
                    <td className="p-3 pr-4">
                      <Badge className={getActionColor(log.action as any)}>
                        {getActionLabel(log.action as any)}
                      </Badge>
                    </td>
                    <td className="p-3 pr-4 text-xs text-muted-foreground max-w-xs truncate" title={getDetailsSummary(log)}>
                      {getDetailsSummary(log)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t p-4 text-xs text-muted-foreground text-center">
            Showing {filteredLogs.length} of {logs.length} audit logs
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
