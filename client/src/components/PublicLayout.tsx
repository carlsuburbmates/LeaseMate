import PublicNav from "./PublicNav";

interface PublicLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function PublicLayout({ children, className = "" }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F8F7F4] flex flex-col">
      <PublicNav />
      <main className={`flex-1 pt-16 ${className}`}>
        {children}
      </main>
      <footer className="bg-[#2C2C2C] text-white py-12 mt-auto">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-0 mb-3">
                <span className="text-lg font-semibold text-white">Lease</span>
                <span className="text-lg font-semibold text-[#4A7C7E]">Mate</span>
              </div>
              <p className="text-sm text-stone-400 max-w-xs leading-relaxed">
                Melbourne's move-out service marketplace. Connecting renters with trusted providers for a seamless end-of-lease experience.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-3">Platform</h4>
              <ul className="space-y-2 text-sm text-stone-400">
                <li><a href="/how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="/services" className="hover:text-white transition-colors">Services</a></li>
                <li><a href="/faq" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-3">Providers</h4>
              <ul className="space-y-2 text-sm text-stone-400">
                <li><a href="/for-providers" className="hover:text-white transition-colors">Why LeaseMate</a></li>
                <li><a href="/provider-signup" className="hover:text-white transition-colors">Join as Provider</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-stone-700 pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-stone-500">
            <p>© {new Date().getFullYear()} LeaseMate. All rights reserved.</p>
            <div className="flex gap-4">
              <span className="hover:text-stone-300 cursor-pointer transition-colors">Privacy Policy</span>
              <span className="hover:text-stone-300 cursor-pointer transition-colors">Terms of Use</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
