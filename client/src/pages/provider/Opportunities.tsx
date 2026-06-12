import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import PublicLayout from "@/components/PublicLayout";
import { Link } from "wouter";
import { toast } from "sonner";
import { ArrowLeft, Clock, MapPin, Home, CheckCircle2, XCircle, CreditCard, Unlock } from "lucide-react";
import { useState, useEffect } from "react";

function Countdown({ expiresAt }: { expiresAt: Date }) {
  const [remaining, setRemaining] = useState("");
  useEffect(() => {
    const tick = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setRemaining("Expired"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setRemaining(`${h}h ${m}m remaining`);
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [expiresAt]);
  const urgent = new Date(expiresAt).getTime() - Date.now() < 6 * 3600000;
  return <span className={`text-xs font-medium ${urgent ? "text-red-500" : "text-amber-600"}`}><Clock size={11} className="inline mr-1" />{remaining}</span>;
}

export default function ProviderOpportunities() {
  const { isAuthenticated } = useAuth();
  const { data: opportunities, isLoading, refetch } = trpc.provider.myOpportunities.useQuery(undefined, { enabled: isAuthenticated });
  const [checkoutLoading, setCheckoutLoading] = useState<number | null>(null);

  const acceptOpp = trpc.provider.acceptOpportunity.useMutation({
    onSuccess: (_, vars) => {
      toast.success("Opportunity accepted. Proceeding to payment…");
      refetch();
      // Immediately trigger checkout after accepting
      handlePayNow(vars.invitationId);
    },
    onError: (err) => toast.error(err.message),
  });

  const createCheckout = trpc.provider.createCheckoutSession.useMutation({
    onError: (err) => {
      toast.error(err.message);
      setCheckoutLoading(null);
    },
  });

  const declineOpp = trpc.provider.declineOpportunity.useMutation({
    onSuccess: () => { toast.success("Opportunity declined."); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const handlePayNow = async (invitationId: number) => {
    setCheckoutLoading(invitationId);
    try {
      const result = await createCheckout.mutateAsync({
        invitationId,
        origin: window.location.origin,
      });
      // Redirect to Stripe Checkout
      window.location.href = result.url;
    } catch {
      // Error handled by onError above
      setCheckoutLoading(null);
    }
  };

  const pending = (opportunities as any[])?.filter((o: any) => o.status === "pending") ?? [];
  const accepted = (opportunities as any[])?.filter((o: any) => o.status === "accepted" && o.feeStatus !== "paid") ?? [];
  const past = (opportunities as any[])?.filter((o: any) =>
    o.status === "declined" || o.status === "expired" || o.status === "cancelled" || o.feeStatus === "paid"
  ) ?? [];

  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/provider/dashboard">
            <button className="flex items-center gap-1.5 text-sm text-[#9B9B9B] hover:text-[#2C2C2C] transition-colors">
              <ArrowLeft size={14} /> Dashboard
            </button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#2C2C2C] tracking-tight">Opportunities</h1>
          <p className="text-sm text-[#9B9B9B] mt-1">Review and respond within 48 hours. Full address released after payment.</p>
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {[1,2].map(i => <div key={i} className="h-32 bg-stone-100 rounded-xl" />)}
          </div>
        ) : (
          <>
            {/* Pending opportunities */}
            {pending.length > 0 && (
              <div className="space-y-3 mb-10">
                <div className="text-xs font-semibold uppercase tracking-widest text-[#9B9B9B] mb-3">Awaiting Response</div>
                {pending.map((opp: any) => (
                  <div key={opp.id} className="bg-white rounded-xl border border-stone-200 p-5">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="text-sm font-semibold text-[#2C2C2C] mb-1">{opp.categoryName ?? "Service"}</div>
                        <div className="flex items-center gap-3 text-xs text-[#9B9B9B]">
                          <span className="flex items-center gap-1"><MapPin size={11} />{opp.propertySuburb ?? "Melbourne"}</span>
                          {opp.propertyType && <span className="flex items-center gap-1"><Home size={11} />{opp.propertyType}{opp.bedrooms ? ` · ${opp.bedrooms}bd` : ""}{opp.bathrooms ? ` ${opp.bathrooms}ba` : ""}</span>}
                        </div>
                      </div>
                      {opp.expiresAt && <Countdown expiresAt={opp.expiresAt} />}
                    </div>

                    <div className="bg-[#F8F7F4] rounded-lg p-3 mb-4 text-xs text-[#6B6B6B]">
                      <span className="font-medium text-[#9B9B9B]">Full address hidden</span> — released immediately after you accept and pay the introduction fee.
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-[#2C2C2C]">
                        Introduction fee: <span className="text-[#4A7C7E]">{opp.feeAmount ? `$${opp.feeAmount}` : "—"}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-md border-stone-200 text-[#6B6B6B] text-xs"
                          disabled={declineOpp.isPending}
                          onClick={() => declineOpp.mutate({ invitationId: opp.id })}
                        >
                          <XCircle size={12} className="mr-1" /> Decline
                        </Button>
                        <Button
                          size="sm"
                          className="rounded-md bg-[#4A7C7E] hover:bg-[#3d6a6c] text-white text-xs"
                          disabled={acceptOpp.isPending || checkoutLoading === opp.id}
                          onClick={() => acceptOpp.mutate({ invitationId: opp.id })}
                        >
                          <CreditCard size={12} className="mr-1" />
                          {checkoutLoading === opp.id ? "Redirecting…" : "Accept & Pay"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Accepted but not yet paid */}
            {accepted.length > 0 && (
              <div className="space-y-3 mb-10">
                <div className="text-xs font-semibold uppercase tracking-widest text-[#9B9B9B] mb-3">Accepted — Payment Pending</div>
                {accepted.map((opp: any) => (
                  <div key={opp.id} className="bg-white rounded-xl border border-amber-200 p-5">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="text-sm font-semibold text-[#2C2C2C] mb-1">{opp.categoryName ?? "Service"}</div>
                        <div className="flex items-center gap-3 text-xs text-[#9B9B9B]">
                          <span className="flex items-center gap-1"><MapPin size={11} />{opp.propertySuburb ?? "Melbourne"}</span>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-sm">Payment required</span>
                    </div>

                    <div className="bg-amber-50 rounded-lg p-3 mb-4 text-xs text-amber-700">
                      Your acceptance is confirmed. Pay the introduction fee to unlock the customer's full address and contact details.
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-[#2C2C2C]">
                        Introduction fee: <span className="text-[#4A7C7E]">{opp.feeAmount ? `$${opp.feeAmount}` : "—"}</span>
                      </div>
                      <Button
                        size="sm"
                        className="rounded-md bg-[#4A7C7E] hover:bg-[#3d6a6c] text-white text-xs"
                        disabled={checkoutLoading === opp.id}
                        onClick={() => handlePayNow(opp.id)}
                      >
                        <CreditCard size={12} className="mr-1" />
                        {checkoutLoading === opp.id ? "Redirecting…" : "Pay Introduction Fee"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {pending.length === 0 && accepted.length === 0 && (
              <div className="bg-white rounded-xl border border-stone-200 p-10 text-center mb-10">
                <CheckCircle2 size={32} className="text-stone-300 mx-auto mb-3" />
                <p className="text-sm text-[#9B9B9B]">No pending opportunities. Check back soon.</p>
              </div>
            )}
          </>
        )}

        {past.length > 0 && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-[#9B9B9B] mb-3">Past Opportunities</div>
            <div className="space-y-2">
              {past.map((opp: any) => (
                <div key={opp.id} className="bg-white rounded-xl border border-stone-100 p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-[#2C2C2C]">{opp.categoryName ?? "Service"}</div>
                    <div className="text-xs text-[#9B9B9B]">{opp.propertySuburb ?? "Melbourne"} · {opp.propertyType ?? ""}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {opp.feeStatus === "paid" && (
                      <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-sm">
                        <Unlock size={10} /> Address released
                      </span>
                    )}
                    <span className={`text-xs font-medium px-2 py-1 rounded-sm ${
                      opp.status === "accepted" ? "bg-green-50 text-green-700" :
                      opp.status === "declined" ? "bg-red-50 text-red-600" :
                      "bg-stone-100 text-stone-600"
                    }`}>{opp.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
