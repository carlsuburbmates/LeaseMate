import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { LayoutDashboard, FileText, Users, Activity, AlertTriangle } from "lucide-react";

const OPS_NAV = [
  { href: "/ops", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ops/requests", label: "Requests", icon: FileText },
  { href: "/ops/exceptions", label: "Exceptions", icon: AlertTriangle },
  { href: "/ops/providers", label: "Providers", icon: Users },
  { href: "/ops/audit", label: "Audit Log", icon: Activity },
  { href: "/ops/health", label: "System Health", icon: Activity },
];

const ACTOR_COLOR: Record<string, string> = {
  customer: "text-blue-400",
  provider: "text-[#4A7C7E]",
  operator: "text-purple-400",
  system: "text-white/30",
};

export default function OpsAuditLog() {
  const { isAuthenticated } = useAuth();
  const { data: events, isLoading } = trpc.ops.auditLog.useQuery({ limit: 200 }, { enabled: isAuthenticated });

  return (
    <div className="min-h-screen bg-[#1C1C1E] text-white flex">
      <div className="w-56 flex-shrink-0 border-r border-white/5 p-4">
        <div className="mb-8 px-2">
          <div className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-1">LeaseMate</div>
          <div className="text-sm font-semibold text-white/80">Operations</div>
        </div>
        <nav className="space-y-1">
          {OPS_NAV.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                item.href === "/ops/audit" ? "bg-white/10 text-white" : "text-white/50 hover:text-white/80 hover:bg-white/5"
              }`}>
                <item.icon size={14} />
                {item.label}
              </div>
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex-1 p-8 overflow-auto">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-white">Audit Log</h1>
          <p className="text-sm text-white/40 mt-1">Immutable record of all platform events. Most recent first.</p>
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-2">
            {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-white/5 rounded-lg" />)}
          </div>
        ) : (
          <div className="space-y-1">
            {(events as any[] ?? []).map((ev: any) => (
              <div key={ev.id} className="flex items-start gap-4 py-3 border-b border-white/5 hover:bg-white/3 px-2 rounded transition-colors">
                <div className="text-xs text-white/20 font-mono w-36 flex-shrink-0 pt-0.5">
                  {new Date(ev.createdAt).toLocaleString("en-AU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </div>
                <div className={`text-xs font-semibold w-16 flex-shrink-0 pt-0.5 ${ACTOR_COLOR[ev.actorType] ?? "text-white/40"}`}>
                  {ev.actorType}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-mono text-white/40 mb-0.5">{ev.eventType}</div>
                  <div className="text-sm text-white/70">{ev.description}</div>
                </div>
                <div className="text-xs text-white/20 font-mono flex-shrink-0 pt-0.5">{ev.entityType} #{ev.entityId}</div>
              </div>
            ))}
            {(!events || (events as any[]).length === 0) && (
              <div className="py-12 text-center text-white/30 text-sm">No audit events yet.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
