import { Link, Outlet, useLocation } from "react-router";
import { useAuthStore } from "../../stores/auth";
import { useCartStore } from "../../stores/cart";
import { useOnboardingCheck } from "../../hooks/useOnboardingCheck";
import { LoadingSpinner } from "../common/LoadingSpinner";
import {
  HomeIcon,
  MealsIcon,
  ChartIcon,
  CartIcon,
  ProfileIcon,
} from "../icons/Icons";
import type { SVGProps } from "react";

const NAV_ITEMS: {
  path: string;
  label: string;
  Icon: React.FC<SVGProps<SVGSVGElement>>;
}[] = [
  { path: "/", label: "Home", Icon: HomeIcon },
  { path: "/meals", label: "Meals", Icon: MealsIcon },
  { path: "/plan", label: "Plan", Icon: ChartIcon },
  { path: "/cart", label: "Cart", Icon: CartIcon },
  { path: "/profile", label: "Profile", Icon: ProfileIcon },
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
    <div className="min-h-screen bg-stone-50 pb-20 md:pb-0">
      {/* Desktop top nav */}
      <nav className="hidden md:block bg-white/80 backdrop-blur-lg border-b border-stone-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">
          <Link to="/" className="font-display text-xl text-emerald-700 tracking-tight">
            CalorieHero
          </Link>
          <div className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? "text-emerald-700 bg-emerald-50"
                      : "text-stone-500 hover:text-stone-800 hover:bg-stone-50"
                  }`}
                >
                  <item.Icon className="w-4 h-4" />
                  {item.label}
                  {item.path === "/cart" && itemCount > 0 && (
                    <span className="ml-0.5 px-1.5 min-w-[18px] h-[18px] bg-emerald-600 text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </Link>
              );
            })}
            {user && (
              <div className="ml-3 pl-3 border-l border-stone-200">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-sm font-semibold text-emerald-700">
                  {user.name?.[0] ?? "?"}
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-5 md:py-8">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-lg border-t border-stone-200/60 z-50">
        <div className="flex justify-around py-1.5 px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? "text-emerald-700"
                    : "text-stone-400"
                }`}
              >
                <span className="relative">
                  <item.Icon className={`w-6 h-6 transition-transform duration-200 ${isActive ? "scale-110" : ""}`} />
                  {item.path === "/cart" && itemCount > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 px-1 min-w-[16px] h-4 bg-emerald-600 text-white text-[10px] font-semibold rounded-full flex items-center justify-center shadow-sm">
                      {itemCount}
                    </span>
                  )}
                </span>
                <span>{item.label}</span>
                {isActive && (
                  <span className="w-1 h-1 bg-emerald-600 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
