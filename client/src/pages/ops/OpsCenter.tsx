import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { LayoutDashboard, FileText, Users, Activity, AlertTriangle, ArrowRight, CheckCircle2, TrendingUp, Zap } from "lucide-react";

const OPS_NAV = [
  { href: "/ops", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ops/requests", label: "Requests", icon: FileText },
  { href: "/ops/exceptions", label: "Exceptions", icon: AlertTriangle },
  { href: "/ops/providers", label: "Providers", icon: Users },
  { href: "/ops/audit", label: "Audit Log", icon: Activity },
  { href: "/ops/health", label: "System Health", icon: Activity },
];

const SEVERITY_COLOR: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  warning: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  informational: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

export default function OpsCenter() {
  const { isAuthenticated } = useAuth();
  const { data: stats, isLoading: statsLoading } = trpc.ops.dashboard.useQuery(undefined, { enabled: isAuthenticated });
  const { data: criticalExceptions } = trpc.ops.criticalExceptions.useQuery(undefined, { enabled: isAuthenticated });
  const { data: health } = trpc.ops.systemHealth.useQuery(undefined, { enabled: isAuthenticated });

  const s = stats as any;
  const ce = criticalExceptions as any[] ?? [];

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
                item.href === "/ops" ? "bg-white/10 text-white" : "text-white/50 hover:text-white/80 hover:bg-white/5"
              }`}>
                <item.icon size={14} />
                {item.label}
                {item.href === "/ops/exceptions" && ce.length > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">{ce.length}</span>
                )}
              </div>
            </Link>
          ))}
        </nav>

        <div className="mt-8 px-2">
          <div className={`flex items-center gap-2 text-xs ${(health as any)?.status === "healthy" ? "text-green-400" : "text-amber-400"}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${(health as any)?.status === "healthy" ? "bg-green-400" : "bg-amber-400"}`} />
            {(health as any)?.status === "healthy" ? "All systems normal" : "Degraded"}
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-white">Operations Center</h1>
          <p className="text-sm text-white/40 mt-1">Pipeline overview and exception management.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Requests", value: s?.totalRequests ?? "—", icon: FileText, color: "text-white" },
            { label: "Active Requests", value: s?.activeRequests ?? "—", icon: TrendingUp, color: "text-blue-400" },
            { label: "Open Exceptions", value: s?.openExceptions ?? "—", icon: AlertTriangle, color: s?.openExceptions > 0 ? "text-red-400" : "text-green-400" },
            { label: "Active Providers", value: s?.activeProviders ?? "—", icon: Users, color: "text-[#4A7C7E]" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/5 rounded-xl border border-white/10 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs text-white/30 font-medium">{stat.label}</div>
                <stat.icon size={14} className="text-white/20" />
              </div>
              <div className={`text-2xl font-semibold ${stat.color}`}>{statsLoading ? "—" : stat.value}</div>
            </div>
          ))}
        </div>

        {/* Critical Exceptions */}
        {ce.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={14} className="text-red-400" />
              <div className="text-xs font-semibold uppercase tracking-widest text-red-400">Critical — Immediate Action Required</div>
            </div>
            <div className="space-y-2">
              {ce.map((e: any) => (
                <Link key={e.id} href={`/ops/exceptions/${e.id}`}>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-red-500/15 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-semibold text-red-400 bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30">{e.code}</span>
                      <div>
                        <div className="text-sm font-medium text-white/80">{e.description}</div>
                        <div className="text-xs text-white/30 mt-0.5">{e.affectedParty}</div>
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-red-400/60 flex-shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { href: "/ops/requests", label: "View All Requests", desc: "Full pipeline", icon: FileText },
            { href: "/ops/exceptions", label: "Exception Queue", desc: "All 13 types", icon: AlertTriangle },
            { href: "/ops/providers", label: "Provider Management", desc: "Pause, reactivate", icon: Users },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <div className="bg-white/5 hover:bg-white/8 border border-white/10 rounded-xl p-5 cursor-pointer transition-colors">
                <item.icon size={18} className="text-white/30 mb-3" />
                <div className="text-sm font-semibold text-white/80">{item.label}</div>
                <div className="text-xs text-white/30 mt-1">{item.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
