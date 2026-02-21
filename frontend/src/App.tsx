import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { useAuthStore } from "./stores/auth";
import { AppLayout } from "./components/layout/AppLayout";
import { LoginPage } from "./pages/Login";
import { HomePage } from "./pages/Home";
import { MealsPage } from "./pages/Meals";
import { ProfilePage } from "./pages/Profile";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  // In production, set via env var. For dev, empty string disables real Google auth.
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<HomePage />} />
            <Route path="/meals" element={<MealsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}
