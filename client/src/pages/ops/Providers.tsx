import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { toast } from "sonner";
import { LayoutDashboard, FileText, Users, Activity, AlertTriangle, PauseCircle, PlayCircle } from "lucide-react";

const OPS_NAV = [
  { href: "/ops", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ops/requests", label: "Requests", icon: FileText },
  { href: "/ops/exceptions", label: "Exceptions", icon: AlertTriangle },
  { href: "/ops/providers", label: "Providers", icon: Users },
  { href: "/ops/audit", label: "Audit Log", icon: Activity },
  { href: "/ops/health", label: "System Health", icon: Activity },
];

export default function OpsProviders() {
  const { isAuthenticated } = useAuth();
  const { data: providers, isLoading, refetch } = trpc.ops.allProviders.useQuery(undefined, { enabled: isAuthenticated });

  const pauseProvider = trpc.ops.pauseProvider.useMutation({
    onSuccess: () => { toast.success("Provider paused."); refetch(); },
    onError: (err: any) => toast.error(err.message),
  });
  const reactivateProvider = trpc.ops.reactivateProvider.useMutation({
    onSuccess: () => { toast.success("Provider reactivated."); refetch(); },
    onError: (err: any) => toast.error(err.message),
  });

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
                item.href === "/ops/providers" ? "bg-white/10 text-white" : "text-white/50 hover:text-white/80 hover:bg-white/5"
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
          <h1 className="text-xl font-semibold text-white">Provider Management</h1>
          <p className="text-sm text-white/40 mt-1">All registered providers. Pause or reactivate as needed.</p>
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-16 bg-white/5 rounded-lg" />)}
          </div>
        ) : (
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Business</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Suburb</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Max Jobs/Wk</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(providers as any[] ?? []).map((p: any) => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-white/80 font-medium">{p.businessName}</div>
                      <div className="text-xs text-white/30">{p.contactEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-white/50">{p.suburb ?? "—"}</td>
                    <td className="px-4 py-3 text-white/50">{p.maxJobsPerWeek}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-sm ${
                        p.status === "active" ? "bg-green-500/20 text-green-400" :
                        p.status === "paused" ? "bg-amber-500/20 text-amber-400" :
                        "bg-white/10 text-white/40"
                      }`}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      {p.status === "active" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-md border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-xs h-7"
                          onClick={() => {
                            const reason = prompt("Reason for pausing this provider:");
                            if (reason) pauseProvider.mutate({ providerId: p.id, reason });
                          }}
                        >
                          <PauseCircle size={11} className="mr-1" /> Pause
                        </Button>
                      ) : p.status === "paused" ? (
                        <Button
                          size="sm"
                          className="rounded-md bg-green-600/80 hover:bg-green-600 text-white text-xs h-7"
                          onClick={() => reactivateProvider.mutate({ providerId: p.id })}
                        >
                          <PlayCircle size={11} className="mr-1" /> Reactivate
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!providers || (providers as any[]).length === 0) && (
              <div className="py-12 text-center text-white/30 text-sm">No providers registered yet.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
