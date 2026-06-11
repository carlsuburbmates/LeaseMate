import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, MapPin, Calendar, Home, Package } from "lucide-react";

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
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="text-[#2C2C2C]/60">Loading request…</div>
      </div>
    );
  }

  if (error || !req) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#2C2C2C]/60 mb-4">Request not found.</p>
          <Link href="/ops/requests">
            <Button variant="outline" size="sm">Back to Requests</Button>
          </Link>
        </div>
      </div>
    );
  }

  const items = (req as any).items ?? [];

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* Header */}
      <div className="bg-[#1A2332] text-white px-8 py-4 flex items-center gap-4">
        <Link href="/ops/requests">
          <button className="text-white/60 hover:text-white flex items-center gap-2 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Requests
          </button>
        </Link>
        <Separator orientation="vertical" className="h-5 bg-white/20" />
        <span className="text-white/40 text-sm">Ops Center</span>
        <span className="text-white/40 text-sm">/</span>
        <span className="text-sm font-medium">Request #{req.id}</span>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-8 space-y-6">
        {/* Title row */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#2C2C2C]">Move Request #{req.id}</h1>
            <p className="text-[#2C2C2C]/50 text-sm mt-1">
              Submitted {new Date(req.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <Badge className={`${STATUS_COLORS[req.status] ?? "bg-slate-100 text-slate-700"} text-xs font-medium px-3 py-1 rounded`}>
            {req.status.replace(/_/g, " ")}
          </Badge>
        </div>

        {/* Property Details */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-[#2C2C2C] flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#4A7C7E]" />
              Property Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[#2C2C2C]/50 text-xs mb-1">Full Address</p>
              <p className="text-[#2C2C2C] font-medium">{req.propertyAddress}</p>
            </div>
            <div>
              <p className="text-[#2C2C2C]/50 text-xs mb-1">Suburb</p>
              <p className="text-[#2C2C2C]">{req.propertySuburb}</p>
            </div>
            <div>
              <p className="text-[#2C2C2C]/50 text-xs mb-1">Property Type</p>
              <p className="text-[#2C2C2C] capitalize">{req.propertyType}</p>
            </div>
            <div>
              <p className="text-[#2C2C2C]/50 text-xs mb-1">Size</p>
              <p className="text-[#2C2C2C]">{req.bedrooms} bed · {req.bathrooms} bath</p>
            </div>
            {req.accessNotes && (
              <div className="col-span-2">
                <p className="text-[#2C2C2C]/50 text-xs mb-1">Access Notes</p>
                <p className="text-[#2C2C2C]">{req.accessNotes}</p>
              </div>
            )}
            <div>
              <p className="text-[#2C2C2C]/50 text-xs mb-1">Move-Out Date</p>
              <p className="text-[#2C2C2C]">
                {req.moveOutDate ? new Date(req.moveOutDate).toLocaleDateString("en-AU") : "—"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Cart Items */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-[#2C2C2C] flex items-center gap-2">
              <Package className="w-4 h-4 text-[#4A7C7E]" />
              Cart Items ({items.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-[#2C2C2C]/40 text-sm">No cart items recorded.</p>
            ) : (
              <div className="space-y-3">
                {items.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between py-3 border-b border-[#E8E8E0] last:border-0">
                    <div>
                      <p className="text-sm font-medium text-[#2C2C2C]">Category #{item.categoryId}</p>
                      <p className="text-xs text-[#2C2C2C]/50 capitalize">{item.position} provider · Product #{item.productId}</p>
                    </div>
                    <Badge className={`text-xs ${
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
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-[#2C2C2C]">Update Status</CardTitle>
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
                  className="text-xs capitalize border-[#E8E8E0] hover:border-[#4A7C7E] hover:text-[#4A7C7E]"
                >
                  {s.replace(/_/g, " ")}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
