import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PublicLayout from "@/components/PublicLayout";
import { Link } from "wouter";
import { ArrowRight, Plus, Clock, CheckCircle2, AlertCircle } from "lucide-react";

const STATUS_COLOR: Record<string, string> = {
  Draft: "bg-stone-100 text-stone-600",
  Submitted: "bg-blue-50 text-blue-700",
  "In Progress": "bg-amber-50 text-amber-700",
  "Partially Arranged": "bg-amber-50 text-amber-700",
  "All Arranged": "bg-green-50 text-green-700",
  Cancelled: "bg-red-50 text-red-600",
  "Finding Providers": "bg-blue-50 text-blue-700",
  "Contacting Providers": "bg-blue-50 text-blue-700",
  "Provider Confirmed": "bg-green-50 text-green-700",
  "Provider Assigned": "bg-green-50 text-green-700",
  "Seeking Alternatives": "bg-amber-50 text-amber-700",
  "Under Review": "bg-orange-50 text-orange-700",
};

export default function CustomerDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const { data: requests, isLoading } = trpc.intake.myRequests.useQuery(undefined, { enabled: isAuthenticated });

  if (loading || isLoading) {
    return (
      <PublicLayout>
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-stone-100 rounded w-48" />
            <div className="h-32 bg-stone-100 rounded" />
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <PublicLayout>
        <div className="max-w-lg mx-auto px-6 py-24 text-center">
          <h1 className="text-2xl font-semibold text-[#2C2C2C] mb-3">Sign in to view your requests</h1>
          <p className="text-[#6B6B6B] mb-6">Your move-out requests are saved to your account.</p>
          <a href={getLoginUrl()}>
            <Button className="rounded-md bg-[#2C2C2C] hover:bg-[#1a1a1a] text-white">Sign In</Button>
          </a>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-semibold text-[#2C2C2C] tracking-tight">My Requests</h1>
            <p className="text-[#6B6B6B] mt-1">Welcome back, {user?.name?.split(" ")[0] ?? "there"}.</p>
          </div>
          <Link href="/move-out-cart">
            <Button className="rounded-md bg-[#2C2C2C] hover:bg-[#1a1a1a] text-white">
              <Plus size={14} className="mr-2" /> New Cart
            </Button>
          </Link>
        </div>

        {!requests || requests.length === 0 ? (
          <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-[#4A7C7E]/10 flex items-center justify-center mx-auto mb-4">
              <Plus size={20} className="text-[#4A7C7E]" />
            </div>
            <h2 className="text-lg font-semibold text-[#2C2C2C] mb-2">No requests yet</h2>
            <p className="text-[#6B6B6B] mb-6 text-sm">Build your first Move-Out Cart to get started.</p>
            <Link href="/move-out-cart">
              <Button className="rounded-md bg-[#2C2C2C] hover:bg-[#1a1a1a] text-white">
                Build My Move-Out Cart <ArrowRight size={14} className="ml-2" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req: any) => (
              <Link key={req.id} href={`/requests/${req.id}`}>
                <div className="bg-white rounded-xl border border-stone-200 p-5 hover:border-[#4A7C7E]/40 hover:shadow-sm transition-all cursor-pointer group">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-[#2C2C2C] mb-1">{req.propertySuburb} — {req.propertyType}</div>
                      <div className="text-xs text-[#9B9B9B]">
                        {req.bedrooms}bd · {req.bathrooms}ba
                        {req.moveOutDate && ` · Move-out ${new Date(req.moveOutDate).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-sm ${STATUS_COLOR[req.statusLabel] ?? "bg-stone-100 text-stone-600"}`}>
                        {req.statusLabel}
                      </span>
                      <ArrowRight size={14} className="text-stone-300 group-hover:text-[#4A7C7E] transition-colors" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
