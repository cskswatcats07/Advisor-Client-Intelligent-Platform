import { NavLink, Outlet } from "react-router-dom";
import { FooterDisclaimer } from "../../components/Disclaimer";
import { useAuth } from "../auth";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/clients", label: "Clients" },
  { to: "/plans", label: "Plans" },
  { to: "/compliance", label: "Compliance" },
  { to: "/ethics", label: "Ethics" },
  { to: "/settings", label: "Settings" },
];

export function AppShell() {
  const { user, clearAuth } = useAuth();
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              ACIP — Advisor Client Intelligence Platform
            </h1>
            <p className="text-xs text-slate-600">
              Compliance-first, consent-based advisory operating system for Canadian financial professionals.
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900">{user?.fullName}</p>
            <p className="text-xs text-slate-600">{user?.role}</p>
            <button
              type="button"
              className="mt-1 text-xs text-slate-700 underline"
              onClick={clearAuth}
            >
              Sign out
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-2 px-4 pb-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-md px-3 py-1.5 text-sm ${
                  isActive
                    ? "bg-slate-800 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
      <FooterDisclaimer />
    </div>
  );
}
