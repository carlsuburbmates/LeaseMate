import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import PublicLayout from "@/components/PublicLayout";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft, CheckCircle2, Truck, Sparkles, Wind, Bug, Trash2, Wrench } from "lucide-react";

const BIG_6 = [
  { id: "removalist", name: "Removalist", icon: Truck, desc: "Furniture and goods moving" },
  { id: "cleaning", name: "End-of-Lease Cleaning", icon: Sparkles, desc: "Bond-back standard clean" },
  { id: "carpet", name: "Carpet Cleaning", icon: Wind, desc: "Steam and dry cleaning" },
  { id: "pest", name: "Pest Control", icon: Bug, desc: "Flea, cockroach, rodent" },
  { id: "rubbish", name: "Rubbish Removal", icon: Trash2, desc: "Junk and hard rubbish" },
  { id: "handyman", name: "Handyman", icon: Wrench, desc: "Repairs and maintenance" },
];

const STEPS = ["Property Details", "Services", "Review & Submit"];

export default function MoveOutCart() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [requestId, setRequestId] = useState<number | null>(null);

  const [property, setProperty] = useState({
    address: "",
    suburb: "",
    postcode: "",
    type: "",
    bedrooms: "2",
    bathrooms: "1",
    accessNotes: "",
    moveOutDate: "",
  });
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const { data: suburbs } = trpc.reference.suburbs.useQuery();
  const createRequest = trpc.intake.createRequest.useMutation({
    onSuccess: (data) => {
      setRequestId(data.id);
      setStep(2);
    },
    onError: (err) => toast.error(err.message),
  });
  const submitRequest = trpc.intake.submitRequest.useMutation({
    onSuccess: () => {
      toast.success("Your Move-Out Cart has been submitted!");
      navigate(`/requests/${requestId}`);
    },
    onError: (err) => toast.error(err.message),
  });

  if (loading) return null;

  if (!isAuthenticated) {
    return (
      <PublicLayout>
        <div className="max-w-lg mx-auto px-6 py-24 text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-[#4A7C7E] mb-3">Move-Out Cart</div>
          <h1 className="text-3xl font-semibold text-[#2C2C2C] mb-4">Sign in to build your cart</h1>
          <p className="text-[#6B6B6B] mb-8 leading-relaxed">
            Create a free account to save your move-out request and track provider responses.
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

  const canProceedStep0 =
    property.address.length >= 5 &&
    property.suburb.length >= 2 &&
    property.type !== "" &&
    property.bedrooms !== "" &&
    property.bathrooms !== "";

  const canProceedStep1 = selectedServices.length > 0;

  return (
    <PublicLayout>
      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-10">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                i < step ? "bg-[#4A7C7E] text-white" : i === step ? "bg-[#2C2C2C] text-white" : "bg-stone-200 text-stone-500"
              }`}>
                {i < step ? <CheckCircle2 size={12} /> : i + 1}
              </div>
              <span className={`text-sm font-medium ${i === step ? "text-[#2C2C2C]" : "text-[#9B9B9B]"}`}>{s}</span>
              {i < STEPS.length - 1 && <div className="w-8 h-px bg-stone-200 mx-1" />}
            </div>
          ))}
        </div>

        {/* Step 0: Property Details */}
        {step === 0 && (
          <div>
            <h1 className="text-2xl font-semibold text-[#2C2C2C] mb-1">Property details</h1>
            <p className="text-[#6B6B6B] text-sm mb-8">Your address is stored securely and only shared with providers after they commit to the job.</p>

            <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-5">
              <div>
                <Label className="text-sm font-medium text-[#2C2C2C] mb-1.5 block">Street Address *</Label>
                <Input
                  value={property.address}
                  onChange={(e) => setProperty({ ...property, address: e.target.value })}
                  placeholder="e.g. 12 Smith Street"
                  className="rounded-md border-stone-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-[#2C2C2C] mb-1.5 block">Suburb *</Label>
                  <Input
                    value={property.suburb}
                    onChange={(e) => setProperty({ ...property, suburb: e.target.value })}
                    placeholder="e.g. Fitzroy"
                    list="suburbs-list"
                    className="rounded-md border-stone-200"
                  />
                  <datalist id="suburbs-list">
                    {suburbs?.map((s: any) => <option key={s.id} value={s.name} />)}
                  </datalist>
                </div>
                <div>
                  <Label className="text-sm font-medium text-[#2C2C2C] mb-1.5 block">Postcode</Label>
                  <Input
                    value={property.postcode}
                    onChange={(e) => setProperty({ ...property, postcode: e.target.value })}
                    placeholder="3000"
                    className="rounded-md border-stone-200"
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-[#2C2C2C] mb-1.5 block">Property Type *</Label>
                <Select value={property.type} onValueChange={(v) => setProperty({ ...property, type: v })}>
                  <SelectTrigger className="rounded-md border-stone-200">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="townhouse">Townhouse</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-[#2C2C2C] mb-1.5 block">Bedrooms *</Label>
                  <Select value={property.bedrooms} onValueChange={(v) => setProperty({ ...property, bedrooms: v })}>
                    <SelectTrigger className="rounded-md border-stone-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[0,1,2,3,4,5,6].map(n => <SelectItem key={n} value={String(n)}>{n === 0 ? "Studio" : `${n} bed`}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-[#2C2C2C] mb-1.5 block">Bathrooms *</Label>
                  <Select value={property.bathrooms} onValueChange={(v) => setProperty({ ...property, bathrooms: v })}>
                    <SelectTrigger className="rounded-md border-stone-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4].map(n => <SelectItem key={n} value={String(n)}>{n} bath</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-[#2C2C2C] mb-1.5 block">Move-Out Date</Label>
                <Input
                  type="date"
                  value={property.moveOutDate}
                  onChange={(e) => setProperty({ ...property, moveOutDate: e.target.value })}
                  className="rounded-md border-stone-200"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-[#2C2C2C] mb-1.5 block">Access Notes</Label>
                <Input
                  value={property.accessNotes}
                  onChange={(e) => setProperty({ ...property, accessNotes: e.target.value })}
                  placeholder="e.g. Ground floor, no lift, parking on street"
                  className="rounded-md border-stone-200"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                className="rounded-md bg-[#2C2C2C] hover:bg-[#1a1a1a] text-white px-8 h-11"
                disabled={!canProceedStep0}
                onClick={() => setStep(1)}
              >
                Select Services <ArrowRight size={14} className="ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 1: Services */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-semibold text-[#2C2C2C] mb-1">Select services</h1>
            <p className="text-[#6B6B6B] text-sm mb-8">Choose all the services you need. You can add as many as required.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {BIG_6.map((s) => {
                const selected = selectedServices.includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedServices(prev =>
                      prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id]
                    )}
                    className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                      selected
                        ? "border-[#4A7C7E] bg-[#4A7C7E]/5"
                        : "border-stone-200 bg-white hover:border-stone-300"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${selected ? "bg-[#4A7C7E]/15" : "bg-stone-100"}`}>
                      <s.icon size={18} className={selected ? "text-[#4A7C7E]" : "text-stone-500"} />
                    </div>
                    <div>
                      <div className={`text-sm font-semibold ${selected ? "text-[#4A7C7E]" : "text-[#2C2C2C]"}`}>{s.name}</div>
                      <div className="text-xs text-[#9B9B9B]">{s.desc}</div>
                    </div>
                    <div className="ml-auto">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${selected ? "border-[#4A7C7E] bg-[#4A7C7E]" : "border-stone-300"}`}>
                        {selected && <CheckCircle2 size={10} className="text-white" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" className="rounded-md border-stone-200 text-[#6B6B6B]" onClick={() => setStep(0)}>
                <ArrowLeft size={14} className="mr-2" /> Back
              </Button>
              <Button
                className="rounded-md bg-[#2C2C2C] hover:bg-[#1a1a1a] text-white px-8 h-11"
                disabled={!canProceedStep1 || createRequest.isPending}
                onClick={() => createRequest.mutate({
                  propertyAddress: property.address,
                  propertySuburb: property.suburb,
                  propertyPostcode: property.postcode || undefined,
                  propertyType: property.type as any,
                  bedrooms: parseInt(property.bedrooms),
                  bathrooms: parseInt(property.bathrooms),
                  accessNotes: property.accessNotes || undefined,
                  moveOutDate: property.moveOutDate || undefined,
                })}
              >
                {createRequest.isPending ? "Saving…" : "Review Cart"} <ArrowRight size={14} className="ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Review */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-semibold text-[#2C2C2C] mb-1">Review your cart</h1>
            <p className="text-[#6B6B6B] text-sm mb-8">Confirm your details before submitting. Once submitted, provider matching begins immediately.</p>

            <div className="bg-white rounded-xl border border-stone-200 p-6 mb-4">
              <div className="text-xs font-semibold uppercase tracking-widest text-[#9B9B9B] mb-4">Property</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-[#9B9B9B]">Address</span><span className="text-[#2C2C2C] font-medium">{property.address}</span></div>
                <div className="flex justify-between"><span className="text-[#9B9B9B]">Suburb</span><span className="text-[#2C2C2C]">{property.suburb}</span></div>
                <div className="flex justify-between"><span className="text-[#9B9B9B]">Type</span><span className="text-[#2C2C2C] capitalize">{property.type}</span></div>
                <div className="flex justify-between"><span className="text-[#9B9B9B]">Size</span><span className="text-[#2C2C2C]">{property.bedrooms} bed · {property.bathrooms} bath</span></div>
                {property.moveOutDate && <div className="flex justify-between"><span className="text-[#9B9B9B]">Move-out</span><span className="text-[#2C2C2C]">{new Date(property.moveOutDate).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}</span></div>}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-stone-200 p-6 mb-6">
              <div className="text-xs font-semibold uppercase tracking-widest text-[#9B9B9B] mb-4">Services ({selectedServices.length})</div>
              <div className="space-y-2">
                {selectedServices.map((id) => {
                  const s = BIG_6.find(x => x.id === id)!;
                  return (
                    <div key={id} className="flex items-center gap-3 text-sm">
                      <div className="w-7 h-7 rounded-md bg-[#4A7C7E]/10 flex items-center justify-center">
                        <s.icon size={13} className="text-[#4A7C7E]" />
                      </div>
                      <span className="text-[#2C2C2C]">{s.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-[#F8F7F4] rounded-xl border border-stone-200 p-4 mb-6 text-xs text-[#6B6B6B] leading-relaxed">
              By submitting, you confirm that the property details are accurate. Your full address will only be shared with a provider after they accept and pay the introduction fee.
            </div>

            <div className="flex justify-between">
              <Button variant="outline" className="rounded-md border-stone-200 text-[#6B6B6B]" onClick={() => setStep(1)}>
                <ArrowLeft size={14} className="mr-2" /> Back
              </Button>
              <Button
                className="rounded-md bg-[#4A7C7E] hover:bg-[#3d6a6c] text-white px-8 h-11"
                disabled={!requestId || submitRequest.isPending}
                onClick={() => requestId && submitRequest.mutate({ requestId })}
              >
                {submitRequest.isPending ? "Submitting…" : "Submit Cart"} <ArrowRight size={14} className="ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
