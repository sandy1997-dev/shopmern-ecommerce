import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ordersAPI } from "../api";
import { useAuthStore } from "../store";
import toast from "react-hot-toast";
import { FiPackage, FiTruck, FiCheckCircle, FiXCircle, FiClock, FiArrowLeft, FiMapPin, FiCreditCard } from "react-icons/fi";

const STEPS = ["pending","processing","shipped","delivered"];

const STATUS_CONFIG = {
  pending:    { icon: FiClock,       color: "text-yellow-600 bg-yellow-50", label: "Pending" },
  processing: { icon: FiClock,       color: "text-blue-600 bg-blue-50",     label: "Processing" },
  shipped:    { icon: FiTruck,       color: "text-purple-600 bg-purple-50", label: "Shipped" },
  delivered:  { icon: FiCheckCircle, color: "text-green-600 bg-green-50",   label: "Delivered" },
  cancelled:  { icon: FiXCircle,     color: "text-red-600 bg-red-50",       label: "Cancelled" },
  refunded:   { icon: FiXCircle,     color: "text-gray-600 bg-gray-50",     label: "Refunded" },
};

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => ordersAPI.getById(id).then(r => r.data),
  });

  const cancelMutation = useMutation({
    mutationFn: () => ordersAPI.cancel(id, { reason: "Cancelled by customer" }),
    onSuccess: () => {
      toast.success("Order cancelled");
      queryClient.invalidateQueries(["order", id]);
      queryClient.invalidateQueries(["my-orders"]);
    },
    onError: (err) => toast.error(err.message || "Cannot cancel order")
  });

  if (isLoading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin"/></div>;

  const order = data?.order;
  if (!order) return <div className="text-center py-20 text-gray-500">Order not found</div>;

  const cfg = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;
  const currentStep = STEPS.indexOf(order.orderStatus);
  const isCancellable = ["pending","processing"].includes(order.orderStatus);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate("/orders")} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <FiArrowLeft size={20}/>
        </button>
        <div>
          <h1 className="text-xl font-black text-gray-900">Order {order.orderNumber}</h1>
          <p className="text-sm text-gray-500">Placed on {new Date(order.createdAt).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <div className={`ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${cfg.color}`}>
          <StatusIcon size={15}/>{cfg.label}
        </div>
      </div>

      {/* Progress tracker — only for non-cancelled */}
      {!["cancelled","refunded"].includes(order.orderStatus) && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-5">
          <h2 className="font-bold text-gray-900 mb-5">Order Progress</h2>
          <div className="flex items-center">
            {STEPS.map((step, i) => {
              const done = i <= currentStep;
              const active = i === currentStep;
              return (
                <React.Fragment key={step}>
                  <div className="flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${done ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-400"} ${active ? "ring-4 ring-gray-200" : ""}`}>
                      {done && i < currentStep ? "✓" : i + 1}
                    </div>
                    <span className={`text-xs mt-2 font-medium capitalize ${done ? "text-gray-900" : "text-gray-400"}`}>{step}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 rounded-full ${i < currentStep ? "bg-gray-900" : "bg-gray-100"}`}/>
                  )}
                </React.Fragment>
              );
            })}
          </div>
          {order.trackingNumber && (
            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-2 text-sm">
              <FiTruck size={15} className="text-gray-500"/>
              <span className="text-gray-600">Tracking:</span>
              <span className="font-mono font-bold text-gray-900">{order.trackingNumber}</span>
              {order.carrier && <span className="text-gray-400">· {order.carrier}</span>}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Items */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="font-bold text-gray-900 flex items-center gap-2"><FiPackage size={16}/>Items ({order.items.length})</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {order.items.map((item, i) => (
                <div key={i} className="flex gap-4 p-5">
                  <img src={item.image || "https://placehold.co/80x80"} alt={item.name} className="w-20 h-20 object-cover rounded-xl flex-shrink-0"/>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 line-clamp-2">{item.name}</p>
                    {item.variant?.name && <p className="text-xs text-gray-500 mt-0.5">{item.variant.name}: {item.variant.value}</p>}
                    <p className="text-sm text-gray-500 mt-1">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                  </div>
                  <p className="font-black text-gray-900 flex-shrink-0">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping address */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4"><FiMapPin size={16}/>Shipping Address</h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-semibold text-gray-900">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.street}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
              <p>{order.shippingAddress.country}</p>
              {order.shippingAddress.phone && <p className="text-gray-500">{order.shippingAddress.phone}</p>}
            </div>
          </div>

          {/* Payment info */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4"><FiCreditCard size={16}/>Payment</h2>
            <div className="text-sm space-y-1">
              <div className="flex justify-between text-gray-600"><span>Method</span><span className="font-medium capitalize">{order.paymentInfo?.method || "Card"}</span></div>
              <div className="flex justify-between text-gray-600"><span>Status</span>
                <span className={`font-semibold ${order.isPaid ? "text-green-600" : "text-red-500"}`}>{order.isPaid ? "✓ Paid" : "Unpaid"}</span>
              </div>
              {order.paidAt && <div className="flex justify-between text-gray-600"><span>Paid on</span><span>{new Date(order.paidAt).toLocaleDateString()}</span></div>}
            </div>
          </div>
        </div>

        {/* Summary + actions */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>${order.itemsPrice.toFixed(2)}</span></div>
              <div className="flex justify-between text-gray-600"><span>Shipping</span><span className={order.shippingPrice === 0 ? "text-green-600" : ""}>{order.shippingPrice === 0 ? "FREE" : `$${order.shippingPrice.toFixed(2)}`}</span></div>
              <div className="flex justify-between text-gray-600"><span>Tax</span><span>${order.taxPrice.toFixed(2)}</span></div>
              {order.discountAmount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-${order.discountAmount.toFixed(2)}</span></div>}
              <div className="flex justify-between font-black text-gray-900 text-base pt-2 border-t border-gray-100"><span>Total</span><span>${order.totalPrice.toFixed(2)}</span></div>
            </div>
          </div>

          {/* Status history */}
          {order.statusHistory?.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-4">Status History</h2>
              <div className="space-y-3">
                {[...order.statusHistory].reverse().map((s, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-gray-400 mt-1.5 flex-shrink-0"/>
                    <div>
                      <p className="font-semibold text-gray-900 capitalize">{s.status}</p>
                      {s.note && <p className="text-gray-500 text-xs">{s.note}</p>}
                      <p className="text-gray-400 text-xs">{new Date(s.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {isCancellable && (
              <button onClick={() => { if(window.confirm("Cancel this order?")) cancelMutation.mutate(); }}
                disabled={cancelMutation.isPending}
                className="w-full border border-red-200 text-red-600 py-3 rounded-xl font-semibold text-sm hover:bg-red-50 transition-colors disabled:opacity-60">
                {cancelMutation.isPending ? "Cancelling..." : "Cancel Order"}
              </button>
            )}
            <Link to="/products" className="block text-center w-full border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}