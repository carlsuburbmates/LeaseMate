import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import PublicLayout from "@/components/PublicLayout";
import { useParams, useLocation } from "wouter";
import { toast } from "sonner";
import { ArrowLeft, Clock, CheckCircle2, AlertCircle, XCircle } from "lucide-react";

const STATUS_ICON: Record<string, any> = {
  "All Arranged": CheckCircle2,
  "Provider Assigned": CheckCircle2,
  "Provider Confirmed": CheckCircle2,
  Cancelled: XCircle,
  "Under Review": AlertCircle,
};

const STATUS_COLOR: Record<string, string> = {
  "All Arranged": "text-green-600",
  "Provider Assigned": "text-green-600",
  "Provider Confirmed": "text-green-600",
  Cancelled: "text-red-500",
  "Under Review": "text-orange-500",
};

export default function RequestStatus() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const { data: req, isLoading, refetch } = trpc.intake.requestDetail.useQuery(
    { requestId: parseInt(id) },
    { enabled: isAuthenticated && !!id, refetchInterval: 30000 }
  );
  const cancelRequest = trpc.intake.cancelRequest.useMutation({
    onSuccess: () => { toast.success("Request cancelled."); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="max-w-3xl mx-auto px-6 py-20">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-stone-100 rounded w-64" />
            <div className="h-48 bg-stone-100 rounded" />
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!req) {
    return (
      <PublicLayout>
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <p className="text-[#6B6B6B]">Request not found.</p>
          <Button variant="outline" className="mt-4 rounded-md" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </PublicLayout>
    );
  }

  const StatusIcon = STATUS_ICON[req.statusLabel] ?? Clock;
  const statusColor = STATUS_COLOR[req.statusLabel] ?? "text-[#4A7C7E]";
  const canCancel = !["fulfilled", "cancelled", "All Arranged"].includes(req.statusLabel);

  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <button
          className="flex items-center gap-2 text-sm text-[#9B9B9B] hover:text-[#2C2C2C] mb-8 transition-colors"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </button>

        {/* Header */}
        <div className="bg-white rounded-xl border border-stone-200 p-6 mb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-[#2C2C2C] mb-1">
                {req.propertySuburb} — {(req.propertyType as string).charAt(0).toUpperCase() + (req.propertyType as string).slice(1)}
              </h1>
              <p className="text-sm text-[#9B9B9B]">
                {req.bedrooms}bd · {req.bathrooms}ba
                {req.moveOutDate && ` · Move-out ${new Date(req.moveOutDate as unknown as string).toLocaleDateString("en-AU", { day: "numeric", month: "long" })}`}
              </p>
            </div>
            <div className={`flex items-center gap-1.5 ${statusColor}`}>
              <StatusIcon size={16} />
              <span className="text-sm font-medium">{req.statusLabel}</span>
            </div>
          </div>
        </div>

        {/* Items */}
        {req.items && req.items.length > 0 && (
          <div className="bg-white rounded-xl border border-stone-200 p-6 mb-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-[#9B9B9B] mb-4">Services</div>
            <div className="space-y-3">
              {(req.items as any[]).map((item: any) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-stone-50 last:border-0">
                  <span className="text-sm text-[#2C2C2C]">{item.categoryName ?? `Service #${item.id}`}</span>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-sm ${
                    item.statusLabel === "Provider Assigned" || item.statusLabel === "Provider Confirmed"
                      ? "bg-green-50 text-green-700"
                      : item.statusLabel === "Cancelled"
                      ? "bg-red-50 text-red-600"
                      : "bg-blue-50 text-blue-700"
                  }`}>
                    {item.statusLabel}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Privacy note */}
        <div className="bg-[#F8F7F4] rounded-xl border border-stone-100 p-4 mb-6 text-xs text-[#9B9B9B] leading-relaxed">
          Your full address is only shared with a provider after they accept and pay the introduction fee. Status updates refresh every 30 seconds.
        </div>

        {/* Actions */}
        {canCancel && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              className="rounded-md border-red-200 text-red-600 hover:bg-red-50"
              disabled={cancelRequest.isPending}
              onClick={() => {
                if (confirm("Cancel this request? This cannot be undone.")) {
                  cancelRequest.mutate({ requestId: parseInt(id) });
                }
              }}
            >
              {cancelRequest.isPending ? "Cancelling…" : "Cancel Request"}
            </Button>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
