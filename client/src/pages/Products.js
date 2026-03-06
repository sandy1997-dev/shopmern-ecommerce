// Products.js
import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { productsAPI } from "../api";
import { useCartStore } from "../store";
import { FiFilter, FiGrid, FiList, FiStar, FiShoppingBag, FiSearch, FiX } from "react-icons/fi";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import LoadingSpinner from "../components/common/LoadingSpinner";

const CATEGORIES = ["Electronics","Clothing","Books","Home & Garden","Sports","Beauty","Toys","Automotive","Food","Other"];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
  { value: "bestselling", label: "Best Selling" },
];

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addItem, openCart } = useCartStore();
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("grid");

  const params = {
    keyword: searchParams.get("keyword") || "",
    category: searchParams.get("category") || "",
    sort: searchParams.get("sort") || "newest",
    page: Number(searchParams.get("page")) || 1,
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    featured: searchParams.get("featured") || "",
  };

  const { data, isLoading } = useQuery({
    queryKey: ["products", params],
    queryFn: () => productsAPI.getAll(params).then((r) => r.data),
  });

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.delete("page");
    setSearchParams(next);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900">
            {params.category || params.keyword ? (params.category || `Search: "${params.keyword}"`) : "All Products"}
          </h1>
          {data && <p className="text-sm text-gray-500 mt-1">{data.total} products found</p>}
        </div>
        <div className="flex items-center gap-3">
          <select
            value={params.sort}
            onChange={(e) => updateParam("sort", e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm border border-gray-200 rounded-xl px-4 py-2.5 bg-white hover:bg-gray-50 transition-colors">
            <FiFilter size={15} /> Filters
          </button>
          <div className="hidden sm:flex border border-gray-200 rounded-xl overflow-hidden">
            {[{ mode: "grid", Icon: FiGrid }, { mode: "list", Icon: FiList }].map(({ mode, Icon }) => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`p-2.5 ${viewMode === mode ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
                <Icon size={16} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Filters */}
        {showFilters && (
          <aside className="w-64 flex-shrink-0 space-y-6">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">Category</h3>
              <div className="space-y-2">
                <button onClick={() => updateParam("category", "")}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${!params.category ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
                  All Categories
                </button>
                {CATEGORIES.map((c) => (
                  <button key={c} onClick={() => updateParam("category", c)}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${params.category === c ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">Price Range</h3>
              <div className="flex gap-2">
                <input type="number" placeholder="Min" value={params.minPrice}
                  onChange={(e) => updateParam("minPrice", e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-900" />
                <input type="number" placeholder="Max" value={params.maxPrice}
                  onChange={(e) => updateParam("maxPrice", e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-900" />
              </div>
            </div>
          </aside>
        )}

        {/* Products Grid */}
        <div className="flex-1">
          {isLoading ? <LoadingSpinner /> : (
            <>
              {data?.products?.length === 0 ? (
                <div className="text-center py-20">
                  <FiSearch size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium">No products found</p>
                  <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
                </div>
              ) : (
                <div className={viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                  : "space-y-4"}>
                  {data?.products?.map((product) => (
                    <motion.div key={product._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group hover:-translate-y-1 transition-transform">
                      <Link to={`/products/${product._id}`} className="block aspect-square bg-gray-50 overflow-hidden">
                        <img src={product.images?.[0]?.url || "https://placehold.co/300x300?text=Product"}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </Link>
                      <div className="p-4">
                        <Link to={`/products/${product._id}`}>
                          <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2 hover:text-gray-600">{product.name}</h3>
                        </Link>
                        <div className="flex items-center gap-1 mb-3">
                          <FiStar size={12} className="text-yellow-400 fill-yellow-400" />
                          <span className="text-xs text-gray-400">{product.rating} ({product.numReviews})</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-black text-gray-900">${product.price}</span>
                          <button onClick={() => { addItem(product); toast.success("Added to cart"); openCart(); }}
                            disabled={product.stock === 0}
                            className="p-2 bg-gray-900 text-white rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-40">
                            <FiShoppingBag size={15} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {data?.pages > 1 && (
                <div className="flex justify-center gap-2 mt-10">
                  {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => { const next = new URLSearchParams(searchParams); next.set("page", p); setSearchParams(next); }}
                      className={`w-10 h-10 rounded-xl text-sm font-semibold transition-colors ${p === params.page ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"}`}>
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
