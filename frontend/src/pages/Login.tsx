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
      <div className="absolute inset-0 bg-gradient-to-br from-stone-900/60 via-emerald-900/40 to-stone-900/70 backdrop-blur-[2px]" />

      <div className="relative w-full max-w-sm z-10 animate-scale-in">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl text-white mb-2 drop-shadow-lg">
            CalorieHero
          </h1>
          <p className="text-stone-300 text-sm">
            Macro-matched meals delivered to your door
          </p>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-float p-8 space-y-6 border border-white/20">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-stone-900 mb-1">
              Welcome
            </h2>
            <p className="text-sm text-stone-500">
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

          <p className="text-xs text-stone-400 text-center">
            By signing in you agree to our Terms of Service
          </p>
        </div>
      </div>
    </div>
  );
}
