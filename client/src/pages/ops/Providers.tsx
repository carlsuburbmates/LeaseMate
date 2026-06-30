import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PauseCircle, PlayCircle, ShieldCheck, RefreshCw } from "lucide-react";
import { OpsLayout } from "./OpsCenter";

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
  const approveProvider = trpc.ops.approveProvider.useMutation({
    onSuccess: () => { toast.success("Provider approved."); refetch(); },
    onError: (err: any) => toast.error(err.message),
  });
  const rejectProvider = trpc.ops.rejectProvider.useMutation({
    onSuccess: () => { toast.success("Provider held for manual review."); refetch(); },
    onError: (err: any) => toast.error(err.message),
  });
  const reevaluateProvider = trpc.ops.reevaluateProviderApproval.useMutation({
    onSuccess: () => { toast.success("Provider approval re-evaluated."); refetch(); },
    onError: (err: any) => toast.error(err.message),
  });

  const pendingProviders =
    (providers as any[] ?? []).filter((provider: any) => provider.status === "pending").length;

  return (
    <OpsLayout activeHref="/ops/providers">
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl font-semibold text-white">Provider Management</h1>
        <p className="text-sm text-white/40 mt-1">All registered providers. Pause, reactivate, approve, or hold as needed.</p>
        <p className="text-xs text-white/30 mt-2">{pendingProviders} provider{pendingProviders === 1 ? "" : "s"} currently pending approval.</p>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-white/5 rounded-lg" />)}
        </div>
      ) : (
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Business</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Approval</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Suburb</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Max/Wk</th>
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
                    <td className="px-4 py-3">
                      <div className="text-white/60 text-xs">
                        {p.eligibilityStatus?.replace(/_/g, " ") ?? "—"}
                      </div>
                      <div className="text-[11px] text-white/30 mt-1 max-w-[220px]">
                        {p.eligibilityChecks?.summary ?? p.rejectionReason ?? "No approval data yet."}
                      </div>
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
                      <div className="flex flex-wrap gap-2">
                        {p.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              className="rounded-md bg-green-600/80 hover:bg-green-600 text-white text-xs h-7"
                              onClick={() => approveProvider.mutate({ providerId: p.id })}
                            >
                              <ShieldCheck size={11} className="mr-1" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-md border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-xs h-7"
                              onClick={() => {
                                const reason = prompt("Reason for holding this provider for manual review:");
                                if (reason) rejectProvider.mutate({ providerId: p.id, reason });
                              }}
                            >
                              Hold
                            </Button>
                          </>
                        )}
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
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-md border-white/20 text-white/70 hover:bg-white/10 text-xs h-7"
                          onClick={() => reevaluateProvider.mutate({ providerId: p.id })}
                        >
                          <RefreshCw size={11} className="mr-1" /> Re-check
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(!providers || (providers as any[]).length === 0) && (
            <div className="py-12 text-center text-white/30 text-sm">No providers registered yet.</div>
          )}
        </div>
      )}
    </OpsLayout>
  );
}
