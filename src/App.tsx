import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import UserDashboard from "./pages/UserDashboard";
import AdminOverview from "./pages/AdminOverview";
import AssetMaster from "./pages/AssetMaster";
import AssetHealth from "./pages/AssetHealth";
import SpareParts from "./pages/SpareParts";
import GISTracking from "./pages/GISTracking";
import Reports from "./pages/Reports";
import WorkOrders from "./pages/WorkOrders";
import Asset360 from "./pages/Asset360";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

/** Wraps a page in the authenticated shell (sidebar + header) */
function AuthenticatedPage({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) {
  return (
    <ProtectedRoute requiredRole={requiredRole}>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<AuthenticatedPage><UserDashboard /></AuthenticatedPage>} />
            <Route path="/admin" element={<AuthenticatedPage requiredRole="admin"><AdminOverview /></AuthenticatedPage>} />
            <Route path="/assets" element={<AuthenticatedPage><AssetMaster /></AuthenticatedPage>} />
            <Route path="/assets/:id" element={<AuthenticatedPage><Asset360 /></AuthenticatedPage>} />
            <Route path="/asset-health" element={<AuthenticatedPage><AssetHealth /></AuthenticatedPage>} />
            <Route path="/spare-parts" element={<AuthenticatedPage><SpareParts /></AuthenticatedPage>} />
            <Route path="/gis-tracking" element={<AuthenticatedPage><GISTracking /></AuthenticatedPage>} />
            <Route path="/work-orders" element={<AuthenticatedPage><WorkOrders /></AuthenticatedPage>} />
            <Route path="/reports" element={<AuthenticatedPage requiredRole="admin"><Reports /></AuthenticatedPage>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
