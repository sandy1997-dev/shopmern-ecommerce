import React, { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { paymentsAPI } from "../api";
import { FiCheckCircle, FiPackage, FiMail } from "react-icons/fi";

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const { data } = useQuery({
    queryKey: ["verify-session", sessionId],
    queryFn: () => paymentsAPI.verify(sessionId).then(r => r.data),
    enabled: !!sessionId,
  });

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="bg-green-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
        <FiCheckCircle size={48} className="text-green-500"/>
      </div>
      <h1 className="text-3xl font-black text-gray-900 mb-3">Order Placed!</h1>
      <p className="text-gray-500 mb-2 leading-relaxed">
        Thank you for your purchase! Your order has been confirmed and is being processed.
      </p>
      {data?.session?.customerEmail && (
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-8">
          <FiMail size={14}/>
          <span>Confirmation sent to <strong>{data.session.customerEmail}</strong></span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8 text-left">
        <h3 className="font-bold text-gray-900 mb-4">What happens next?</h3>
        <div className="space-y-3">
          {[
            { step: "1", text: "We're preparing your order for shipment" },
            { step: "2", text: "You'll receive a tracking number via email" },
            { step: "3", text: "Your order will be delivered to your address" },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-7 h-7 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{step}</div>
              {text}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link to="/orders" className="flex items-center justify-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-xl font-semibold hover:bg-gray-700 transition-colors">
          <FiPackage size={16}/> View My Orders
        </Link>
        <Link to="/products" className="border border-gray-200 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}