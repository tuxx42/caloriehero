import { Link, Outlet, useLocation } from "react-router";

const ADMIN_NAV = [
  { path: "/admin", label: "Dashboard" },
  { path: "/admin/meals", label: "Meals" },
  { path: "/admin/orders", label: "Orders" },
  { path: "/admin/customers", label: "Customers" },
];

export function AdminLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/admin" className="text-xl font-bold text-emerald-600">
            CalorieHero Admin
          </Link>
          <nav className="hidden md:flex items-center gap-4">
            {ADMIN_NAV.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition-colors px-3 py-1.5 rounded-lg ${
                  location.pathname === item.path
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <Link to="/" className="text-sm text-gray-400 hover:text-gray-600">
          Back to App
        </Link>
      </header>

      {/* Mobile nav */}
      <nav className="md:hidden flex border-b border-gray-200 bg-white px-4 overflow-x-auto">
        {ADMIN_NAV.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`text-sm font-medium px-3 py-2.5 whitespace-nowrap border-b-2 ${
              location.pathname === item.path
                ? "border-emerald-500 text-emerald-700"
                : "border-transparent text-gray-500"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
