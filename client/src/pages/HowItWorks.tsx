import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, User, ShoppingCart, Send, Phone, CheckCircle2 } from "lucide-react";

const STEPS = [
  {
    icon: User,
    n: "01",
    title: "Create your account",
    desc: "Sign up with your email address. Your account keeps all your move requests in one place and protects your address until a provider commits.",
    detail: "We use email and password or magic link — no social login required.",
  },
  {
    icon: ShoppingCart,
    n: "02",
    title: "Build your Move-Out Cart",
    desc: "Enter your property address, move-out date, property type, and the services you need. For each service, browse matched providers and select a preferred and backup option.",
    detail: "Your full address is stored securely and never shown to providers until after payment.",
  },
  {
    icon: Send,
    n: "03",
    title: "Submit your cart",
    desc: "One submission triggers the entire coordination process. LeaseMate notifies your preferred provider for each service simultaneously.",
    detail: "Providers have 48 hours to respond. If they don't, your backup is automatically contacted.",
  },
  {
    icon: Phone,
    n: "04",
    title: "Provider contacts you",
    desc: "Once a provider accepts and pays the introduction fee, your full contact details are released to them. They reach out directly to confirm the booking.",
    detail: "You'll see your request status update in real time from your dashboard.",
  },
  {
    icon: CheckCircle2,
    n: "05",
    title: "Move-out sorted",
    desc: "All your services are coordinated. No chasing quotes, no phone tag, no spreadsheet of contacts.",
    detail: "If anything goes wrong, our Operations team steps in — you don't need to manage exceptions.",
  },
];

export default function HowItWorks() {
  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="mb-14">
          <div className="text-xs font-semibold uppercase tracking-widest text-[#4A7C7E] mb-3">Process</div>
          <h1 className="text-4xl font-semibold text-[#2C2C2C] tracking-tight mb-4">How LeaseMate works</h1>
          <p className="text-lg text-[#6B6B6B] max-w-2xl leading-relaxed">
            From property details to confirmed providers — here is every step of the process, explained plainly.
          </p>
        </div>

        <div className="space-y-0">
          {STEPS.map((step, i) => (
            <div key={step.n} className="relative flex gap-8 pb-12">
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className="absolute left-6 top-14 bottom-0 w-px bg-stone-200" />
              )}
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#4A7C7E]/10 flex items-center justify-center z-10">
                <step.icon size={18} className="text-[#4A7C7E]" />
              </div>
              <div className="pt-2">
                <div className="text-xs font-mono text-[#9B9B9B] mb-1">{step.n}</div>
                <h2 className="text-xl font-semibold text-[#2C2C2C] mb-2">{step.title}</h2>
                <p className="text-[#6B6B6B] leading-relaxed mb-2">{step.desc}</p>
                <p className="text-sm text-[#9B9B9B] italic">{step.detail}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-8 border-t border-stone-200">
          <h3 className="text-lg font-semibold text-[#2C2C2C] mb-2">What about cancellations?</h3>
          <p className="text-[#6B6B6B] leading-relaxed mb-6">
            You can cancel your request at any time before a provider accepts. After acceptance, the provider has already committed — contact them directly to discuss changes. There is no fee to you for cancelling before acceptance.
          </p>
          <Link href="/move-out-cart">
            <Button className="rounded-md bg-[#2C2C2C] hover:bg-[#1a1a1a] text-white">
              Start your cart <ArrowRight size={14} className="ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}
