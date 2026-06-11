import PublicLayout from "@/components/PublicLayout";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    section: "For Customers",
    items: [
      { q: "What is LeaseMate?", a: "LeaseMate is a marketplace that connects Melbourne renters with vetted move-out service providers. You build a single Move-Out Cart listing all the services you need, submit it once, and LeaseMate coordinates provider matching for each service simultaneously." },
      { q: "Is there a cost to use LeaseMate as a customer?", a: "No. LeaseMate is free for customers. You pay the service providers directly for the work they perform. LeaseMate charges providers a small introduction fee when they accept a job — this is not passed on to you." },
      { q: "What services are available?", a: "LeaseMate currently covers the Big 6 move-out services: Removalist, End-of-Lease Cleaning, Carpet Cleaning, Pest Control, Rubbish Removal, and Handyman. All providers are active in Greater Melbourne." },
      { q: "Do I need an account to browse?", a: "You can browse services and providers without an account. You'll need to create an account before submitting your Move-Out Cart." },
      { q: "When is my address shared with providers?", a: "Your full street address is never shown to a provider until they have accepted the job and paid the introduction fee. Before that point, providers only see your suburb, property type, and service requirements." },
      { q: "Can I cancel my request?", a: "Yes. You can cancel your request at any time before a provider accepts. After a provider accepts, they have already committed to the job — contact them directly to discuss any changes. There is no fee to you for cancelling before acceptance." },
      { q: "What if no provider accepts my request?", a: "If your preferred provider doesn't respond within 48 hours, your backup provider is automatically contacted. If both decline, our Operations team steps in to find an alternative. You'll be notified throughout." },
      { q: "How do I track my request?", a: "Your customer dashboard shows the current status of each service in your cart. Status labels are plain English — no technical codes." },
    ],
  },
  {
    section: "For Providers",
    items: [
      { q: "How does the introduction fee work?", a: "When you accept a job opportunity, you pay a flat introduction fee via Stripe. Your customer's full contact details are immediately released. The fee varies by service category — from $20 for most services to $45 for removalist jobs." },
      { q: "Can I get a refund if the customer is uncontactable?", a: "Yes, under specific conditions. If you can document at least 3 genuine contact attempts over 3 business days and the customer remains completely uncontactable, you can flag the job within 7 days of paying the introduction fee. Our Operations team reviews the claim and issues a refund if valid." },
      { q: "How do I control how many jobs I receive?", a: "Your provider dashboard has a maximum jobs per week setting and an active/paused toggle. LeaseMate only routes opportunities to active providers who are below their weekly cap." },
      { q: "What happens if I don't respond within 48 hours?", a: "The opportunity is automatically passed to the backup provider. Providers who time out twice in any 30-day period are automatically paused and must manually reactivate their account." },
      { q: "Is there a subscription fee?", a: "No. There are no subscription fees, monthly charges, or percentage cuts. You only pay the flat introduction fee when you accept a job." },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-stone-100 last:border-0">
      <button
        className="w-full flex items-center justify-between gap-4 py-4 text-left"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm font-medium text-[#2C2C2C]">{q}</span>
        <ChevronDown
          size={16}
          className={`text-[#9B9B9B] flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="pb-4 text-sm text-[#6B6B6B] leading-relaxed">{a}</div>
      )}
    </div>
  );
}

export default function FAQ() {
  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto px-6 py-20">
        <div className="mb-12">
          <div className="text-xs font-semibold uppercase tracking-widest text-[#4A7C7E] mb-3">FAQ</div>
          <h1 className="text-4xl font-semibold text-[#2C2C2C] tracking-tight mb-4">Frequently asked questions</h1>
          <p className="text-lg text-[#6B6B6B] leading-relaxed">
            Common questions about how LeaseMate works for customers and providers.
          </p>
        </div>

        <div className="space-y-10">
          {FAQS.map((section) => (
            <div key={section.section}>
              <div className="text-xs font-semibold uppercase tracking-widest text-[#4A7C7E] mb-4">{section.section}</div>
              <div className="bg-white rounded-xl border border-stone-200 px-6">
                {section.items.map((item) => (
                  <FAQItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
