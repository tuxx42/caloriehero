import { GoogleLogin } from "@react-oauth/google";
import { Navigate } from "react-router";
import { useAuth } from "../hooks/useAuth";

export function LoginPage() {
  const { isAuthenticated, handleGoogleSuccess } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-emerald-600 mb-2">
            CalorieHero
          </h1>
          <p className="text-gray-500">
            Macro-matched meals delivered to your door
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              Welcome
            </h2>
            <p className="text-sm text-gray-500">
              Sign in to start your nutrition journey
            </p>
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => console.error("Google login failed")}
              size="large"
              width="280"
            />
          </div>

          <p className="text-xs text-gray-400">
            By signing in you agree to our Terms of Service
          </p>
        </div>
      </div>
    </div>
  );
}
