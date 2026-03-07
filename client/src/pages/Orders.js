import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ordersAPI } from "../api";
import { FiPackage, FiChevronRight, FiClock, FiTruck, FiCheckCircle, FiXCircle } from "react-icons/fi";

const STATUS_CONFIG = {
  pending:    { icon: FiClock,        color: "bg-yellow-100 text-yellow-700", label: "Pending" },
  processing: { icon: FiClock,        color: "bg-blue-100 text-blue-700",     label: "Processing" },
  shipped:    { icon: FiTruck,        color: "bg-purple-100 text-purple-700", label: "Shipped" },
  delivered:  { icon: FiCheckCircle,  color: "bg-green-100 text-green-700",   label: "Delivered" },
  cancelled:  { icon: FiXCircle,      color: "bg-red-100 text-red-700",       label: "Cancelled" },
  refunded:   { icon: FiXCircle,      color: "bg-gray-100 text-gray-700",     label: "Refunded" },
};

export default function Orders() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["my-orders", page],
    queryFn: () => ordersAPI.getMyOrders({ page, limit: 10 }).then(r => r.data),
  });

  if (isLoading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin"/></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-black text-gray-900 mb-2">My Orders</h1>
      <p className="text-gray-500 text-sm mb-8">{data?.total || 0} orders total</p>

      {data?.orders?.length === 0 ? (
        <div className="text-center py-20">
          <FiPackage size={56} className="mx-auto text-gray-300 mb-4"/>
          <p className="font-semibold text-gray-700 mb-1">No orders yet</p>
          <p className="text-gray-400 text-sm mb-6">Your order history will appear here</p>
          <Link to="/products" className="bg-gray-900 text-white px-8 py-3 rounded-xl font-semibold text-sm hover:bg-gray-700 transition-colors">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {data.orders.map((order) => {
            const cfg = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG.pending;
            const Icon = cfg.icon;
            return (
              <Link key={order._id} to={`/orders/${order._id}`}
                className="block bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-gray-300 hover:shadow-md transition-all p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex -space-x-2">
                      {order.items.slice(0, 3).map((item, i) => (
                        <img key={i} src={item.image || "https://placehold.co/40x40"} alt={item.name}
                          className="w-12 h-12 rounded-xl object-cover border-2 border-white"/>
                      ))}
                      {order.items.length > 3 && (
                        <div className="w-12 h-12 rounded-xl bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-600">
                          +{order.items.length - 3}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-mono font-bold text-gray-900 text-sm">{order.orderNumber}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{new Date(order.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{order.items.length} item{order.items.length > 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-black text-gray-900">${order.totalPrice.toFixed(2)}</p>
                      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold mt-1 ${cfg.color}`}>
                        <Icon size={11}/>{cfg.label}
                      </span>
                    </div>
                    <FiChevronRight size={18} className="text-gray-400 flex-shrink-0"/>
                  </div>
                </div>
                {order.trackingNumber && (
                  <div className="mt-3 pt-3 border-t border-gray-50 text-xs text-gray-500">
                    Tracking: <span className="font-mono font-medium text-gray-700">{order.trackingNumber}</span>
                    {order.carrier && <span className="ml-2 text-gray-400">via {order.carrier}</span>}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {data?.pages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: data.pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-10 h-10 rounded-xl text-sm font-semibold transition-colors ${p === page ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"}`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}