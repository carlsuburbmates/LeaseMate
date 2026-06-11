import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { toast } from "sonner";
import { ArrowLeft, DollarSign, AlertTriangle } from "lucide-react";

export default function ProviderBilling() {
  const { isAuthenticated } = useAuth();
  const { data: billing, isLoading, refetch } = trpc.provider.billingHistory.useQuery(undefined, { enabled: isAuthenticated });
  const flagJob = trpc.provider.flagJob.useMutation({
    onSuccess: () => { toast.success("Refund request submitted. Our team will review within 2 business days."); refetch(); },
    onError: (err: any) => toast.error(err.message),
  });

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
          <p className="text-sm text-[#9B9B9B] mt-1">Introduction fee history. Refund requests must be submitted within 7 days.</p>
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
                        "bg-stone-100 text-stone-600"
                      }`}>{fee.status}</span>
                    </div>
                  </div>
                  {canFlag && (
                    <div className="mt-3 pt-3 border-t border-stone-50">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-md border-amber-200 text-amber-700 hover:bg-amber-50 text-xs"
                        onClick={() => {
                          const reason = prompt("Briefly describe why you are requesting a refund (e.g. customer uncontactable after 3 attempts):");
                          if (reason) flagJob.mutate({ invitationId: fee.invitationId, reason, contactAttempts: 3 });
                        }}
                      >
                        <AlertTriangle size={11} className="mr-1.5" /> Request Refund
                      </Button>
                      <p className="text-xs text-[#9B9B9B] mt-1.5">Available for {Math.max(0, Math.ceil(7 - daysSincePaid))} more days. Requires 3 documented contact attempts.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
