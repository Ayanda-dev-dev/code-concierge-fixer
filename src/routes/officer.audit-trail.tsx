import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import { ArrowLeft, Filter } from "lucide-react";

export const Route = createFileRoute("/officer/audit-trail")({
  head: () => ({ meta: [{ title: "Activity Log · eDLTS" }] }),
  component: OfficerAuditTrailPage,
});

function OfficerAuditTrailPage() {
  const { currentUser: user, isHydrated } = useAuthSession();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [actionFilter, setActionFilter] = useState<string>("");
  const [daysFilter, setDaysFilter] = useState("7");

  if (!isHydrated) return null;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== "officer") return <Navigate to="/" />;

  // Load officer's own action logs
  useEffect(() => {
    loadLogs();
  }, [actionFilter, daysFilter]);

  async function loadLogs() {
    setLoading(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(daysFilter));

      const allLogs = await getAuditLogs({
        startDate,
        userId: user.id,
        action: actionFilter as any || undefined,
        limit: 500,
      });

      setLogs(allLogs);
    } catch (error) {
      console.error("Failed to load audit logs:", error);
    } finally {
      setLoading(false);
    }
  }

  // Officer-specific actions
  const officerActions = [
    "applicant_checked_in",
    "biometrics_captured",
    "test_started",
    "test_passed",
    "test_failed",
    "test_result_submitted",
    "user_login",
    "user_logout",
  ];

  const filteredLogs = logs.filter((log) => officerActions.includes(log.action));

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8">
        <Link to="/officer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to console
        </Link>
        <div className="mt-2">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Officer Console</div>
          <h1 className="text-3xl font-bold">Activity Log</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your recent actions and test submissions</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Action Type</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Actions</SelectItem>
                  <SelectItem value="applicant_checked_in">Applicant Check-in</SelectItem>
                  <SelectItem value="biometrics_captured">Biometrics Captured</SelectItem>
                  <SelectItem value="test_started">Test Started</SelectItem>
                  <SelectItem value="test_passed">Test Passed</SelectItem>
                  <SelectItem value="test_failed">Test Failed</SelectItem>
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
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="p-3 pr-4">Time</th>
                  <th className="p-3 pr-4">Action</th>
                  <th className="p-3 pr-4">Application</th>
                  <th className="p-3 pr-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                      Loading activity log...
                    </td>
                  </tr>
                )}
                {!loading && filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                      No activity recorded in this period.
                    </td>
                  </tr>
                )}
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition">
                    <td className="p-3 pr-4 text-xs whitespace-nowrap">
                      {log.timestamp?.toDate ? new Date(log.timestamp.toDate()).toLocaleString() : new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3 pr-4">
                      <Badge className={getActionColor(log.action as any)}>
                        {getActionLabel(log.action as any)}
                      </Badge>
                    </td>
                    <td className="p-3 pr-4 text-xs font-mono text-muted-foreground">
                      {log.relatedAppId ? log.relatedAppId.slice(0, 8).toUpperCase() : "—"}
                    </td>
                    <td className="p-3 pr-4 text-xs text-muted-foreground">
                      {log.details && Object.keys(log.details).length > 0 ? (
                        <span>
                          {log.details.passed !== undefined && `${log.details.passed ? "Passed" : "Failed"}`}
                          {log.details.score !== undefined && ` • Score: ${log.details.score}`}
                          {log.details.comments && ` • ${log.details.comments.substring(0, 30)}...`}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t p-4 text-xs text-muted-foreground text-center">
            Showing {filteredLogs.length} activity records
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
