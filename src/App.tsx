import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminOverview /></ProtectedRoute>} />
            <Route path="/assets" element={<ProtectedRoute><AssetMaster /></ProtectedRoute>} />
            <Route path="/asset-health" element={<ProtectedRoute><AssetHealth /></ProtectedRoute>} />
            <Route path="/spare-parts" element={<ProtectedRoute><SpareParts /></ProtectedRoute>} />
            <Route path="/gis-tracking" element={<ProtectedRoute><GISTracking /></ProtectedRoute>} />
            <Route path="/work-orders" element={<ProtectedRoute><WorkOrders /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute requiredRole="admin"><Reports /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
