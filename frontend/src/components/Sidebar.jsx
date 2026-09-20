import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu, Home, Users, Car, History, Settings } from "lucide-react";

const navItems = [
  { label: "Home", to: "/", icon: Home, end: true },
  { label: "Clients", to: "/clients", icon: Users },
  { label: "Vehicles", to: "/vehicles", icon: Car },
  { label: "History", to: "/history", icon: History },
  { label: "Settings", to: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <aside
      className={[
        "flex h-screen shrink-0 flex-col bg-slate-950 transition-all duration-200",
        collapsed ? "w-16" : "w-56",
      ].join(" ")}
    >
      {/* Top: logo */}
      <div
        className={[
          "flex h-16 items-center border-b border-white/5",
          collapsed ? "justify-center" : "justify-between px-4",
        ].join(" ")}
      >
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white">
            <Settings className="h-4 w-4" strokeWidth={2.5} />
          </span>
          {!collapsed && (
            <span className="text-base font-semibold text-white">
              me<span className="text-orange-500">Car</span>
            </span>
          )}
        </div>
      </div>

      {/* Toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={[
          "mx-3 mt-3 flex h-9 items-center gap-2 rounded-lg text-slate-400 transition-colors hover:bg-white/5 hover:text-white",
          collapsed ? "justify-center" : "px-3",
        ].join(" ")}
      >
        <Menu className="h-4 w-4 shrink-0" />
        {!collapsed && <span className="text-xs font-medium">Collapse</span>}
      </button>

      {/* Nav */}
      <nav className="mt-4 flex flex-1 flex-col gap-1 px-3">
        {navItems.map(({ label, to, icon: Icon, end }) => (
          <NavLink
            key={label}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                "flex h-10 items-center gap-3 rounded-lg text-sm font-medium transition-colors",
                collapsed ? "justify-center px-0" : "px-3",
                isActive
                  ? "bg-orange-500/10 text-orange-500"
                  : "text-slate-400 hover:bg-white/5 hover:text-white",
              ].join(" ")
            }
            title={collapsed ? label : undefined}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div
        className={[
          "flex h-16 items-center border-t border-white/5",
          collapsed ? "justify-center" : "gap-3 px-4",
        ].join(" ")}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-semibold text-white">
          AK
        </span>
        {!collapsed && (
          <div className="leading-tight">
            <p className="text-sm font-medium text-white">Alex Kovacs</p>
            <p className="text-xs text-slate-400">Admin</p>
          </div>
        )}
      </div>
    </aside>
  );
}
