import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { useAuthStore } from "./stores/auth";
import { AppLayout } from "./components/layout/AppLayout";
import { AdminLayout } from "./components/layout/AdminLayout";
import { LoginPage } from "./pages/Login";
import { HomePage } from "./pages/Home";
import { MealsPage } from "./pages/Meals";
import { ProfilePage } from "./pages/Profile";
import { CartPage } from "./pages/Cart";
import { CheckoutPage } from "./pages/Checkout";
import { PlanGeneratorPage } from "./pages/PlanGenerator";
import { OrdersPage } from "./pages/Orders";
import { OrderTrackingPage } from "./pages/OrderTracking";
import { OnboardingPage } from "./pages/Onboarding";
import { AdminDashboardPage } from "./pages/admin/Dashboard";
import { AdminMealsPage } from "./pages/admin/Meals";
import { AdminOrdersPage } from "./pages/admin/Orders";
import { AdminCustomersPage } from "./pages/admin/Customers";
import { AdminPricingPage } from "./pages/admin/Pricing";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  if (!token) return <Navigate to="/login" replace />;
  if (!user?.is_admin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

// Runtime config injected by Docker entrypoint, falls back to Vite env for local dev
const runtimeConfig = (window as unknown as Record<string, unknown>).__RUNTIME_CONFIG__ as Record<string, string> | undefined;

function getConfig(key: string, viteKey: string): string {
  return runtimeConfig?.[key] || import.meta.env[viteKey] || "";
}

export default function App() {
  const googleClientId = getConfig("GOOGLE_CLIENT_ID", "VITE_GOOGLE_CLIENT_ID");

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <ProtectedRoute>
                <Outlet />
              </ProtectedRoute>
            }
          >
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/meals" element={<MealsPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/plan" element={<PlanGeneratorPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/orders/:orderId" element={<OrderTrackingPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>
          <Route
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/meals" element={<AdminMealsPage />} />
            <Route path="/admin/orders" element={<AdminOrdersPage />} />
            <Route path="/admin/customers" element={<AdminCustomersPage />} />
            <Route path="/admin/pricing" element={<AdminPricingPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}
