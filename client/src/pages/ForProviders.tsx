import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, DollarSign, Users, Clock, BarChart3 } from "lucide-react";

const BENEFITS = [
  { icon: DollarSign, title: "Pay only when you win", desc: "No subscription fees. No monthly charges. You pay a small introduction fee only after you accept a job and the customer's details are released to you." },
  { icon: Users, title: "Pre-qualified leads", desc: "Every customer has already entered their property details, move date, and service requirements. You receive structured, actionable leads — not vague enquiries." },
  { icon: Clock, title: "48-hour response window", desc: "You have 48 hours to review and accept or decline each opportunity. No pressure, no phone calls. Manage everything from your dashboard." },
  { icon: BarChart3, title: "Set your own capacity", desc: "Control your maximum jobs per week and toggle your availability on or off at any time. LeaseMate only routes opportunities to active providers below their cap." },
];

const PRICING = [
  { category: "Removalist", fee: "$45" },
  { category: "End-of-Lease Cleaning", fee: "$25" },
  { category: "Carpet Cleaning", fee: "$20" },
  { category: "Pest Control", fee: "$20" },
  { category: "Rubbish Removal", fee: "$20" },
  { category: "Handyman", fee: "$20" },
];

export default function ForProviders() {
  return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto px-6 py-20">
        {/* Hero */}
        <div className="mb-16">
          <div className="text-xs font-semibold uppercase tracking-widest text-[#4A7C7E] mb-3">For Providers</div>
          <h1 className="text-4xl font-semibold text-[#2C2C2C] tracking-tight mb-4 max-w-2xl">
            Qualified move-out leads, delivered to your dashboard.
          </h1>
          <p className="text-lg text-[#6B6B6B] max-w-2xl leading-relaxed mb-8">
            LeaseMate connects Greater Melbourne service providers with renters who need move-out services. No cold calling. No bidding wars. Structured leads with a flat introduction fee.
          </p>
          <Link href="/provider-signup">
            <Button size="lg" className="rounded-md bg-[#2C2C2C] hover:bg-[#1a1a1a] text-white px-8 h-12">
              Join as a Provider <ArrowRight size={16} className="ml-2" />
            </Button>
          </Link>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {BENEFITS.map((b) => (
            <div key={b.title} className="bg-white rounded-xl border border-stone-200 p-6">
              <div className="w-10 h-10 rounded-lg bg-[#4A7C7E]/10 flex items-center justify-center mb-4">
                <b.icon size={18} className="text-[#4A7C7E]" />
              </div>
              <h3 className="text-base font-semibold text-[#2C2C2C] mb-2">{b.title}</h3>
              <p className="text-sm text-[#6B6B6B] leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div className="bg-[#F8F7F4] rounded-xl border border-stone-200 p-8 mb-12">
          <div className="text-xs font-semibold uppercase tracking-widest text-[#4A7C7E] mb-2">Introduction Fees</div>
          <h2 className="text-2xl font-semibold text-[#2C2C2C] mb-2">Simple, flat-rate pricing</h2>
          <p className="text-[#6B6B6B] mb-6 leading-relaxed">
            You pay a one-time introduction fee when you accept a job. That's it. No subscriptions, no percentage cuts, no hidden charges.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {PRICING.map((p) => (
              <div key={p.category} className="bg-white rounded-lg border border-stone-200 p-4">
                <div className="text-lg font-semibold text-[#2C2C2C] mb-1">{p.fee}</div>
                <div className="text-sm text-[#6B6B6B]">{p.category}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#9B9B9B] mt-4">
            Introduction fees are charged via Stripe on acceptance. If the customer is uncontactable after 3 documented attempts within 7 days, you may request a refund.
          </p>
        </div>

        {/* How it works for providers */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-[#2C2C2C] mb-6">How it works for providers</h2>
          <div className="space-y-4">
            {[
              { n: "01", t: "Sign up and create your profile", d: "Register your business, set your service categories, coverage zones, and weekly job capacity." },
              { n: "02", t: "Receive opportunity notifications", d: "When a customer submits a cart that matches your profile, you receive an opportunity in your dashboard." },
              { n: "03", t: "Review the job details", d: "See the suburb, property type, bedroom count, and service requirements. The full address is hidden until you accept." },
              { n: "04", t: "Accept and pay the introduction fee", d: "Accept the opportunity and pay the flat introduction fee via Stripe. The customer's full contact details are immediately released." },
              { n: "05", t: "Contact the customer directly", d: "Reach out to confirm the booking. The job is yours — LeaseMate steps back and you manage the relationship from here." },
            ].map((step) => (
              <div key={step.n} className="flex gap-5 bg-white rounded-xl border border-stone-200 p-5">
                <div className="text-2xl font-light text-stone-300 font-mono w-8 flex-shrink-0">{step.n}</div>
                <div>
                  <div className="text-sm font-semibold text-[#2C2C2C] mb-1">{step.t}</div>
                  <div className="text-sm text-[#6B6B6B]">{step.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center bg-[#2C2C2C] rounded-xl p-10 text-white">
          <h3 className="text-2xl font-semibold mb-3">Ready to receive qualified leads?</h3>
          <p className="text-stone-400 mb-6">Join Greater Melbourne's move-out service marketplace. Free to register.</p>
          <Link href="/provider-signup">
            <Button size="lg" className="rounded-md bg-white text-[#2C2C2C] hover:bg-stone-100 px-8 h-12">
              Create Provider Account <ArrowRight size={16} className="ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}
