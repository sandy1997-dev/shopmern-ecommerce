import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCartStore } from "../../store";
import { FiX, FiPlus, FiMinus, FiTrash2, FiShoppingBag } from "react-icons/fi";

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, clearCart } = useCartStore();
  const navigate = useNavigate();
  const location = useLocation();

  // ✨ THE FIX: Instantly close the drawer ANY time the page URL changes
  useEffect(() => {
    if (isOpen) {
      closeCart();
    }
  }, [location.pathname, closeCart, isOpen]);

  const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const shipping = subtotal > 50 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const handleCheckout = () => {
    closeCart();
    navigate("/checkout");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={closeCart}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <FiShoppingBag size={20} className="text-gray-700" />
                <h2 className="text-lg font-bold text-gray-900">
                  Cart ({items.length})
                </h2>
              </div>
              <div className="flex items-center gap-3">
                {items.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={closeCart}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <FiShoppingBag size={48} className="text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium mb-1">Your cart is empty</p>
                  <p className="text-gray-400 text-sm mb-6">
                    Add some products to get started
                  </p>
                  <button
                    onClick={() => { closeCart(); navigate("/products"); }}
                    className="bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors"
                  >
                    Browse Products
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <motion.div
                      key={item.key}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex gap-4 bg-gray-50 rounded-xl p-3"
                    >
                      <img
                        src={item.image || "https://placehold.co/80x80?text=No+Image"}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">
                          {item.name}
                        </h4>
                        {item.variant && (
                          <p className="text-xs text-gray-500 mb-1">
                            {item.variant.name}: {item.variant.value}
                          </p>
                        )}
                        <p className="text-sm font-bold text-gray-900 mb-2">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden bg-white">
                            <button
                              onClick={() => updateQuantity(item.key, item.quantity - 1)}
                              className="p-1.5 hover:bg-gray-100 transition-colors"
                            >
                              <FiMinus size={12} />
                            </button>
                            <span className="w-8 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.key, item.quantity + 1)}
                              disabled={item.quantity >= item.maxStock}
                              className="p-1.5 hover:bg-gray-100 transition-colors disabled:opacity-40"
                            >
                              <FiPlus size={12} />
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.key)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Summary + Checkout */}
            {items.length > 0 && (
              <div className="border-t border-gray-100 px-6 py-4 space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className={shipping === 0 ? "text-green-600 font-medium" : ""}>
                      {shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax (8%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                {subtotal < 50 && (
                  <p className="text-xs text-center text-gray-500 bg-blue-50 rounded-lg px-3 py-2">
                    Add <strong>${(50 - subtotal).toFixed(2)}</strong> more for free shipping!
                  </p>
                )}

                <button
                  onClick={handleCheckout}
                  className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-gray-700 transition-colors"
                >
                  Checkout · ${total.toFixed(2)}
                </button>
                <button
                  onClick={() => { closeCart(); navigate("/products"); }}
                  className="w-full text-gray-600 text-sm hover:text-gray-900 transition-colors text-center py-1"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}