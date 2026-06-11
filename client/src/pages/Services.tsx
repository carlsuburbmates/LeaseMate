import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Truck, Sparkles, Wind, Bug, Trash2, Wrench } from "lucide-react";

const BIG_6 = [
  {
    slug: "removalist",
    name: "Removalist",
    icon: Truck,
    tagline: "Professional furniture and household goods moving.",
    desc: "Our removalist providers cover all Greater Melbourne zones. Whether you're moving from a studio in the CBD or a 4-bedroom house in the outer suburbs, matched providers bring the right vehicle and crew for your property size.",
    includes: ["Furniture disassembly and reassembly", "Packing assistance available", "Tailored to bedroom count and access", "Stair and elevator handling"],
  },
  {
    slug: "end-of-lease-cleaning",
    name: "End-of-Lease Cleaning",
    icon: Sparkles,
    tagline: "Bond-back standard cleaning for your rental property.",
    desc: "End-of-lease cleaning is the most common reason bonds are withheld. Our providers deliver a comprehensive clean that meets real estate agent inspection standards across Melbourne.",
    includes: ["Full kitchen deep clean including oven", "Bathroom and laundry scrub", "Window tracks and sills", "Wall spot cleaning and skirting boards"],
  },
  {
    slug: "carpet-cleaning",
    name: "Carpet Cleaning",
    icon: Wind,
    tagline: "Steam and dry cleaning to restore carpets to rental condition.",
    desc: "Most leases require professional carpet cleaning on exit. Our providers use truck-mounted steam cleaning equipment and document the service for your records.",
    includes: ["Truck-mounted steam clean", "Stain pre-treatment", "Certificate of completion available", "All carpet types covered"],
  },
  {
    slug: "pest-control",
    name: "Pest Control",
    icon: Bug,
    tagline: "End-of-lease treatment including flea, cockroach, and rodent control.",
    desc: "Particularly relevant for pet owners, pest control is a standard lease obligation. Our providers carry out the required treatments and provide documentation for your exit inspection.",
    includes: ["Flea treatment (required for pet owners)", "General cockroach and ant treatment", "Rodent baiting where required", "Treatment certificate provided"],
  },
  {
    slug: "rubbish-removal",
    name: "Rubbish Removal",
    icon: Trash2,
    tagline: "Junk and hard rubbish collection to clear your property.",
    desc: "Leaving behind furniture, appliances, or accumulated junk can result in bond deductions. Our rubbish removal providers handle same-day and scheduled collections across Melbourne.",
    includes: ["Furniture and appliance removal", "Hard rubbish collection", "Garage and shed clearouts", "Responsible disposal and recycling"],
  },
  {
    slug: "handyman",
    name: "Handyman",
    icon: Wrench,
    tagline: "Minor repairs and maintenance to meet lease obligations.",
    desc: "Holes in walls, broken fixtures, and minor damage are common exit issues. Our handyman providers handle the repairs your property manager will check at inspection.",
    includes: ["Wall patching and painting", "Door and window repairs", "Fixture replacement", "General maintenance tasks"],
  },
];

export default function Services() {
  return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="mb-14">
          <div className="text-xs font-semibold uppercase tracking-widest text-[#4A7C7E] mb-3">Services</div>
          <h1 className="text-4xl font-semibold text-[#2C2C2C] tracking-tight mb-4">The Big 6 move-out services</h1>
          <p className="text-lg text-[#6B6B6B] max-w-2xl leading-relaxed">
            LeaseMate covers the six service categories most commonly required at end of lease in Victoria. All providers are active in Greater Melbourne.
          </p>
        </div>

        <div className="space-y-8">
          {BIG_6.map((s) => (
            <div key={s.slug} className="bg-white rounded-xl border border-stone-200 p-8 hover:border-[#4A7C7E]/30 transition-colors">
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-lg bg-[#4A7C7E]/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <s.icon size={20} className="text-[#4A7C7E]" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-[#2C2C2C] mb-1">{s.name}</h2>
                  <p className="text-sm text-[#4A7C7E] font-medium mb-3">{s.tagline}</p>
                  <p className="text-[#6B6B6B] leading-relaxed mb-4">{s.desc}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {s.includes.map((item) => (
                      <div key={item} className="flex items-center gap-2 text-sm text-[#6B6B6B]">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#4A7C7E] flex-shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-[#F8F7F4] rounded-xl p-8 border border-stone-200">
          <h3 className="text-xl font-semibold text-[#2C2C2C] mb-2">Need multiple services?</h3>
          <p className="text-[#6B6B6B] mb-5 leading-relaxed">
            Add as many services as you need to a single Move-Out Cart. LeaseMate coordinates all providers simultaneously — one submission, no repeated data entry.
          </p>
          <Link href="/move-out-cart">
            <Button className="rounded-md bg-[#2C2C2C] hover:bg-[#1a1a1a] text-white">
              Build your cart <ArrowRight size={14} className="ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}
