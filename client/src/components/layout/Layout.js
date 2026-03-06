import React, { useState, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore, useCartStore, useUIStore } from "../../store";
import CartDrawer from "../cart/CartDrawer";
import {
  FiShoppingBag, FiSearch, FiUser, FiHeart, FiMenu, FiX,
  FiPackage, FiLogOut, FiSettings, FiChevronDown,
} from "react-icons/fi";

export default function Layout() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { items, openCart } = useCartStore();
  const { searchOpen, toggleSearch, mobileMenuOpen, toggleMobileMenu } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const itemCount = items.reduce((acc, i) => acc + i.quantity, 0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setUserMenuOpen(false);
  }, [location]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?keyword=${encodeURIComponent(searchQuery.trim())}`);
      toggleSearch();
      setSearchQuery("");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navLinks = [
    { label: "Shop", href: "/products" },
    { label: "Electronics", href: "/products?category=Electronics" },
    { label: "Clothing", href: "/products?category=Clothing" },
    { label: "Sale", href: "/products?sort=price-asc" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── NAVBAR ── */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white shadow-md" : "bg-white border-b border-gray-100"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2 text-xl font-black tracking-tight text-gray-900"
            >
              <div className="w-8 h-8 bg-gray-900 rounded flex items-center justify-center">
                <span className="text-white text-xs font-black">S</span>
              </div>
              ShopMERN
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map(({ label, href }) => (
                <Link
                  key={label}
                  to={href}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <button
                onClick={toggleSearch}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FiSearch size={20} />
              </button>

              {/* Wishlist */}
              {isAuthenticated && (
                <Link
                  to="/wishlist"
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FiHeart size={20} />
                </Link>
              )}

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() =>
                    isAuthenticated
                      ? setUserMenuOpen(!userMenuOpen)
                      : navigate("/login")
                  }
                  className="flex items-center gap-1 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                >
                  {isAuthenticated && user?.avatar?.url ? (
                    <img
                      src={user.avatar.url}
                      alt={user.name}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <FiUser size={20} />
                  )}
                </button>

                <AnimatePresence>
                  {userMenuOpen && isAuthenticated && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50"
                    >
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <div className="py-1">
                        {[
                          { icon: FiUser, label: "Profile", href: "/profile" },
                          { icon: FiPackage, label: "My Orders", href: "/orders" },
                          { icon: FiHeart, label: "Wishlist", href: "/wishlist" },
                          ...(user.role === "admin"
                            ? [{ icon: FiSettings, label: "Admin Panel", href: "/admin" }]
                            : []),
                        ].map(({ icon: Icon, label, href }) => (
                          <Link
                            key={label}
                            to={href}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Icon size={16} className="text-gray-400" />
                            {label}
                          </Link>
                        ))}
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100 mt-1"
                        >
                          <FiLogOut size={16} />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Cart */}
              <button
                onClick={openCart}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FiShoppingBag size={20} />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gray-900 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                )}
              </button>

              {/* Mobile menu toggle */}
              <button
                onClick={toggleMobileMenu}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                {mobileMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-100 bg-white overflow-hidden"
            >
              <form onSubmit={handleSearch} className="max-w-2xl mx-auto px-4 py-4">
                <div className="relative">
                  <FiSearch
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Search
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              className="md:hidden border-t border-gray-100 bg-white overflow-hidden"
            >
              <div className="px-4 py-4 space-y-1">
                {navLinks.map(({ label, href }) => (
                  <Link
                    key={label}
                    to={href}
                    onClick={toggleMobileMenu}
                    className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── PAGE CONTENT ── */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-900 text-gray-400 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 text-white font-black text-lg mb-3">
                <div className="w-7 h-7 bg-white rounded flex items-center justify-center">
                  <span className="text-gray-900 text-xs font-black">S</span>
                </div>
                ShopMERN
              </div>
              <p className="text-sm leading-relaxed">
                A full-stack MERN e-commerce platform built with React, Node.js, MongoDB & Stripe.
              </p>
            </div>
            {[
              { title: "Shop", links: ["All Products", "Electronics", "Clothing", "Sale"] },
              { title: "Account", links: ["Login", "Register", "My Orders", "Profile"] },
              { title: "Support", links: ["FAQ", "Shipping", "Returns", "Contact"] },
            ].map(({ title, links }) => (
              <div key={title}>
                <h4 className="text-white text-sm font-semibold mb-3">{title}</h4>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm hover:text-white transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">© 2024 ShopMERN. Built with MERN Stack + Stripe.</p>
            <p className="text-sm">
              By <span className="text-white font-medium">Sandeep Kumar Pati</span>
            </p>
          </div>
        </div>
      </footer>

      {/* Cart Drawer */}
      <CartDrawer />
    </div>
  );
}
