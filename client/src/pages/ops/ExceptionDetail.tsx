import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useParams } from "wouter";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Clock } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

const SEVERITY_COLOR: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  warning: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  informational: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

export default function OpsExceptionDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const { data: ex, isLoading, refetch } = trpc.ops.exceptionDetail.useQuery(
    { exceptionId: parseInt(id) },
    { enabled: isAuthenticated && !!id }
  );
  const { data: meta } = trpc.reference.exceptionMeta.useQuery();

  const resolveException = trpc.ops.resolveException.useMutation({
    onSuccess: () => { toast.success("Exception resolved."); refetch(); },
    onError: (err: any) => toast.error(err.message),
  });
  const approveRefund = trpc.ops.approveRefund.useMutation({
    onSuccess: () => { toast.success("Refund approved and issued."); refetch(); },
    onError: (err: any) => toast.error(err.message),
  });
  const rejectRefund = trpc.ops.rejectRefund.useMutation({
    onSuccess: () => { toast.success("Refund rejected."); refetch(); },
    onError: (err: any) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1C1C1E] flex items-center justify-center">
        <div className="text-white/40 text-sm">Loading…</div>
      </div>
    );
  }

  if (!ex) {
    return (
      <div className="min-h-screen bg-[#1C1C1E] flex items-center justify-center">
        <div className="text-white/40 text-sm">Exception not found.</div>
      </div>
    );
  }

  const e = ex as any;
  const exMeta = (meta as any)?.[e.code];

  return (
    <div className="min-h-screen bg-[#1C1C1E] text-white p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/ops">
          <button className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 mb-8 transition-colors">
            <ArrowLeft size={14} /> Back to Operations
          </button>
        </Link>

        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="text-xs font-mono text-white/30 mb-1">{e.code}</div>
            <h1 className="text-xl font-semibold text-white">{exMeta?.name ?? e.code}</h1>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded border ${SEVERITY_COLOR[e.severity] ?? "bg-white/10 text-white/60 border-white/10"}`}>
            {e.severity}
          </span>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-white/5 rounded-xl border border-white/10 p-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-white/30 text-xs mb-1">Affected Party</div>
                <div className="text-white/80">{e.affectedParty ?? exMeta?.affectedParty ?? "—"}</div>
              </div>
              <div>
                <div className="text-white/30 text-xs mb-1">Status</div>
                <div className={`font-medium ${e.status === "resolved" ? "text-green-400" : e.status === "open" ? "text-amber-400" : "text-white/60"}`}>
                  {e.status}
                </div>
              </div>
              <div>
                <div className="text-white/30 text-xs mb-1">Entity</div>
                <div className="text-white/60 font-mono text-xs">{e.entityType} #{e.entityId}</div>
              </div>
              <div>
                <div className="text-white/30 text-xs mb-1">Created</div>
                <div className="text-white/60 text-xs">{new Date(e.createdAt).toLocaleString("en-AU")}</div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl border border-white/10 p-5">
            <div className="text-xs text-white/30 mb-2">Description</div>
            <div className="text-sm text-white/80">{e.description}</div>
          </div>

          {exMeta && (
            <>
              <div className="bg-white/5 rounded-xl border border-white/10 p-5">
                <div className="text-xs text-white/30 mb-2">Prevention Strategy</div>
                <div className="text-sm text-white/70 leading-relaxed">{exMeta.prevention}</div>
              </div>
              <div className="bg-amber-500/10 rounded-xl border border-amber-500/20 p-5">
                <div className="text-xs text-amber-400/70 mb-2">Resolution Path</div>
                <div className="text-sm text-amber-200/80 leading-relaxed">{exMeta.resolution}</div>
              </div>
            </>
          )}

          {e.operatorNotes && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-5">
              <div className="text-xs text-white/30 mb-2">Operator Notes</div>
              <div className="text-sm text-white/70">{e.operatorNotes}</div>
            </div>
          )}
        </div>

        {/* Actions */}
        {e.status === "open" && (
          <div className="bg-white/5 rounded-xl border border-white/10 p-5">
            <div className="text-xs text-white/30 mb-4">Operator Actions</div>
            <div className="flex flex-wrap gap-3">
              <Button
                className="rounded-md bg-green-600 hover:bg-green-700 text-white text-sm"
                onClick={() => {
                  const notes = prompt("Add resolution notes (optional):");
                  resolveException.mutate({ exceptionId: e.id, action: "resolved", notes: notes ?? undefined });
                }}
              >
                <CheckCircle2 size={14} className="mr-2" /> Mark Resolved
              </Button>

              {e.code === "EX-13" && (
                <>
                  <Button
                    className="rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm"
                    onClick={() => approveRefund.mutate({ exceptionId: e.id, invitationId: e.entityId })}
                  >
                    Approve Refund
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-md border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm"
                    onClick={() => {
                      const reason = prompt("Reason for rejection:");
                      if (reason) rejectRefund.mutate({ exceptionId: e.id, reason });
                    }}
                  >
                    <XCircle size={14} className="mr-2" /> Reject Refund
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {e.status === "resolved" && (
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <CheckCircle2 size={16} />
            Resolved {e.resolvedAt ? new Date(e.resolvedAt).toLocaleString("en-AU") : ""}
          </div>
        )}
      </div>
    </div>
  );
}
