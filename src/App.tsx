import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Menu from "./pages/Menu";
import Heurs from "./pages/Heurs";
import AdminLogin from "./pages/AdminLogin";
import Admin from "./pages/Admin";
import AdminMenu from "./pages/AdminMenu";
import AdminHeures from "./pages/AdminHeures";
import AdminInformations from "./pages/AdminInformations";
import AdminCommandes from "./pages/AdminCommandes";
import AdminCategories from "./pages/AdminCategories";
import AdminGroupOrders from "./pages/AdminGroupOrders";
import AdminGroupOrdersConfig from "./pages/AdminGroupOrdersConfig";

const queryClient = new QueryClient();

const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatus] = useState<'loading' | 'auth' | 'unauth'>('loading');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setStatus(session ? 'auth' : 'unauth');
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setStatus(session ? 'auth' : 'unauth');
    });
    return () => subscription.unsubscribe();
  }, []);

  if (status === 'loading') return null;
  if (status === 'unauth') return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/heurs" element={<Heurs />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <Admin />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/menu"
            element={
              <ProtectedAdminRoute>
                <AdminMenu />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/heures"
            element={
              <ProtectedAdminRoute>
                <AdminHeures />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/informations"
            element={
              <ProtectedAdminRoute>
                <AdminInformations />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/commandes"
            element={
              <ProtectedAdminRoute>
                <AdminCommandes />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <ProtectedAdminRoute>
                <AdminCategories />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/group-orders"
            element={
              <ProtectedAdminRoute>
                <AdminGroupOrders />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/group-orders/config"
            element={
              <ProtectedAdminRoute>
                <AdminGroupOrdersConfig />
              </ProtectedAdminRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
