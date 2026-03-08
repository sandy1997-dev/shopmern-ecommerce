import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { adminAPI } from "../../api";
import { FiTrendingUp, FiTrendingDown, FiPackage, FiShoppingBag, FiUsers, FiDollarSign } from "react-icons/fi";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const STATUS_COLORS = {
  pending: "#f59e0b", processing: "#3b82f6", shipped: "#8b5cf6",
  delivered: "#10b981", cancelled: "#ef4444", refunded: "#6b7280",
};

function StatCard({ title, value, subtitle, icon: Icon, trend, trendValue }) {
  const isPositive = trend === "up";
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-gray-100 rounded-xl">
          <Icon size={22} className="text-gray-700" />
        </div>
        {trendValue !== undefined && trendValue !== null && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
            isPositive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}>
            {isPositive ? <FiTrendingUp size={12} /> : <FiTrendingDown size={12} />}
            {Math.abs(trendValue)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-black text-gray-900 mb-1">{value}</p>
      <p className="text-sm font-medium text-gray-700">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => adminAPI.getDashboard().then((r) => r.data),
    refetchInterval: 60000,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="p-6 text-red-500 font-bold">Failed to load dashboard data. Please check your backend connection.</div>;

  // ✨ THE FIX: Add safe fallbacks for EVERY piece of data so it never crashes!
  const stats = data?.stats || {};
  const charts = data?.charts || {};
  const topProducts = data?.topProducts || [];
  const lowStock = data?.lowStock || [];
  const recentOrders = data?.recentOrders || [];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={`$${(stats.totalRevenue || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          subtitle={`$${(stats.monthRevenue || 0).toFixed(2)} this month`}
          icon={FiDollarSign}
          trend={(stats.revenueGrowth || 0) >= 0 ? "up" : "down"}
          trendValue={stats.revenueGrowth || 0}
        />
        <StatCard
          title="Total Orders"
          value={(stats.totalOrders || 0).toLocaleString()}
          subtitle={`${stats.monthOrders || 0} this month`}
          icon={FiShoppingBag}
        />
        <StatCard
          title="Products"
          value={(stats.totalProducts || 0).toLocaleString()}
          subtitle={`${lowStock.length} low stock`}
          icon={FiPackage}
        />
        <StatCard
          title="Customers"
          value={(stats.totalUsers || 0).toLocaleString()}
          subtitle="Registered users"
          icon={FiUsers}
        />
      </div>

      {/* Revenue chart + Orders by status */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue area chart */}
        <div className="xl:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-gray-900">Revenue (Last 30 Days)</h3>
            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">Daily</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={charts.revenueByDay || []}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1f2937" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#1f2937" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
                tickFormatter={(v) => v ? v.slice(5) : ""} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
                tickFormatter={(v) => `$${v}`} />
              <Tooltip
                formatter={(v) => [`$${Number(v).toFixed(2)}`, "Revenue"]}
                contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#1f2937" strokeWidth={2}
                fill="url(#revenueGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Orders by status pie */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-base font-bold text-gray-900 mb-6">Orders by Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={charts.ordersByStatus || []} dataKey="count" nameKey="_id"
                cx="50%" cy="50%" outerRadius={70} label={false}>
                {(charts.ordersByStatus || []).map((entry) => (
                  <Cell key={entry._id} fill={STATUS_COLORS[entry._id] || "#6b7280"} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v, n) => [v, n]}
                contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {(charts.ordersByStatus || []).map((s) => (
              <div key={s._id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS[s._id] || "#6b7280" }} />
                  <span className="capitalize text-gray-600">{s._id}</span>
                </div>
                <span className="font-semibold text-gray-900">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products + Low Stock + Recent Orders */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Top products */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900">Top Products</h3>
            <Link to="/admin/products" className="text-xs text-gray-500 hover:text-gray-900">View all →</Link>
          </div>
          <div className="space-y-3">
            {topProducts.length === 0 ? <p className="text-sm text-gray-400">No product data</p> : null}
            {topProducts.map((p, i) => (
              <div key={p._id} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-400 w-4">#{i + 1}</span>
                <img src={p.images?.[0]?.url || "https://placehold.co/40x40"}
                  alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.sold || 0} sold · ⭐ {p.rating || 0}</p>
                </div>
                <span className="text-sm font-bold text-gray-900">${(p.price || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Low stock */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900">Low Stock</h3>
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
              {lowStock.length} items
            </span>
          </div>
          <div className="space-y-2">
            {lowStock.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">All products well stocked ✓</p>
            ) : (
              lowStock.map((p) => (
                <div key={p._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate max-w-[160px]">{p.name}</p>
                    {p.sku && <p className="text-xs text-gray-400">SKU: {p.sku}</p>}
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    p.stock === 0 ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent orders */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900">Recent Orders</h3>
            <Link to="/admin/orders" className="text-xs text-gray-500 hover:text-gray-900">View all →</Link>
          </div>
          <div className="space-y-3">
            {recentOrders.length === 0 ? <p className="text-sm text-gray-400">No recent orders</p> : null}
            {recentOrders.map((o) => (
              <div key={o._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-mono font-medium text-gray-900">{o.orderNumber || "N/A"}</p>
                  <p className="text-xs text-gray-400">{o.user?.name || "Guest"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">${(o.totalPrice || 0).toFixed(2)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    o.orderStatus === "delivered" ? "bg-green-100 text-green-700" :
                    o.orderStatus === "pending" ? "bg-yellow-100 text-yellow-700" :
                    o.orderStatus === "cancelled" ? "bg-red-100 text-red-700" :
                    "bg-blue-100 text-blue-700"
                  }`}>
                    {o.orderStatus || "Processing"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}