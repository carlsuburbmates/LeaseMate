import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Public pages
import Home from "./pages/Home";
import HowItWorks from "./pages/HowItWorks";
import Services from "./pages/Services";
import ForProviders from "./pages/ForProviders";
import ProviderSignup from "./pages/ProviderSignup";
import FAQ from "./pages/FAQ";

// Customer pages
import CustomerDashboard from "./pages/customer/Dashboard";
import MoveOutCart from "./pages/customer/MoveOutCart";
import RequestStatus from "./pages/customer/RequestStatus";

// Provider pages
import ProviderDashboard from "./pages/provider/Dashboard";
import ProviderOpportunities from "./pages/provider/Opportunities";
import ProviderProducts from "./pages/provider/Products";
import ProviderBilling from "./pages/provider/Billing";
import ProviderProfile from "./pages/provider/Profile";

// Ops pages
import OpsCenter from "./pages/ops/OpsCenter";
import OpsExceptions from "./pages/ops/Exceptions";
import OpsExceptionDetail from "./pages/ops/ExceptionDetail";
import OpsRequests from "./pages/ops/Requests";
import OpsAuditLog from "./pages/ops/AuditLog";
import OpsProviders from "./pages/ops/Providers";
import OpsSystemHealth from "./pages/ops/SystemHealth";
import OpsRequestDetail from "./pages/ops/RequestDetail";

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/" component={Home} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/services" component={Services} />
      <Route path="/for-providers" component={ForProviders} />
      <Route path="/provider-signup" component={ProviderSignup} />
      <Route path="/faq" component={FAQ} />

      {/* Customer */}
      <Route path="/dashboard" component={CustomerDashboard} />
      <Route path="/move-out-cart" component={MoveOutCart} />
      <Route path="/requests/:id" component={RequestStatus} />

      {/* Provider */}
      <Route path="/provider/dashboard" component={ProviderDashboard} />
      <Route path="/provider/opportunities" component={ProviderOpportunities} />
      <Route path="/provider/products" component={ProviderProducts} />
      <Route path="/provider/billing" component={ProviderBilling} />
      <Route path="/provider/profile" component={ProviderProfile} />

      {/* Ops */}
      <Route path="/ops" component={OpsCenter} />
      <Route path="/ops/exceptions" component={OpsExceptions} />
      <Route path="/ops/exceptions/:id" component={OpsExceptionDetail} />
      <Route path="/ops/requests" component={OpsRequests} />
      <Route path="/ops/requests/:id" component={OpsRequestDetail} />
      <Route path="/ops/audit" component={OpsAuditLog} />
      <Route path="/ops/providers" component={OpsProviders} />
      <Route path="/ops/health" component={OpsSystemHealth} />

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
