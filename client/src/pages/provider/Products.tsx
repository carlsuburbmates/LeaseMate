import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PublicLayout from "@/components/PublicLayout";
import { Link } from "wouter";
import { toast } from "sonner";
import { ArrowLeft, Plus, Package, Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { useState } from "react";

const BIG_6 = ["Removalist", "End-of-Lease Cleaning", "Carpet Cleaning", "Pest Control", "Rubbish Removal", "Handyman"];

export default function ProviderProducts() {
  const { isAuthenticated } = useAuth();
  const { data: profile } = trpc.provider.myProfile.useQuery(undefined, { enabled: isAuthenticated });
  const { data: products, isLoading, refetch } = trpc.provider.myProducts.useQuery(undefined, { enabled: isAuthenticated });
  const { data: categories } = trpc.reference.categories.useQuery();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ categoryName: "", name: "", description: "", basePrice: "", priceUnit: "fixed" });

  const addProduct = trpc.provider.addProduct.useMutation({
    onSuccess: () => { toast.success("Product added."); refetch(); setShowForm(false); setForm({ categoryName: "", name: "", description: "", basePrice: "", priceUnit: "fixed" }); },
    onError: (err: any) => toast.error(err.message),
  });
  const deleteProduct = trpc.provider.deleteProduct.useMutation({
    onSuccess: () => { toast.success("Product removed."); refetch(); },
    onError: (err: any) => toast.error(err.message),
  });

  const p = profile as any;
  const approval = p?.eligibilityChecks as any;

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

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-[#2C2C2C] tracking-tight">Products</h1>
            <p className="text-sm text-[#9B9B9B] mt-1">Your service offerings shown to customers during provider selection.</p>
          </div>
          <Button
            className="rounded-md bg-[#2C2C2C] hover:bg-[#1a1a1a] text-white"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus size={14} className="mr-2" /> Add Product
          </Button>
        </div>

        {p?.status !== "active" && (
          <div className="bg-[#F8F7F4] rounded-xl border border-stone-200 p-4 mb-6 text-sm text-[#6B6B6B]">
            Approval requires at least one active product. Current count: {approval?.activeProductCount ?? 0}.
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-xl border border-[#4A7C7E]/30 p-6 mb-6">
            <h3 className="text-sm font-semibold text-[#2C2C2C] mb-4">New Product</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-[#2C2C2C] mb-1.5 block">Service Category *</Label>
                <Select value={form.categoryName} onValueChange={(v) => setForm({ ...form, categoryName: v })}>
                  <SelectTrigger className="rounded-md border-stone-200"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {(categories as any[] ?? []).map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-[#2C2C2C] mb-1.5 block">Product Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. 2-Bedroom Apartment Clean" className="rounded-md border-stone-200" />
              </div>
              <div>
                <Label className="text-sm font-medium text-[#2C2C2C] mb-1.5 block">Description</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What's included?" className="rounded-md border-stone-200" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-[#2C2C2C] mb-1.5 block">Base Price (AUD)</Label>
                  <Input type="number" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} placeholder="250" className="rounded-md border-stone-200" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-[#2C2C2C] mb-1.5 block">Price Unit</Label>
                  <Select value={form.priceUnit} onValueChange={(v) => setForm({ ...form, priceUnit: v })}>
                    <SelectTrigger className="rounded-md border-stone-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed</SelectItem>
                      <SelectItem value="per_hour">Per Hour</SelectItem>
                      <SelectItem value="per_room">Per Room</SelectItem>
                      <SelectItem value="quote">Quote on Request</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  className="rounded-md bg-[#4A7C7E] hover:bg-[#3d6a6c] text-white"
                  disabled={!form.categoryName || !form.name || addProduct.isPending}
                  onClick={() => addProduct.mutate({
                    categoryId: parseInt(form.categoryName),
                    title: form.name,
                    description: form.description || undefined,
                    priceType: (form.priceUnit === "per_hour" ? "hourly" : form.priceUnit === "per_room" ? "fixed" : form.priceUnit === "quote" ? "quote" : "fixed") as any,
                    priceAmount: form.basePrice || undefined,
                    introductionFee: "0",
                  })}
                >
                  {addProduct.isPending ? "Saving…" : "Save Product"}
                </Button>
                <Button variant="outline" className="rounded-md border-stone-200" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {[1,2].map(i => <div key={i} className="h-20 bg-stone-100 rounded-xl" />)}
          </div>
        ) : !products || (products as any[]).length === 0 ? (
          <div className="bg-white rounded-xl border border-stone-200 p-10 text-center">
            <Package size={32} className="text-stone-300 mx-auto mb-3" />
            <p className="text-sm text-[#9B9B9B]">No products yet. Add your first service listing.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(products as any[]).map((p: any) => (
              <div key={p.id} className="bg-white rounded-xl border border-stone-200 p-5 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-[#4A7C7E] mb-1">{p.categoryName}</div>
                  <div className="text-sm font-semibold text-[#2C2C2C]">{p.title}</div>
                  {p.description && <div className="text-xs text-[#9B9B9B] mt-0.5">{p.description}</div>}
                  {p.priceAmount && <div className="text-xs text-[#6B6B6B] mt-1">${p.priceAmount} {p.priceType}</div>}
                  <div className="text-xs text-[#9B9B9B] mt-1">{p.isActive ? "Active listing" : "Inactive listing"}</div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-md border-red-100 text-red-500 hover:bg-red-50 flex-shrink-0"
                  onClick={() => deleteProduct.mutate({ productId: p.id })}
                >
                  <Trash2 size={12} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
