import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PublicLayout from "@/components/PublicLayout";
import { Link } from "wouter";
import { toast } from "sonner";
import { ArrowLeft, User, ToggleLeft, ToggleRight } from "lucide-react";
import { useState, useEffect } from "react";

export default function ProviderProfile() {
  const { isAuthenticated } = useAuth();
  const { data: profile, isLoading, refetch } = trpc.provider.myProfile.useQuery(undefined, { enabled: isAuthenticated });
  const [form, setForm] = useState({ businessName: "", phone: "", contactEmail: "", suburb: "", maxJobsPerWeek: "10" });

  useEffect(() => {
    if (profile) {
      const p = profile as any;
      setForm({
        businessName: p.businessName ?? "",
        phone: p.phone ?? "",
        contactEmail: p.contactEmail ?? "",
        suburb: p.suburb ?? "",
        maxJobsPerWeek: String(p.maxJobsPerWeek ?? 10),
      });
    }
  }, [profile]);

  const updateProfile = trpc.provider.updateProfile.useMutation({
    onSuccess: () => { toast.success("Profile updated."); refetch(); },
    onError: (err: any) => toast.error(err.message),
  });

  if (isLoading) return null;
  if (!profile) return null;

  const p = profile as any;

  return (
    <PublicLayout>
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/provider/dashboard">
            <button className="flex items-center gap-1.5 text-sm text-[#9B9B9B] hover:text-[#2C2C2C] transition-colors">
              <ArrowLeft size={14} /> Dashboard
            </button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#2C2C2C] tracking-tight">Profile</h1>
          <p className="text-sm text-[#9B9B9B] mt-1">Update your business details and availability settings.</p>
        </div>

        {/* Status toggle */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 mb-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-[#2C2C2C]">Account Status</div>
            <div className="text-xs text-[#9B9B9B] mt-0.5">
              {p.status === "active" ? "You are receiving opportunities." : "You are paused. No new opportunities will be sent."}
            </div>
          </div>
          <div className={`flex items-center gap-2 text-sm font-medium ${p.status === "active" ? "text-green-600" : "text-amber-600"}`}>
            {p.status === "active" ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
            {p.status === "active" ? "Active" : "Paused"}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-5">
          <div>
            <Label className="text-sm font-medium text-[#2C2C2C] mb-1.5 block">Business Name</Label>
            <Input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} className="rounded-md border-stone-200" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-[#2C2C2C] mb-1.5 block">Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="04XX XXX XXX" className="rounded-md border-stone-200" />
            </div>
            <div>
              <Label className="text-sm font-medium text-[#2C2C2C] mb-1.5 block">Contact Email</Label>
              <Input value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className="rounded-md border-stone-200" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-[#2C2C2C] mb-1.5 block">Business Suburb</Label>
              <Input value={form.suburb} onChange={(e) => setForm({ ...form, suburb: e.target.value })} className="rounded-md border-stone-200" />
            </div>
            <div>
              <Label className="text-sm font-medium text-[#2C2C2C] mb-1.5 block">Max Jobs Per Week</Label>
              <Select value={form.maxJobsPerWeek} onValueChange={(v) => setForm({ ...form, maxJobsPerWeek: v })}>
                <SelectTrigger className="rounded-md border-stone-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[5, 10, 15, 20, 30, 50].map(n => <SelectItem key={n} value={String(n)}>{n} jobs/week</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="pt-2">
            <Button
              className="rounded-md bg-[#2C2C2C] hover:bg-[#1a1a1a] text-white w-full h-11"
              disabled={updateProfile.isPending}
              onClick={() => updateProfile.mutate({
                businessName: form.businessName || undefined,
                phone: form.phone || undefined,
                contactEmail: form.contactEmail || undefined,
                suburb: form.suburb || undefined,
                maxJobsPerWeek: parseInt(form.maxJobsPerWeek),
              })}
            >
              {updateProfile.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
