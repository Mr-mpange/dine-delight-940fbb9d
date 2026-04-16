import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import RestaurantPage from "./pages/RestaurantPage";
import MenuPage from "./pages/MenuPage";
import CartPage from "./pages/CartPage";
import CheckoutPageWrapper from "./pages/CheckoutPageWrapper";
import TrackOrderPage from "./pages/TrackOrderPage";
import KycApplicationPage from "./pages/KycApplicationPage";
import AuthPage from "./pages/AuthPage";
import RestaurantDashboard from "./pages/RestaurantDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/admin" element={<RestaurantDashboard />} />
              <Route path="/super-admin" element={<SuperAdminDashboard />} />
              <Route path="/r/:slug" element={<RestaurantPage />} />
              <Route path="/r/:slug/menu" element={<MenuPage />} />
              <Route path="/r/:slug/cart" element={<CartPage />} />
              <Route path="/r/:slug/checkout" element={<CheckoutPageWrapper />} />
              <Route path="/apply" element={<KycApplicationPage />} />
              <Route path="/r/:slug/track/:orderId" element={<TrackOrderPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
