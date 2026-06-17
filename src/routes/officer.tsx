import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { store, useAuthSession, useStore, type Application } from "@/lib/edlts-store";
import { logAuditAction } from "@/lib/audit-trail";
import { toast } from "sonner";
import { Fingerprint, Check, X, QrCode, Eye, BookOpen, FileText } from "lucide-react";

export const Route = createFileRoute("/officer")({
  head: () => ({ meta: [{ title: "Officer console · eDLTS" }] }),
  component: OfficerPage,
});

function OfficerPage() {
  const { currentUser: user, isHydrated } = useAuthSession();
  const apps = useStore((s) => s.applications);
  const users = useStore((s) => s.users);

  const [tab, setTab] = useState<"bookings" | "applications">("bookings");
  const [testResultDialog, setTestResultDialog] = useState<{ open: boolean; appId?: string }>({ open: false });
  const [appDetailsDialog, setAppDetailsDialog] = useState<{ open: boolean; appId?: string }>({ open: false });
  const [testForm, setTestForm] = useState({ passed: true, score: "", comments: "" });
  const [submitting, setSubmitting] = useState(false);

  if (!isHydrated) return null;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== "officer") return <Navigate to="/" />;

  const queue = useMemo(() => apps.filter((a) => ["booked", "checked_in", "in_test"].includes(a.status)), [apps]);
  const allApplications = useMemo(() => apps.filter((a) => !["draft"].includes(a.status)), [apps]);

  const selectedApp = testResultDialog.appId ? apps.find((a) => a.id === testResultDialog.appId) : null;
  const selectedAppDetails = appDetailsDialog.appId ? apps.find((a) => a.id === appDetailsDialog.appId) : null;

  async function handleCheckIn(appId: string) {
    await store.updateApplication(appId, { status: "checked_in" });
    await logAuditAction({
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      action: "applicant_checked_in",
      relatedAppId: appId,
    });
    toast.success("Applicant checked in");
  }

  async function handleBiometrics(appId: string) {
    await store.updateApplication(appId, { status: "in_test" });
    await logAuditAction({
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      action: "biometrics_captured",
      relatedAppId: appId,
    });
    toast.success("Biometrics captured - test started");
  }

  async function submitTestResult() {
    if (!selectedApp) return;
    setSubmitting(true);

    try {
      const isPassed = testForm.passed;
      const newStatus = isPassed ? (selectedApp.type === "learner" ? "passed" : "producing") : "failed";
      
      const testDetails: any = {
        testDate: new Date().toISOString(),
        passed: isPassed,
        score: testForm.score ? parseInt(testForm.score) : undefined,
        comments: testForm.comments || undefined,
      };

      await store.updateApplication(selectedApp.id, {
        status: newStatus,
        productionStage: isPassed && selectedApp.type === "driver" ? 1 : undefined,
      });

      await logAuditAction({
        userId: user.id,
        userName: user.fullName,
        userRole: user.role,
        action: isPassed ? "test_passed" : "test_failed",
        relatedAppId: selectedApp.id,
        details: testDetails,
      });

      toast.success(`Test result submitted: ${isPassed ? "PASSED" : "FAILED"}`);
      setTestResultDialog({ open: false });
      setTestForm({ passed: true, score: "", comments: "" });
    } catch (error) {
      toast.error("Failed to submit test result");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Licensing officer console</div>
        <h1 className="text-3xl font-bold">{tab === "bookings" ? "Today's Queue" : "Applications"}</h1>
      </div>

      {/* Tab Buttons */}
      <div className="mb-6 flex gap-2">
        <Button
          variant={tab === "bookings" ? "default" : "outline"}
          onClick={() => setTab("bookings")}
        >
          <BookOpen className="mr-2 h-4 w-4" /> Bookings & Queue ({queue.length})
        </Button>
        <Button
          variant={tab === "applications" ? "default" : "outline"}
          onClick={() => setTab("applications")}
        >
          <FileText className="mr-2 h-4 w-4" /> All Applications ({allApplications.length})
        </Button>
      </div>

      {/* Bookings Tab */}
      {tab === "bookings" && (
        <div className="grid gap-3">
          {queue.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">Queue is empty.</CardContent>
            </Card>
          )}
          {queue.map((a) => {
            const applicant = users.find((u) => u.id === a.userId);
            return (
              <Card key={a.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{a.queueNumber}</Badge>
                      <span className="font-semibold">{applicant?.fullName ?? "Applicant"}</span>
                      <Badge>{a.type === "learner" ? "Learner's" : "Driver's"}</Badge>
                      <Badge variant="secondary" className="ml-2">{a.status}</Badge>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      ID {applicant?.idNumber} · Slot {a.testDate} {a.testTime} · {a.centre}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {a.status === "booked" && (
                      <Button size="sm" variant="outline" onClick={() => handleCheckIn(a.id)}>
                        <QrCode className="mr-1 h-3.5 w-3.5" /> Check in
                      </Button>
                    )}
                    {a.status === "checked_in" && (
                      <Button size="sm" onClick={() => handleBiometrics(a.id)}>
                        <Fingerprint className="mr-1 h-3.5 w-3.5" /> Start test
                      </Button>
                    )}
                    {a.status === "in_test" && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            setTestForm({ passed: true, score: "", comments: "" });
                            setTestResultDialog({ open: true, appId: a.id });
                          }}
                        >
                          <Check className="mr-1 h-3.5 w-3.5" /> Record Result
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setAppDetailsDialog({ open: true, appId: a.id })}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Applications Tab */}
      {tab === "applications" && (
        <div className="grid gap-3">
          {allApplications.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">No applications.</CardContent>
            </Card>
          )}
          {allApplications.map((a) => {
            const applicant = users.find((u) => u.id === a.userId);
            return (
              <Card key={a.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{applicant?.fullName ?? "Applicant"}</span>
                      <Badge>{a.type === "learner" ? "Learner's" : "Driver's"}</Badge>
                      <Badge variant="secondary">{a.status}</Badge>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {applicant?.email} · Ref {a.id.slice(0, 8).toUpperCase()}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setAppDetailsDialog({ open: true, appId: a.id })}>
                    <Eye className="mr-1 h-3.5 w-3.5" /> View Details
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Test Result Dialog */}
      <Dialog open={testResultDialog.open} onOpenChange={(open) => setTestResultDialog({ open })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Test Result</DialogTitle>
            <DialogDescription>
              Record the test outcome for {selectedApp && `${users.find(u => u.id === selectedApp.userId)?.fullName}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Result</Label>
              <Select value={testForm.passed ? "pass" : "fail"} onValueChange={(v) => setTestForm({ ...testForm, passed: v === "pass" })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pass">✓ Pass</SelectItem>
                  <SelectItem value="fail">✗ Fail</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Score (optional)</Label>
              <Input
                type="number"
                placeholder="e.g. 75"
                value={testForm.score}
                onChange={(e) => setTestForm({ ...testForm, score: e.target.value })}
                min="0"
                max="100"
              />
            </div>
            <div className="space-y-2">
              <Label>Comments</Label>
              <Textarea
                placeholder="Any observations or notes about the test..."
                value={testForm.comments}
                onChange={(e) => setTestForm({ ...testForm, comments: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestResultDialog({ open: false })} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={submitTestResult} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Result"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Application Details Dialog */}
      <Dialog open={appDetailsDialog.open} onOpenChange={(open) => setAppDetailsDialog({ open })}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>
          {selectedAppDetails && (
            <div className="space-y-6 py-4">
              {/* Applicant Info */}
              <div>
                <h3 className="font-semibold mb-3">Applicant Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Name</div>
                    <div className="font-medium">{users.find(u => u.id === selectedAppDetails.userId)?.fullName}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Email</div>
                    <div className="font-medium">{users.find(u => u.id === selectedAppDetails.userId)?.email}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">ID Number</div>
                    <div className="font-medium">{users.find(u => u.id === selectedAppDetails.userId)?.idNumber}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Licence Type</div>
                    <div className="font-medium">{selectedAppDetails.type === "learner" ? "Learner's" : "Driver's"}</div>
                  </div>
                </div>
              </div>

              {/* Application Status */}
              <div>
                <h3 className="font-semibold mb-3">Application Status</h3>
                <Badge variant="secondary" className="capitalize">{selectedAppDetails.status}</Badge>
              </div>

              {/* Address Info */}
              {selectedAppDetails.address && (
                <div>
                  <h3 className="font-semibold mb-3">Residential Address</h3>
                  <div className="text-sm text-muted-foreground">
                    {selectedAppDetails.address.street}<br />
                    {selectedAppDetails.address.suburb}, {selectedAppDetails.address.city}<br />
                    {selectedAppDetails.address.province} {selectedAppDetails.address.postal}
                  </div>
                </div>
              )}

              {/* Documents */}
              {selectedAppDetails.documents && (
                <div>
                  <h3 className="font-semibold mb-3">Documents</h3>
                  <div className="space-y-2 text-sm">
                    {selectedAppDetails.documents.idScanUrl && <div className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> ID Scan</div>}
                    {selectedAppDetails.documents.photoUrls && selectedAppDetails.documents.photoUrls.length > 0 && <div className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> Photos ({selectedAppDetails.documents.photoUrls.length})</div>}
                    {selectedAppDetails.documents.signatureUrl && <div className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> Signature</div>}
                    {selectedAppDetails.documents.certifiedIdUrl && <div className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> Certified ID Copy</div>}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
