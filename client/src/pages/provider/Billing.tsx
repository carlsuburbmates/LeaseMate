import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { toast } from "sonner";
import { ArrowLeft, DollarSign, AlertTriangle } from "lucide-react";
import { useState } from "react";

type RefundTarget = { invitationId: number; categoryName: string };

export default function ProviderBilling() {
  const { isAuthenticated } = useAuth();
  const { data: billing, isLoading, refetch } = trpc.provider.billingHistory.useQuery(undefined, { enabled: isAuthenticated });
  const [refundTarget, setRefundTarget] = useState<RefundTarget | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [contactAttempts, setContactAttempts] = useState("3");

  const flagJob = trpc.provider.flagJob.useMutation({
    onSuccess: () => {
      toast.success("Refund request submitted. Our team will review within 2 business days.");
      setRefundTarget(null);
      setRefundReason("");
      setContactAttempts("3");
      refetch();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleSubmitRefund = () => {
    if (!refundTarget || !refundReason.trim()) return;
    flagJob.mutate({
      invitationId: refundTarget.invitationId,
      reason: refundReason.trim(),
      contactAttempts: parseInt(contactAttempts, 10),
    });
  };

  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/provider/dashboard">
            <button className="flex items-center gap-1.5 text-sm text-[#9B9B9B] hover:text-[#2C2C2C] transition-colors">
              <ArrowLeft size={14} /> Dashboard
            </button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#2C2C2C] tracking-tight">Billing</h1>
          <p className="text-sm text-[#9B9B9B] mt-1">Introduction fee history. Refund requests must be submitted within 7 days and require at least 3 documented contact attempts.</p>
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-16 bg-stone-100 rounded-xl" />)}
          </div>
        ) : !billing || (billing as any[]).length === 0 ? (
          <div className="bg-white rounded-xl border border-stone-200 p-10 text-center">
            <DollarSign size={32} className="text-stone-300 mx-auto mb-3" />
            <p className="text-sm text-[#9B9B9B]">No billing history yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(billing as any[]).map((fee: any) => {
              const paidAt = new Date(fee.paidAt);
              const daysSincePaid = (Date.now() - paidAt.getTime()) / (1000 * 60 * 60 * 24);
              const canFlag = daysSincePaid <= 7 && fee.status === "paid";
              return (
                <div key={fee.id} className="bg-white rounded-xl border border-stone-200 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-[#2C2C2C] mb-1">{fee.categoryName ?? `Job #${fee.invitationId}`}</div>
                      <div className="text-xs text-[#9B9B9B]">
                        {fee.suburb} · Paid {paidAt.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-[#2C2C2C]">${fee.amount}</span>
                      <span className={`text-xs font-medium px-2 py-1 rounded-sm ${
                        fee.status === "paid" ? "bg-green-50 text-green-700" :
                        fee.status === "refunded" ? "bg-blue-50 text-blue-700" :
                        fee.status === "dispute_pending" ? "bg-amber-50 text-amber-700" :
                        "bg-stone-100 text-stone-600"
                      }`}>{fee.status.replace(/_/g, " ")}</span>
                    </div>
                  </div>
                  {canFlag && (
                    <div className="mt-3 pt-3 border-t border-stone-50">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-md border-amber-200 text-amber-700 hover:bg-amber-50 text-xs"
                        onClick={() => setRefundTarget({ invitationId: fee.invitationId, categoryName: fee.categoryName ?? `Job #${fee.invitationId}` })}
                      >
                        <AlertTriangle size={11} className="mr-1.5" /> Request Refund
                      </Button>
                      <p className="text-xs text-[#9B9B9B] mt-1.5">
                        Available for {Math.max(0, Math.ceil(7 - daysSincePaid))} more days.
                      </p>
                    </div>
                  )}
                  {fee.status === "dispute_pending" && (
                    <div className="mt-3 pt-3 border-t border-stone-50">
                      <p className="text-xs text-amber-700 font-medium">Refund request under review.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Refund Request Dialog */}
      <Dialog open={!!refundTarget} onOpenChange={(open) => { if (!open) { setRefundTarget(null); setRefundReason(""); setContactAttempts("3"); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-[#2C2C2C]">Request Refund</DialogTitle>
            <DialogDescription className="text-sm text-[#9B9B9B]">
              {refundTarget?.categoryName} — You must have made at least 3 genuine contact attempts before requesting a refund.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm font-medium text-[#2C2C2C] mb-1.5 block">Number of contact attempts *</Label>
              <Select value={contactAttempts} onValueChange={setContactAttempts}>
                <SelectTrigger className="rounded-md border-stone-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 attempts</SelectItem>
                  <SelectItem value="4">4 attempts</SelectItem>
                  <SelectItem value="5">5 or more attempts</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-[#9B9B9B] mt-1">Minimum 3 required. Requests with fewer will be rejected.</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-[#2C2C2C] mb-1.5 block">Reason for refund request *</Label>
              <Textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="e.g. Called 3 times and sent 2 emails over 4 days — no response. Phone number appears disconnected."
                className="rounded-md border-stone-200 text-sm resize-none"
                rows={4}
              />
              <p className="text-xs text-[#9B9B9B] mt-1">Be specific. Include dates, methods, and outcomes of each attempt.</p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-md border-stone-200"
              onClick={() => { setRefundTarget(null); setRefundReason(""); setContactAttempts("3"); }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="rounded-md bg-[#2C2C2C] hover:bg-[#1a1a1a] text-white"
              disabled={!refundReason.trim() || flagJob.isPending}
              onClick={handleSubmitRefund}
            >
              {flagJob.isPending ? "Submitting…" : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PublicLayout>
  );
}
