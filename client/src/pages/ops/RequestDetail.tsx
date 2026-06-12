import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MapPin, Package } from "lucide-react";
import { OpsLayout } from "./OpsCenter";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  submitted: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  partially_fulfilled: "bg-orange-100 text-orange-700",
  fulfilled: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function OpsRequestDetail() {
  const params = useParams<{ id: string }>();
  const requestId = parseInt(params.id ?? "0", 10);

  const { data: req, isLoading, error } = trpc.ops.requestDetail.useQuery(
    { requestId },
    { enabled: requestId > 0 }
  );

  const utils = trpc.useUtils();
  const updateStatus = trpc.ops.updateRequestStatus.useMutation({
    onSuccess: () => utils.ops.requestDetail.invalidate({ requestId }),
  });

  if (isLoading) {
    return (
      <OpsLayout activeHref="/ops/requests">
        <div className="flex items-center justify-center py-24">
          <div className="text-white/40 text-sm">Loading request…</div>
        </div>
      </OpsLayout>
    );
  }

  if (error || !req) {
    return (
      <OpsLayout activeHref="/ops/requests">
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <p className="text-white/40 mb-4">Request not found.</p>
            <Link href="/ops/requests">
              <Button variant="outline" size="sm" className="border-white/20 text-white/60">Back to Requests</Button>
            </Link>
          </div>
        </div>
      </OpsLayout>
    );
  }

  const items = (req as any).items ?? [];

  return (
    <OpsLayout activeHref="/ops/requests">
      <div className="max-w-3xl mx-auto">
        <Link href="/ops/requests">
          <button className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 mb-6 transition-colors">
            <ArrowLeft size={14} /> Back to Requests
          </button>
        </Link>

        {/* Title row */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-white">Move Request #{req.id}</h1>
            <p className="text-white/40 text-sm mt-1">
              Submitted {new Date(req.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <Badge className={`${STATUS_COLORS[req.status] ?? "bg-slate-100 text-slate-700"} text-xs font-medium px-3 py-1 rounded flex-shrink-0`}>
            {req.status.replace(/_/g, " ")}
          </Badge>
        </div>

        <div className="space-y-4">
          {/* Property Details */}
          <Card className="border-white/10 bg-white/5 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#4A7C7E]" />
                Property Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-white/30 text-xs mb-1">Full Address</p>
                <p className="text-white/80 font-medium">{req.propertyAddress}</p>
              </div>
              <div>
                <p className="text-white/30 text-xs mb-1">Suburb</p>
                <p className="text-white/70">{req.propertySuburb}</p>
              </div>
              <div>
                <p className="text-white/30 text-xs mb-1">Property Type</p>
                <p className="text-white/70 capitalize">{req.propertyType}</p>
              </div>
              <div>
                <p className="text-white/30 text-xs mb-1">Size</p>
                <p className="text-white/70">{req.bedrooms} bed · {req.bathrooms} bath</p>
              </div>
              {req.accessNotes && (
                <div className="col-span-full">
                  <p className="text-white/30 text-xs mb-1">Access Notes</p>
                  <p className="text-white/70">{req.accessNotes}</p>
                </div>
              )}
              <div>
                <p className="text-white/30 text-xs mb-1">Move-Out Date</p>
                <p className="text-white/70">
                  {req.moveOutDate ? new Date(req.moveOutDate).toLocaleDateString("en-AU") : "—"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Cart Items */}
          <Card className="border-white/10 bg-white/5 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-[#4A7C7E]" />
                Cart Items ({items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <p className="text-white/30 text-sm">No cart items recorded.</p>
              ) : (
                <div className="space-y-3">
                  {items.map((item: any) => (
                    <div key={item.id} className="flex items-start sm:items-center justify-between gap-3 py-3 border-b border-white/10 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-white/80">Category #{item.categoryId}</p>
                        <p className="text-xs text-white/40 capitalize">{item.position} provider · Product #{item.productId}</p>
                      </div>
                      <Badge className={`text-xs flex-shrink-0 ${
                        item.status === "provider_accepted" ? "bg-emerald-100 text-emerald-700" :
                        item.status === "details_released" ? "bg-blue-100 text-blue-700" :
                        item.status === "all_declined" ? "bg-red-100 text-red-700" :
                        "bg-slate-100 text-slate-700"
                      }`}>
                        {item.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Update */}
          <Card className="border-white/10 bg-white/5 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-white">Update Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(["submitted", "in_progress", "partially_fulfilled", "fulfilled", "cancelled"] as const).map(s => (
                  <Button
                    key={s}
                    variant="outline"
                    size="sm"
                    disabled={req.status === s || updateStatus.isPending}
                    onClick={() => updateStatus.mutate({ requestId: req.id, status: s })}
                    className="text-xs capitalize border-white/20 text-white/60 hover:border-[#4A7C7E] hover:text-[#4A7C7E] bg-transparent"
                  >
                    {s.replace(/_/g, " ")}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </OpsLayout>
  );
}
