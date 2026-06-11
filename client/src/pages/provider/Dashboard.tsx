import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import PublicLayout from "@/components/PublicLayout";
import { Briefcase, Package, DollarSign, User, ArrowRight, Bell } from "lucide-react";

const NAV = [
  { href: "/provider/opportunities", label: "Opportunities", icon: Bell, desc: "View and respond to new job opportunities" },
  { href: "/provider/products", label: "Products", icon: Package, desc: "Manage your service listings" },
  { href: "/provider/billing", label: "Billing", icon: DollarSign, desc: "Introduction fee history and invoices" },
  { href: "/provider/profile", label: "Profile", icon: User, desc: "Update your business details and settings" },
];

export default function ProviderDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const { data: profile } = trpc.provider.myProfile.useQuery(undefined, { enabled: isAuthenticated });
  const { data: opportunities } = trpc.provider.myOpportunities.useQuery(undefined, { enabled: isAuthenticated });

  if (loading) return null;

  if (!isAuthenticated) {
    return (
      <PublicLayout>
        <div className="max-w-lg mx-auto px-6 py-24 text-center">
          <h1 className="text-2xl font-semibold text-[#2C2C2C] mb-3">Provider Dashboard</h1>
          <p className="text-[#6B6B6B] mb-6">Sign in to access your provider account.</p>
          <a href={getLoginUrl()}>
            <Button className="rounded-md bg-[#2C2C2C] hover:bg-[#1a1a1a] text-white">Sign In</Button>
          </a>
        </div>
      </PublicLayout>
    );
  }

  if (!profile) {
    return (
      <PublicLayout>
        <div className="max-w-lg mx-auto px-6 py-24 text-center">
          <Briefcase size={40} className="text-[#4A7C7E] mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-[#2C2C2C] mb-2">Set up your provider profile</h1>
          <p className="text-[#6B6B6B] mb-6">Complete your profile to start receiving job opportunities.</p>
          <Link href="/provider-signup">
            <Button className="rounded-md bg-[#2C2C2C] hover:bg-[#1a1a1a] text-white">Create Provider Profile</Button>
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const pendingCount = (opportunities as any[])?.filter((o: any) => o.status === "pending").length ?? 0;

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-10">
          <div className="text-xs font-semibold uppercase tracking-widest text-[#4A7C7E] mb-2">Provider Dashboard</div>
          <h1 className="text-3xl font-semibold text-[#2C2C2C] tracking-tight">{(profile as any).businessName}</h1>
          <p className="text-[#9B9B9B] text-sm mt-1">
            Status: <span className={`font-medium ${(profile as any).status === "active" ? "text-green-600" : "text-amber-600"}`}>{(profile as any).status}</span>
            {" · "}Max {(profile as any).maxJobsPerWeek} jobs/week
          </p>
        </div>

        {pendingCount > 0 && (
          <div className="bg-[#4A7C7E]/10 border border-[#4A7C7E]/20 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell size={16} className="text-[#4A7C7E]" />
              <span className="text-sm font-medium text-[#2C2C2C]">
                {pendingCount} new {pendingCount === 1 ? "opportunity" : "opportunities"} waiting for your response
              </span>
            </div>
            <Link href="/provider/opportunities">
              <Button size="sm" className="rounded-md bg-[#4A7C7E] hover:bg-[#3d6a6c] text-white">
                View <ArrowRight size={12} className="ml-1" />
              </Button>
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className="bg-white rounded-xl border border-stone-200 p-6 hover:border-[#4A7C7E]/40 hover:shadow-sm transition-all cursor-pointer group">
                <div className="w-10 h-10 rounded-lg bg-[#4A7C7E]/10 flex items-center justify-center mb-4">
                  <item.icon size={18} className="text-[#4A7C7E]" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-base font-semibold text-[#2C2C2C]">{item.label}</div>
                    <div className="text-sm text-[#9B9B9B] mt-0.5">{item.desc}</div>
                  </div>
                  <ArrowRight size={14} className="text-stone-300 group-hover:text-[#4A7C7E] transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
