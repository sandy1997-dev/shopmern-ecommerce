import React, { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store";
import {
  FiGrid, FiPackage, FiShoppingBag, FiUsers, FiLogOut,
  FiMenu, FiX, FiExternalLink, FiBarChart2,
} from "react-icons/fi";

const navItems = [
  { icon: FiGrid,       label: "Dashboard",  href: "/admin" },
  { icon: FiPackage,    label: "Products",   href: "/admin/products" },
  { icon: FiShoppingBag,label: "Orders",    href: "/admin/orders" },
  { icon: FiUsers,      label: "Users",      href: "/admin/users" },
];

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-16"
        } bg-gray-900 text-white flex flex-col transition-all duration-300 flex-shrink-0`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
          {sidebarOpen && (
            <Link to="/" className="flex items-center gap-2 font-black text-lg">
              <div className="w-7 h-7 bg-white rounded flex items-center justify-center">
                <span className="text-gray-900 text-xs font-black">S</span>
              </div>
              Sunrise
            </Link>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors ml-auto"
          >
            {sidebarOpen ? <FiX size={18} /> : <FiMenu size={18} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ icon: Icon, label, href }) => {
            const isActive = location.pathname === href ||
              (href !== "/admin" && location.pathname.startsWith(href));
            return (
              <Link
                key={label}
                to={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-white text-gray-900"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
                title={!sidebarOpen ? label : ""}
              >
                <Icon size={18} className="flex-shrink-0" />
                {sidebarOpen && label}
              </Link>
            );
          })}
        </nav>

        {/* User + actions */}
        <div className="border-t border-gray-800 p-3 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            title={!sidebarOpen ? "View Store" : ""}
          >
            <FiExternalLink size={18} className="flex-shrink-0" />
            {sidebarOpen && "View Store"}
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-colors"
            title={!sidebarOpen ? "Logout" : ""}
          >
            <FiLogOut size={18} className="flex-shrink-0" />
            {sidebarOpen && "Logout"}
          </button>

          {sidebarOpen && (
            <div className="flex items-center gap-3 px-3 py-2 mt-2 border-t border-gray-800 pt-3">
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs text-gray-400">Administrator</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-gray-900">
            {navItems.find((n) =>
              n.href === "/admin"
                ? location.pathname === "/admin"
                : location.pathname.startsWith(n.href)
            )?.label || "Admin"}
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              Welcome, <strong>{user?.name}</strong>
            </span>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
