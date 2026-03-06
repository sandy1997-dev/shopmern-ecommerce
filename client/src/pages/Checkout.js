import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useCartStore, useAuthStore } from "../store";
import { paymentsAPI, ordersAPI } from "../api";
import toast from "react-hot-toast";
import { FiLock, FiTruck, FiCreditCard } from "react-icons/fi";

const CARD_STYLE = {
  style: {
    base: { fontSize: "15px", color: "#111827", fontFamily: "sans-serif", "::placeholder": { color: "#9ca3af" } },
    invalid: { color: "#ef4444" },
  },
};

const STEPS = ["Shipping", "Payment", "Review"];

export default function Checkout() {
  const stripe = useStripe();
  const elements = useElements();
  const { items, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [shipping, setShipping] = useState({
    fullName: user?.name || "", street: "", city: "", state: "",
    zipCode: "", country: "US", phone: "",
  });

  const subtotal = items.reduce((a, i) => a + i.price * i.quantity, 0);
  const shippingCost = subtotal > 50 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shippingCost + tax;

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    try {
      // 1. Create payment intent
      const { data: intentData } = await paymentsAPI.createIntent({ amount: total });

      // 2. Confirm card payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(intentData.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: { name: shipping.fullName, email: user.email },
        },
      });

      if (error) throw new Error(error.message);

      // 3. Create order
      const orderData = {
        items: items.map((i) => ({
          product: i.product, name: i.name, image: i.image,
          price: i.price, quantity: i.quantity, variant: i.variant,
        })),
        shippingAddress: shipping,
        paymentInfo: { id: paymentIntent.id, status: paymentIntent.status },
        itemsPrice: subtotal, taxPrice: tax,
        shippingPrice: shippingCost, totalPrice: total,
      };

      const { data: orderRes } = await ordersAPI.create(orderData);
      await ordersAPI.pay(orderRes.order._id, { id: paymentIntent.id, status: "succeeded" });

      clearCart();
      toast.success("Order placed successfully!");
      navigate(`/orders/${orderRes.order._id}`);
    } catch (err) {
      toast.error(err.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    navigate("/cart");
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-black text-gray-900 mb-8">Checkout</h1>

      {/* Steps */}
      <div className="flex items-center mb-10">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-2 text-sm font-semibold ${i <= step ? "text-gray-900" : "text-gray-400"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i < step ? "bg-green-500 text-white" : i === step ? "bg-gray-900 text-white" : "bg-gray-200 text-gray-500"}`}>
                {i < step ? "✓" : i + 1}
              </div>
              {s}
            </div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-3 ${i < step ? "bg-green-400" : "bg-gray-200"}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Step 0: Shipping */}
          {step === 0 && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <FiTruck size={18} className="text-gray-700" />
                <h2 className="font-bold text-gray-900">Shipping Address</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { field: "fullName", label: "Full Name", colSpan: "sm:col-span-2", placeholder: "John Doe" },
                  { field: "street", label: "Street Address", colSpan: "sm:col-span-2", placeholder: "123 Main St" },
                  { field: "city", label: "City", placeholder: "New York" },
                  { field: "state", label: "State", placeholder: "NY" },
                  { field: "zipCode", label: "ZIP Code", placeholder: "10001" },
                  { field: "country", label: "Country", placeholder: "US" },
                  { field: "phone", label: "Phone", placeholder: "+1 234 567 8900" },
                ].map(({ field, label, colSpan = "", placeholder }) => (
                  <div key={field} className={colSpan}>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">{label}</label>
                    <input type="text" value={shipping[field]} onChange={(e) => setShipping({ ...shipping, [field]: e.target.value })}
                      placeholder={placeholder}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                  </div>
                ))}
              </div>
              <button onClick={() => setStep(1)}
                className="mt-6 w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-gray-700 transition-colors">
                Continue to Payment
              </button>
            </div>
          )}

          {/* Step 1: Payment */}
          {step === 1 && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <FiCreditCard size={18} className="text-gray-700" />
                <h2 className="font-bold text-gray-900">Payment Details</h2>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-5 p-3 bg-gray-50 rounded-xl">
                <FiLock size={14} className="text-green-500" />
                Your payment is secured by Stripe. We never store card details.
              </div>
              <div className="border border-gray-200 rounded-xl p-4 mb-4">
                <CardElement options={CARD_STYLE} />
              </div>
              <p className="text-xs text-gray-400 mb-5">Test card: 4242 4242 4242 4242 · Any future date · Any 3 digits</p>
              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="flex-1 border border-gray-200 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
                  Back
                </button>
                <button onClick={() => setStep(2)} className="flex-1 bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-gray-700 transition-colors">
                  Review Order
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Review & Place */}
          {step === 2 && (
            <form onSubmit={handlePayment} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-6">Review Your Order</h2>
              <div className="space-y-3 mb-6">
                {items.map((item) => (
                  <div key={item.key} className="flex gap-3 py-3 border-b border-gray-50">
                    <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded-lg" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.name}</p>
                      <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)}
                  className="flex-1 border border-gray-200 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
                  Back
                </button>
                <button type="submit" disabled={loading || !stripe}
                  className="flex-1 bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-gray-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  <FiLock size={15} />
                  {loading ? "Processing..." : `Pay $${total.toFixed(2)}`}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Order summary sidebar */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm h-fit">
          <h3 className="font-bold text-gray-900 mb-4">Summary</h3>
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between text-gray-600"><span>Items ({items.length})</span><span>${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-gray-600"><span>Shipping</span><span className={shippingCost === 0 ? "text-green-600" : ""}>{shippingCost === 0 ? "FREE" : `$${shippingCost.toFixed(2)}`}</span></div>
            <div className="flex justify-between text-gray-600"><span>Tax</span><span>${tax.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-gray-900 text-base pt-3 border-t border-gray-100"><span>Total</span><span>${total.toFixed(2)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
