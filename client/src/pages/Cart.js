// Cart.js
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCartStore } from "../store";
import { FiTrash2, FiPlus, FiMinus, FiShoppingBag, FiArrowRight } from "react-icons/fi";

export default function Cart() {
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();
  const navigate = useNavigate();
  const subtotal = items.reduce((a, i) => a + i.price * i.quantity, 0);
  const shipping = subtotal > 50 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  if (items.length === 0) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <FiShoppingBag size={64} className="mx-auto text-gray-300 mb-6" />
      <h2 className="text-2xl font-black text-gray-900 mb-2">Your cart is empty</h2>
      <p className="text-gray-500 mb-8">Looks like you haven't added anything yet.</p>
      <Link to="/products" className="bg-gray-900 text-white px-8 py-4 rounded-xl font-semibold hover:bg-gray-700 transition-colors">
        Start Shopping
      </Link>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-black text-gray-900">Shopping Cart ({items.length})</h1>
        <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-700 transition-colors">Clear cart</button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.key} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex gap-4">
              <img src={item.image || "https://placehold.co/100x100"} alt={item.name} className="w-24 h-24 object-cover rounded-xl" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{item.name}</h3>
                {item.variant && <p className="text-xs text-gray-400 mb-2">{item.variant.name}: {item.variant.value}</p>}
                <p className="text-lg font-black text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button onClick={() => removeItem(item.key)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <FiTrash2 size={16} />
                </button>
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                  <button onClick={() => updateQuantity(item.key, item.quantity - 1)} className="p-2 hover:bg-gray-50"><FiMinus size={14} /></button>
                  <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.key, item.quantity + 1)} className="p-2 hover:bg-gray-50"><FiPlus size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm h-fit">
          <h3 className="font-bold text-gray-900 mb-5">Order Summary</h3>
          <div className="space-y-3 text-sm mb-5">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-gray-600"><span>Shipping</span><span className={shipping === 0 ? "text-green-600 font-medium" : ""}>{shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}</span></div>
            <div className="flex justify-between text-gray-600"><span>Tax</span><span>${tax.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-gray-900 text-base pt-3 border-t border-gray-100"><span>Total</span><span>${total.toFixed(2)}</span></div>
          </div>
          <button onClick={() => navigate("/checkout")} className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-gray-700 transition-colors flex items-center justify-center gap-2">
            Checkout <FiArrowRight size={16} />
          </button>
          <Link to="/products" className="block text-center text-sm text-gray-500 hover:text-gray-900 mt-4 transition-colors">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
