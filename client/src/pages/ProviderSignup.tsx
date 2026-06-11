import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const BIG_6 = ["Removalist", "End-of-Lease Cleaning", "Carpet Cleaning", "Pest Control", "Rubbish Removal", "Handyman"];

export default function ProviderSignup() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [form, setForm] = useState({
    businessName: "",
    abn: "",
    phone: "",
    contactEmail: user?.email ?? "",
    suburb: "",
    maxJobsPerWeek: "10",
  });
  const [submitted, setSubmitted] = useState(false);

  const createProfile = trpc.provider.createProfile.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setTimeout(() => navigate("/provider/dashboard"), 2000);
    },
    onError: (err) => toast.error(err.message),
  });

  if (loading) return null;

  if (!isAuthenticated) {
    return (
      <PublicLayout>
        <div className="max-w-lg mx-auto px-6 py-24 text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-[#4A7C7E] mb-3">Provider Signup</div>
          <h1 className="text-3xl font-semibold text-[#2C2C2C] mb-4">Create your provider account</h1>
          <p className="text-[#6B6B6B] mb-8 leading-relaxed">
            Sign in or create an account first, then complete your provider profile to start receiving opportunities.
          </p>
          <a href={getLoginUrl()}>
            <Button size="lg" className="rounded-md bg-[#2C2C2C] hover:bg-[#1a1a1a] text-white px-8 h-12">
              Sign In to Continue <ArrowRight size={16} className="ml-2" />
            </Button>
          </a>
        </div>
      </PublicLayout>
    );
  }

  if (submitted) {
    return (
      <PublicLayout>
        <div className="max-w-lg mx-auto px-6 py-24 text-center">
          <CheckCircle2 size={48} className="text-[#4A7C7E] mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-[#2C2C2C] mb-2">Profile created</h1>
          <p className="text-[#6B6B6B]">Redirecting to your provider dashboard…</p>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="max-w-2xl mx-auto px-6 py-20">
        <div className="mb-10">
          <div className="text-xs font-semibold uppercase tracking-widest text-[#4A7C7E] mb-3">Provider Signup</div>
          <h1 className="text-3xl font-semibold text-[#2C2C2C] tracking-tight mb-2">Complete your provider profile</h1>
          <p className="text-[#6B6B6B]">This information is used to match you with relevant opportunities.</p>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-8 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <Label className="text-sm font-medium text-[#2C2C2C] mb-1.5 block">Business Name *</Label>
              <Input
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                placeholder="e.g. Melbourne Moving Co"
                className="rounded-md border-stone-200"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-[#2C2C2C] mb-1.5 block">ABN</Label>
              <Input
                value={form.abn}
                onChange={(e) => setForm({ ...form, abn: e.target.value })}
                placeholder="12 345 678 901"
                className="rounded-md border-stone-200"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-[#2C2C2C] mb-1.5 block">Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="04XX XXX XXX"
                className="rounded-md border-stone-200"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-[#2C2C2C] mb-1.5 block">Contact Email</Label>
              <Input
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                placeholder="you@business.com.au"
                className="rounded-md border-stone-200"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-[#2C2C2C] mb-1.5 block">Business Suburb</Label>
              <Input
                value={form.suburb}
                onChange={(e) => setForm({ ...form, suburb: e.target.value })}
                placeholder="e.g. Fitzroy"
                className="rounded-md border-stone-200"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-[#2C2C2C] mb-1.5 block">Max Jobs Per Week</Label>
              <Select value={form.maxJobsPerWeek} onValueChange={(v) => setForm({ ...form, maxJobsPerWeek: v })}>
                <SelectTrigger className="rounded-md border-stone-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 15, 20, 30, 50].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n} jobs/week</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-2 border-t border-stone-100">
            <p className="text-xs text-[#9B9B9B] mb-4">
              By creating a provider profile you agree to LeaseMate's provider terms, including the 48-hour response SLA and introduction fee policy.
            </p>
            <Button
              className="rounded-md bg-[#2C2C2C] hover:bg-[#1a1a1a] text-white w-full h-11"
              disabled={!form.businessName || createProfile.isPending}
              onClick={() => createProfile.mutate({
                businessName: form.businessName,
                abn: form.abn || undefined,
                phone: form.phone || undefined,
                contactEmail: form.contactEmail || undefined,
                suburb: form.suburb || undefined,
                maxJobsPerWeek: parseInt(form.maxJobsPerWeek),
              })}
            >
              {createProfile.isPending ? "Creating profile…" : "Create Provider Profile"}
            </Button>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
