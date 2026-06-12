import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { OpsLayout } from "./OpsCenter";

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
    <OpsLayout activeHref="/ops/audit">
      <div className="mb-6 md:mb-8">
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
            <div key={ev.id} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-3 border-b border-white/5 hover:bg-white/3 px-2 rounded transition-colors">
              <div className="text-xs text-white/20 font-mono sm:w-36 flex-shrink-0">
                {new Date(ev.createdAt).toLocaleString("en-AU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
              </div>
              <div className={`text-xs font-semibold sm:w-16 flex-shrink-0 ${ACTOR_COLOR[ev.actorType] ?? "text-white/40"}`}>
                {ev.actorType}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-mono text-white/40 mb-0.5 truncate">{ev.eventType}</div>
                <div className="text-sm text-white/70">{ev.description}</div>
              </div>
              <div className="text-xs text-white/20 font-mono flex-shrink-0">{ev.entityType} #{ev.entityId}</div>
            </div>
          ))}
          {(!events || (events as any[]).length === 0) && (
            <div className="py-12 text-center text-white/30 text-sm">No audit events yet.</div>
          )}
        </div>
      )}
    </OpsLayout>
  );
}
