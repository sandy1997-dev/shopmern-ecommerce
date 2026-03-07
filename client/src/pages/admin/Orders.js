import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ordersAPI } from "../../api";
import toast from "react-hot-toast";
import { FiSearch, FiEye, FiEdit2, FiX, FiTruck, FiCheckCircle, FiClock, FiXCircle } from "react-icons/fi";

const STATUSES = ["pending","processing","shipped","delivered","cancelled","refunded"];
const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-700", processing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700", delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700", refunded: "bg-gray-100 text-gray-600",
};

function UpdateModal({ order, onClose, onUpdate }) {
  const [status, setStatus] = useState(order.orderStatus);
  const [note, setNote] = useState("");
  const [tracking, setTracking] = useState(order.trackingNumber || "");
  const [carrier, setCarrier] = useState(order.carrier || "");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900">Update Order {order.orderNumber}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><FiX size={18}/></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
              {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          {status === "shipped" && <>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Tracking Number</label>
              <input type="text" value={tracking} onChange={e => setTracking(e.target.value)} placeholder="e.g. 1Z999AA10123456784"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Carrier</label>
              <select value={carrier} onChange={e => setCarrier(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
                <option value="">Select carrier...</option>
                {["FedEx","UPS","USPS","DHL","India Post","Delhivery","BlueDart","Ekart"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </>}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Note (optional)</label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Dispatched from Mumbai warehouse"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"/>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50">Cancel</button>
          <button onClick={() => onUpdate({ status, note, trackingNumber: tracking, carrier })}
            className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-gray-700 transition-colors">
            Update Order
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrders() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [editOrder, setEditOrder] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", page, statusFilter, search],
    queryFn: () => ordersAPI.getAll({ page, limit: 15, status: statusFilter, search }).then(r => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }) => ordersAPI.updateStatus(id, payload),
    onSuccess: () => {
      toast.success("Order updated!");
      queryClient.invalidateQueries(["admin-orders"]);
      setEditOrder(null);
    },
    onError: () => toast.error("Failed to update order"),
  });

  return (
    <div>
      {editOrder && (
        <UpdateModal order={editOrder} onClose={() => setEditOrder(null)}
          onUpdate={(payload) => updateMutation.mutate({ id: editOrder._id, ...payload })}/>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-gray-900">Orders</h2>
          <p className="text-sm text-gray-500 mt-0.5">{data?.total || 0} total orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
          <input type="text" placeholder="Search by order number..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"/>
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900">
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {/* Status summary chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        {STATUSES.map(s => {
          const count = data?.orders?.filter(o => o.orderStatus === s).length || 0;
          if (!count) return null;
          return (
            <button key={s} onClick={() => setStatusFilter(s === statusFilter ? "" : s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${s === statusFilter ? "bg-gray-900 text-white" : STATUS_COLORS[s]}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)} ({count})
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin"/></div>
        ) : data?.orders?.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FiTruck size={40} className="mx-auto mb-3 opacity-30"/>
            <p className="font-semibold">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Order","Customer","Date","Items","Total","Status","Action"].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.orders.map((o) => (
                  <tr key={o._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-gray-900 text-xs">{o.orderNumber}</td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">{o.user?.name}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[140px]">{o.user?.email}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs">{new Date(o.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</td>
                    <td className="px-5 py-4 text-gray-600">{o.items?.length} item{o.items?.length > 1 ? "s" : ""}</td>
                    <td className="px-5 py-4 font-black text-gray-900">${o.totalPrice?.toFixed(2)}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[o.orderStatus]}`}>
                        {o.orderStatus}
                      </span>
                      {o.trackingNumber && <p className="text-xs text-gray-400 mt-1 font-mono">{o.trackingNumber}</p>}
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={() => setEditOrder(o)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                        <FiEdit2 size={13}/> Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data?.pages > 1 && (
        <div className="flex justify-center gap-2 mt-5">
          {Array.from({ length: data.pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors ${p === page ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"}`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}