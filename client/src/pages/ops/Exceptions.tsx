import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { AlertTriangle, ArrowRight, CheckCircle2, LayoutDashboard, FileText, Users, Activity } from "lucide-react";

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

export default function OpsExceptions() {
  const { isAuthenticated } = useAuth();
  const { data: exceptions, isLoading } = trpc.ops.allExceptions.useQuery({ limit: 200 }, { enabled: isAuthenticated });

  const open = (exceptions as any[] ?? []).filter((e: any) => e.status === "open");
  const resolved = (exceptions as any[] ?? []).filter((e: any) => e.status !== "open");

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
                item.href === "/ops/exceptions" ? "bg-white/10 text-white" : "text-white/50 hover:text-white/80 hover:bg-white/5"
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">Exceptions</h1>
            <p className="text-sm text-white/40 mt-1">All 13 exception types. Open items require operator action.</p>
          </div>
          {open.length > 0 && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <AlertTriangle size={14} className="text-red-400" />
              <span className="text-sm font-semibold text-red-400">{open.length} open</span>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-16 bg-white/5 rounded-lg" />)}
          </div>
        ) : (
          <>
            {open.length > 0 && (
              <div className="mb-8">
                <div className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-3">Open — Requires Action</div>
                <div className="space-y-2">
                  {open.map((e: any) => (
                    <Link key={e.id} href={`/ops/exceptions/${e.id}`}>
                      <div className="bg-white/5 hover:bg-white/8 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4 cursor-pointer transition-colors">
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded border ${SEVERITY_COLOR[e.severity] ?? "bg-white/10 text-white/50 border-white/10"}`}>
                            {e.code}
                          </span>
                          <div>
                            <div className="text-sm font-medium text-white/80">{e.description}</div>
                            <div className="text-xs text-white/30 mt-0.5">{e.affectedParty} · {new Date(e.createdAt).toLocaleString("en-AU")}</div>
                          </div>
                        </div>
                        <ArrowRight size={14} className="text-white/30 flex-shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {open.length === 0 && (
              <div className="bg-white/5 rounded-xl border border-white/10 p-10 text-center mb-8">
                <CheckCircle2 size={28} className="text-green-400/50 mx-auto mb-3" />
                <p className="text-sm text-white/40">No open exceptions. All clear.</p>
              </div>
            )}

            {resolved.length > 0 && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-3">Resolved</div>
                <div className="space-y-2">
                  {resolved.slice(0, 20).map((e: any) => (
                    <Link key={e.id} href={`/ops/exceptions/${e.id}`}>
                      <div className="bg-white/3 border border-white/5 rounded-xl p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-white/30 px-2 py-0.5 rounded border border-white/10">{e.code}</span>
                          <div>
                            <div className="text-sm text-white/50">{e.description}</div>
                            <div className="text-xs text-white/20 mt-0.5">{e.affectedParty}</div>
                          </div>
                        </div>
                        <span className="text-xs text-green-400/60 flex-shrink-0">Resolved</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
