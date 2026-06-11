import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { LayoutDashboard, FileText, Users, Activity, AlertTriangle, ArrowRight, Clock, CheckCircle2, XCircle } from "lucide-react";

const OPS_NAV = [
  { href: "/ops", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ops/requests", label: "Requests", icon: FileText },
  { href: "/ops/providers", label: "Providers", icon: Users },
  { href: "/ops/audit", label: "Audit Log", icon: Activity },
  { href: "/ops/health", label: "System Health", icon: Activity },
];

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-stone-100 text-stone-600",
  submitted: "bg-blue-50 text-blue-700",
  matching: "bg-amber-50 text-amber-700",
  partially_fulfilled: "bg-amber-50 text-amber-700",
  fulfilled: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-600",
  exception: "bg-orange-50 text-orange-700",
};

export default function OpsRequests() {
  const { isAuthenticated } = useAuth();
  const { data: requests, isLoading } = trpc.ops.allRequests.useQuery({ limit: 100 }, { enabled: isAuthenticated });

  return (
    <div className="min-h-screen bg-[#1C1C1E] text-white flex">
      {/* Sidebar */}
      <div className="w-56 flex-shrink-0 border-r border-white/5 p-4">
        <div className="mb-8 px-2">
          <div className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-1">LeaseMate</div>
          <div className="text-sm font-semibold text-white/80">Operations</div>
        </div>
        <nav className="space-y-1">
          {OPS_NAV.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                item.href === "/ops/requests" ? "bg-white/10 text-white" : "text-white/50 hover:text-white/80 hover:bg-white/5"
              }`}>
                <item.icon size={14} />
                {item.label}
              </div>
            </Link>
          ))}
        </nav>
      </div>

      {/* Main */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-white">All Requests</h1>
          <p className="text-sm text-white/40 mt-1">Full move-out request pipeline.</p>
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-2">
            {[1,2,3,4].map(i => <div key={i} className="h-14 bg-white/5 rounded-lg" />)}
          </div>
        ) : (
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Suburb</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Submitted</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody>
                {(requests as any[] ?? []).map((req: any) => (
                  <tr key={req.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-white/60 font-mono text-xs">#{req.id}</td>
                    <td className="px-4 py-3 text-white/80">{req.propertySuburb}</td>
                    <td className="px-4 py-3 text-white/60 capitalize">{req.propertyType} · {req.bedrooms}bd</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-sm ${STATUS_BADGE[req.status] ?? "bg-stone-100 text-stone-600"}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/40 text-xs">
                      {new Date(req.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/ops/requests/${req.id}`}>
                        <button className="text-white/30 hover:text-white/70 transition-colors">
                          <ArrowRight size={14} />
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!requests || (requests as any[]).length === 0) && (
              <div className="py-12 text-center text-white/30 text-sm">No requests yet.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
