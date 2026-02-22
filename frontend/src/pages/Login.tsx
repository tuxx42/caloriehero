import { GoogleLogin } from "@react-oauth/google";
import { Navigate } from "react-router";
import { useAuth } from "../hooks/useAuth";

export function LoginPage() {
  const { isAuthenticated, handleGoogleSuccess } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4">
      {/* Background image */}
      <img
        src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="relative w-full max-w-sm text-center z-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            CalorieHero
          </h1>
          <p className="text-gray-200">
            Macro-matched meals delivered to your door
          </p>
        </div>

        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-8 space-y-6">
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
