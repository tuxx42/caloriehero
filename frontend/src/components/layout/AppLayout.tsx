import { Link, Outlet, useLocation } from "react-router";
import { useAuthStore } from "../../stores/auth";
import { useCartStore } from "../../stores/cart";
import { useOnboardingCheck } from "../../hooks/useOnboardingCheck";
import { LoadingSpinner } from "../common/LoadingSpinner";

const NAV_ITEMS = [
  { path: "/", label: "Home", icon: "🏠" },
  { path: "/meals", label: "Meals", icon: "🍽️" },
  { path: "/plan", label: "Plan", icon: "📊" },
  { path: "/cart", label: "Cart", icon: "🛒" },
  { path: "/profile", label: "Profile", icon: "👤" },
];

export function AppLayout() {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const itemCount = useCartStore((s) => s.itemCount());
  const { ready } = useOnboardingCheck();

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Desktop top nav */}
      <nav className="hidden md:flex items-center justify-between bg-white border-b border-gray-200 px-6 py-3">
        <Link to="/" className="text-xl font-bold text-emerald-600">
          CalorieHero
        </Link>
        <div className="flex items-center gap-6">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? "text-emerald-600"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {item.label}
              {item.path === "/cart" && itemCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-emerald-500 text-white text-xs rounded-full">
                  {itemCount}
                </span>
              )}
            </Link>
          ))}
          {user && (
            <span className="text-sm text-gray-400">{user.name}</span>
          )}
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-4 md:py-6">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 flex justify-around py-2 z-50">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium transition-colors ${
              location.pathname === item.path
                ? "text-emerald-600"
                : "text-gray-400"
            }`}
          >
            <span className="text-xl leading-none relative">
              {item.icon}
              {item.path === "/cart" && itemCount > 0 && (
                <span className="absolute -top-1 -right-2 px-1 min-w-[16px] h-4 bg-emerald-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
