import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Truck, Sparkles, Wind, Bug, Trash2, Wrench,
  ArrowRight, CheckCircle2, Clock, Shield
} from "lucide-react";

const BIG_6 = [
  { slug: "removalist", name: "Removalist", desc: "Professional furniture and household goods moving on your move-out day.", icon: Truck },
  { slug: "end-of-lease-cleaning", name: "End-of-Lease Cleaning", desc: "Bond-back guaranteed cleaning to leave your rental spotless.", icon: Sparkles },
  { slug: "carpet-cleaning", name: "Carpet Cleaning", desc: "Deep steam and dry cleaning to restore carpets to rental condition.", icon: Wind },
  { slug: "pest-control", name: "Pest Control", desc: "End-of-lease treatment including cockroach, flea, and rodent control.", icon: Bug },
  { slug: "rubbish-removal", name: "Rubbish Removal", desc: "Junk and hard rubbish collection to clear your property before inspection.", icon: Trash2 },
  { slug: "handyman", name: "Handyman", desc: "Minor repairs, wall patching, and maintenance to meet lease obligations.", icon: Wrench },
];

const STEPS = [
  { n: "01", title: "Tell us about your move", desc: "Enter your property details, move-out date, and the services you need. Takes under 3 minutes." },
  { n: "02", title: "Browse matched providers", desc: "We surface vetted Greater Melbourne providers for each service. Pick your preferred and backup." },
  { n: "03", title: "Submit your cart", desc: "One submission triggers the entire coordination process. No chasing quotes, no phone tag." },
  { n: "04", title: "Providers confirm directly", desc: "Your matched provider contacts you directly. Full details shared only after they commit." },
];

export default function Home() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="min-h-[88vh] flex items-center bg-[#F8F7F4]">
        <div className="max-w-6xl mx-auto px-6 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#4A7C7E]/10 text-[#4A7C7E] text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-sm mb-6">
              Greater Melbourne
            </div>
            <h1 className="text-5xl lg:text-6xl font-semibold text-[#2C2C2C] leading-[1.1] tracking-tight mb-6">
              Move out without<br />
              <span className="text-[#4A7C7E]">the coordination.</span>
            </h1>
            <p className="text-lg text-[#6B6B6B] leading-relaxed mb-8 max-w-lg">
              LeaseMate connects Melbourne renters with vetted move-out service providers — removalists, cleaners, pest control, and more — through a single, organised cart.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/move-out-cart">
                <Button size="lg" className="rounded-md bg-[#2C2C2C] hover:bg-[#1a1a1a] text-white px-8 h-12 text-sm font-medium">
                  Build My Move-Out Cart
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </Link>
              <Link href="/how-it-works">
                <Button size="lg" variant="outline" className="rounded-md border-[#D4D0C8] text-[#6B6B6B] hover:border-[#2C2C2C] hover:text-[#2C2C2C] h-12 px-8 text-sm">
                  How It Works
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-6 mt-8 text-sm text-[#9B9B9B]">
              <div className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-[#4A7C7E]" /> No upfront cost</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-[#4A7C7E]" /> Vetted providers</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-[#4A7C7E]" /> Greater Melbourne</div>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-[#9B9B9B] mb-4">Move-Out Cart</div>
              {BIG_6.slice(0, 4).map((s) => (
                <div key={s.slug} className="flex items-center gap-3 p-3 rounded-lg bg-[#F8F7F4] border border-stone-100">
                  <div className="w-8 h-8 rounded-md bg-[#4A7C7E]/10 flex items-center justify-center flex-shrink-0">
                    <s.icon size={14} className="text-[#4A7C7E]" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[#2C2C2C]">{s.name}</div>
                    <div className="text-xs text-[#9B9B9B]">Provider matched</div>
                  </div>
                  <div className="ml-auto">
                    <div className="w-2 h-2 rounded-full bg-[#4A7C7E]" />
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-stone-100">
                <div className="flex items-center justify-between text-xs text-[#9B9B9B]">
                  <span>4 services</span>
                  <span className="text-[#4A7C7E] font-medium">Ready to submit →</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-14">
            <div className="text-xs font-semibold uppercase tracking-widest text-[#4A7C7E] mb-3">Process</div>
            <h2 className="text-3xl font-semibold text-[#2C2C2C] tracking-tight">Four steps to a coordinated move-out</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((step) => (
              <div key={step.n} className="group">
                <div className="text-4xl font-light text-stone-200 mb-4 font-mono">{step.n}</div>
                <h3 className="text-base font-semibold text-[#2C2C2C] mb-2">{step.title}</h3>
                <p className="text-sm text-[#6B6B6B] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12">
            <Link href="/how-it-works">
              <Button variant="outline" className="rounded-md border-[#D4D0C8] text-[#6B6B6B] hover:border-[#2C2C2C] hover:text-[#2C2C2C]">
                Full process walkthrough <ArrowRight size={14} className="ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-24 bg-[#F8F7F4]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-14">
            <div className="text-xs font-semibold uppercase tracking-widest text-[#4A7C7E] mb-3">Services</div>
            <h2 className="text-3xl font-semibold text-[#2C2C2C] tracking-tight">Everything your lease requires</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BIG_6.map((s) => (
              <div key={s.slug} className="bg-white rounded-xl border border-stone-200 p-6 hover:border-[#4A7C7E]/40 hover:shadow-sm transition-all group">
                <div className="w-10 h-10 rounded-lg bg-[#4A7C7E]/10 flex items-center justify-center mb-4">
                  <s.icon size={18} className="text-[#4A7C7E]" />
                </div>
                <h3 className="text-base font-semibold text-[#2C2C2C] mb-2">{s.name}</h3>
                <p className="text-sm text-[#6B6B6B] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <Link href="/services">
              <Button variant="outline" className="rounded-md border-[#D4D0C8] text-[#6B6B6B] hover:border-[#2C2C2C] hover:text-[#2C2C2C]">
                View all services <ArrowRight size={14} className="ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-24 bg-[#2C2C2C] text-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div>
              <Shield size={28} className="text-[#4A7C7E] mb-4" />
              <h3 className="text-lg font-semibold mb-2">Vetted providers only</h3>
              <p className="text-sm text-stone-400 leading-relaxed">Every provider on LeaseMate is reviewed before activation. Your address is never shared until they commit.</p>
            </div>
            <div>
              <Clock size={28} className="text-[#4A7C7E] mb-4" />
              <h3 className="text-lg font-semibold mb-2">48-hour response SLA</h3>
              <p className="text-sm text-stone-400 leading-relaxed">Providers must respond within 48 hours or the opportunity is automatically passed to your backup choice.</p>
            </div>
            <div>
              <CheckCircle2 size={28} className="text-[#4A7C7E] mb-4" />
              <h3 className="text-lg font-semibold mb-2">One cart, all services</h3>
              <p className="text-sm text-stone-400 leading-relaxed">Submit once and let LeaseMate coordinate all six service categories simultaneously. No separate bookings.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-semibold text-[#2C2C2C] tracking-tight mb-4">Ready to sort your move-out?</h2>
          <p className="text-lg text-[#6B6B6B] mb-8 max-w-lg mx-auto">Build your cart in under 3 minutes. No account required to browse — sign up only when you're ready to submit.</p>
          <Link href="/move-out-cart">
            <Button size="lg" className="rounded-md bg-[#2C2C2C] hover:bg-[#1a1a1a] text-white px-10 h-12">
              Build My Move-Out Cart <ArrowRight size={16} className="ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
