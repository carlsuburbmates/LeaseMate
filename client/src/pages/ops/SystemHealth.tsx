import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { LayoutDashboard, FileText, Users, Activity, AlertTriangle, CheckCircle2, XCircle, Clock } from "lucide-react";

const OPS_NAV = [
  { href: "/ops", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ops/requests", label: "Requests", icon: FileText },
  { href: "/ops/exceptions", label: "Exceptions", icon: AlertTriangle },
  { href: "/ops/providers", label: "Providers", icon: Users },
  { href: "/ops/audit", label: "Audit Log", icon: Activity },
  { href: "/ops/health", label: "System Health", icon: Activity },
];

const TASK_STATUS_COLOR: Record<string, string> = {
  pending: "text-amber-400",
  running: "text-blue-400",
  completed: "text-green-400",
  failed: "text-red-400",
  retrying: "text-orange-400",
};

export default function OpsSystemHealth() {
  const { isAuthenticated } = useAuth();
  const { data: health } = trpc.ops.systemHealth.useQuery(undefined, { enabled: isAuthenticated, refetchInterval: 30000 });
  const { data: tasks, isLoading } = trpc.ops.automationTasks.useQuery(undefined, { enabled: isAuthenticated });

  const h = health as any;
  const isHealthy = h?.status === "healthy";

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
                item.href === "/ops/health" ? "bg-white/10 text-white" : "text-white/50 hover:text-white/80 hover:bg-white/5"
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
          <h1 className="text-xl font-semibold text-white">System Health</h1>
          <p className="text-sm text-white/40 mt-1">Automation task queue and platform status. Refreshes every 30s.</p>
        </div>

        {/* Status banner */}
        <div className={`rounded-xl border p-5 mb-8 flex items-center gap-4 ${
          isHealthy ? "bg-green-500/10 border-green-500/20" : "bg-amber-500/10 border-amber-500/20"
        }`}>
          {isHealthy ? (
            <CheckCircle2 size={20} className="text-green-400 flex-shrink-0" />
          ) : (
            <AlertTriangle size={20} className="text-amber-400 flex-shrink-0" />
          )}
          <div>
            <div className={`text-sm font-semibold ${isHealthy ? "text-green-400" : "text-amber-400"}`}>
              {isHealthy ? "All systems operational" : "Platform degraded — critical exceptions open"}
            </div>
            <div className="text-xs text-white/30 mt-0.5">
              {h?.criticalExceptions ?? 0} critical exceptions · Last checked {h?.timestamp ? new Date(h.timestamp).toLocaleTimeString("en-AU") : "—"}
            </div>
          </div>
        </div>

        {/* Automation tasks */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-3">Automation Task Queue</div>
          {isLoading ? (
            <div className="animate-pulse space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-white/5 rounded-lg" />)}
            </div>
          ) : (
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Task Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Entity</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Scheduled</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Retries</th>
                  </tr>
                </thead>
                <tbody>
                  {(tasks as any[] ?? []).map((t: any) => (
                    <tr key={t.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-white/60 font-mono text-xs">{t.taskType}</td>
                      <td className="px-4 py-3 text-white/40 text-xs">{t.entityType} #{t.entityId}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${TASK_STATUS_COLOR[t.status] ?? "text-white/40"}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/30 text-xs">
                        {t.scheduledAt ? new Date(t.scheduledAt).toLocaleString("en-AU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                      </td>
                      <td className="px-4 py-3 text-white/30 text-xs">{t.retryCount ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!tasks || (tasks as any[]).length === 0) && (
                <div className="py-12 text-center text-white/30 text-sm">No automation tasks in queue.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
