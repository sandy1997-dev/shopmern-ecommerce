import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { productsAPI } from "../api";
import { useCartStore } from "../store";
import { FiArrowRight, FiShoppingBag, FiStar, FiTruck, FiShield, FiRefreshCw } from "react-icons/fi";
import toast from "react-hot-toast";

const CATEGORIES = [
  { name: "Electronics", emoji: "⚡", color: "bg-blue-50" },
  { name: "Clothing",    emoji: "👕", color: "bg-purple-50" },
  { name: "Books",       emoji: "📚", color: "bg-yellow-50" },
  { name: "Home & Garden", emoji: "🏠", color: "bg-green-50" },
  { name: "Sports",      emoji: "⚽", color: "bg-orange-50" },
  { name: "Beauty",      emoji: "✨", color: "bg-pink-50" },
];

function ProductCard({ product }) {
  const { addItem, openCart } = useCartStore();
  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  const handleAdd = () => {
    addItem(product);
    toast.success(`${product.name} added to cart`);
    openCart();
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group"
    >
      <Link to={`/products/${product._id}`} className="block relative">
        <div className="aspect-square overflow-hidden bg-gray-50">
          <img
            src={product.images?.[0]?.url || "https://placehold.co/300x300?text=Product"}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        {discount > 0 && (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            -{discount}%
          </span>
        )}
        {product.featured && (
          <span className="absolute top-3 right-3 bg-gray-900 text-white text-xs font-bold px-2 py-1 rounded-full">
            Featured
          </span>
        )}
      </Link>
      <div className="p-4">
        <Link to={`/products/${product._id}`}>
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 hover:text-gray-600 transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-1 mb-3">
          <FiStar size={13} className="text-yellow-400 fill-yellow-400" />
          <span className="text-xs text-gray-500">{product.rating} ({product.numReviews})</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-black text-gray-900">${product.price}</span>
            {product.comparePrice > 0 && (
              <span className="text-sm text-gray-400 line-through ml-2">${product.comparePrice}</span>
            )}
          </div>
          <button
            onClick={handleAdd}
            disabled={product.stock === 0}
            className="p-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FiShoppingBag size={16} />
          </button>
        </div>
        {product.stock === 0 && (
          <p className="text-xs text-red-500 mt-1 font-medium">Out of stock</p>
        )}
      </div>
    </motion.div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { data: featuredData } = useQuery({
    queryKey: ["featured-products"],
    queryFn: () => productsAPI.getFeatured().then((r) => r.data),
  });

  return (
    <div>
      {/* ── HERO ── */}
      <section className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <span className="inline-block text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">
                Full-Stack MERN E-Commerce
              </span>
              <h1 className="text-5xl md:text-7xl font-black leading-none tracking-tight mb-6">
                Shop the
                <span className="block text-transparent" style={{ WebkitTextStroke: "1px rgba(255,255,255,0.4)" }}>
                  Future
                </span>
              </h1>
              <p className="text-gray-400 text-lg leading-relaxed mb-10 max-w-lg">
                Discover thousands of products with seamless payments, real-time order tracking, and a premium shopping experience.
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => navigate("/products")}
                  className="flex items-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors"
                >
                  Shop Now <FiArrowRight size={16} />
                </button>
                <button
                  onClick={() => navigate("/products?featured=true")}
                  className="flex items-center gap-2 border border-gray-700 text-white px-8 py-4 rounded-xl font-semibold text-sm hover:border-gray-500 transition-colors"
                >
                  View Featured
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── TRUST BADGES ── */}
      <section className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: FiTruck, title: "Free Shipping", desc: "On orders over $50" },
              { icon: FiShield, title: "Secure Payment", desc: "Powered by Stripe" },
              { icon: FiRefreshCw, title: "Easy Returns", desc: "30-day return policy" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-4">
                <div className="p-3 bg-gray-100 rounded-xl">
                  <Icon size={20} className="text-gray-700" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{title}</p>
                  <p className="text-gray-500 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-gray-900">Shop by Category</h2>
          <Link to="/products" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">
            All categories <FiArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map(({ name, emoji, color }) => (
            <Link
              key={name}
              to={`/products?category=${encodeURIComponent(name)}`}
              className={`${color} rounded-2xl p-6 text-center hover:shadow-md transition-all hover:-translate-y-1`}
            >
              <div className="text-3xl mb-2">{emoji}</div>
              <p className="text-sm font-semibold text-gray-700">{name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-gray-900">Featured Products</h2>
          <Link to="/products?featured=true" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">
            View all <FiArrowRight size={14} />
          </Link>
        </div>
        {featuredData?.products?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredData.products.slice(0, 8).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <FiShoppingBag size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium">No featured products yet</p>
            <p className="text-sm mt-1">Add products from the admin dashboard</p>
            <Link to="/admin" className="mt-4 inline-block bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors">
              Go to Admin
            </Link>
          </div>
        )}
      </section>

      {/* ── CTA BANNER ── */}
      <section className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-black mb-4">Ready to start selling?</h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            Built with React, Node.js, MongoDB & Stripe. Full source code available.
          </p>
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors"
          >
            Open Admin Dashboard <FiArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
