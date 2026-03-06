// Simple stubs for remaining pages - each would be fully implemented
import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ordersAPI, productsAPI, adminAPI, authAPI } from "../api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { FiPackage, FiExternalLink } from "react-icons/fi";

export function Orders() {
  const { data, isLoading } = useQuery({ queryKey: ["my-orders"], queryFn: () => ordersAPI.getMyOrders().then(r => r.data) });
  if (isLoading) return <LoadingSpinner />;
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-black text-gray-900 mb-8">My Orders</h1>
      {data?.orders?.length === 0 ? (
        <div className="text-center py-20"><FiPackage size={48} className="mx-auto text-gray-300 mb-4" /><p className="text-gray-500">No orders yet</p><Link to="/products" className="mt-4 inline-block bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-semibold">Start Shopping</Link></div>
      ) : (
        <div className="space-y-4">
          {data?.orders?.map((order) => (
            <Link key={order._id} to={`/orders/${order._id}`} className="block bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:border-gray-300 transition-colors">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="font-mono font-bold text-gray-900">{order.orderNumber}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{new Date(order.createdAt).toLocaleDateString()} · {order.items.length} items</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-gray-900 text-lg">${order.totalPrice.toFixed(2)}</p>
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                    order.orderStatus === "delivered" ? "bg-green-100 text-green-700" :
                    order.orderStatus === "pending" ? "bg-yellow-100 text-yellow-700" :
                    order.orderStatus === "cancelled" ? "bg-red-100 text-red-700" :
                    "bg-blue-100 text-blue-700"}`}>
                    {order.orderStatus}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function OrderDetail() {
  const id = window.location.pathname.split("/").pop();
  const { data, isLoading } = useQuery({ queryKey: ["order", id], queryFn: () => ordersAPI.getById(id).then(r => r.data) });
  if (isLoading) return <LoadingSpinner />;
  const order = data?.order;
  if (!order) return <div className="text-center py-20 text-gray-500">Order not found</div>;
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-black text-gray-900 mb-2">Order {order.orderNumber}</h1>
      <p className="text-gray-500 mb-8">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
      <div className="space-y-4">
        {order.items.map((item, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex gap-4">
            <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-xl" />
            <div className="flex-1"><p className="font-semibold text-gray-900">{item.name}</p><p className="text-sm text-gray-500">Qty: {item.quantity}</p><p className="font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p></div>
          </div>
        ))}
      </div>
      <div className="mt-6 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex justify-between font-black text-gray-900 text-lg"><span>Total</span><span>${order.totalPrice.toFixed(2)}</span></div>
        <div className="mt-3">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            order.orderStatus === "delivered" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
            {order.orderStatus}
          </span>
        </div>
      </div>
    </div>
  );
}

export function OrderSuccess() {
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="text-6xl mb-6">🎉</div>
      <h1 className="text-3xl font-black text-gray-900 mb-3">Order Placed!</h1>
      <p className="text-gray-500 mb-8">Thank you for your purchase. You'll receive a confirmation email shortly.</p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link to="/orders" className="bg-gray-900 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-gray-700 transition-colors">View Orders</Link>
        <Link to="/products" className="border border-gray-200 text-gray-700 px-8 py-3.5 rounded-xl font-semibold hover:bg-gray-50 transition-colors">Continue Shopping</Link>
      </div>
    </div>
  );
}

export function Profile() {
  const { data, isLoading } = useQuery({ queryKey: ["profile"], queryFn: () => authAPI.getMe().then(r => r.data) });
  if (isLoading) return <LoadingSpinner />;
  const user = data?.user;
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-black text-gray-900 mb-8">My Profile</h1>
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center text-white text-2xl font-black">{user?.name?.charAt(0)}</div>
          <div><p className="font-bold text-gray-900 text-lg">{user?.name}</p><p className="text-gray-500">{user?.email}</p><span className={`text-xs px-2 py-0.5 rounded-full font-semibold mt-1 inline-block ${user?.role === "admin" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"}`}>{user?.role}</span></div>
        </div>
        <Link to="/orders" className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3"><FiPackage size={18} className="text-gray-600" /><span className="font-medium text-gray-900">My Orders</span></div>
          <FiExternalLink size={16} className="text-gray-400" />
        </Link>
      </div>
    </div>
  );
}

export function Wishlist() {
  const { data, isLoading } = useQuery({ queryKey: ["wishlist"], queryFn: () => authAPI.getMe().then(r => r.data) });
  if (isLoading) return <LoadingSpinner />;
  const wishlist = data?.user?.wishlist || [];
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-black text-gray-900 mb-8">Wishlist ({wishlist.length})</h1>
      {wishlist.length === 0 ? (
        <div className="text-center py-20 text-gray-500"><p className="mb-4">Your wishlist is empty</p><Link to="/products" className="bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-semibold">Browse Products</Link></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {wishlist.map((p) => (
            <Link key={p._id} to={`/products/${p._id}`} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm group">
              <div className="aspect-square bg-gray-50 overflow-hidden">
                <img src={p.images?.[0]?.url || "https://placehold.co/200x200"} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-4"><p className="font-semibold text-gray-900 line-clamp-2">{p.name}</p><p className="font-black text-gray-900 mt-1">${p.price}</p></div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProductDetail() {
  const id = window.location.pathname.split("/").pop();
  const { addItem, openCart } = require("../store").useCartStore();
  const { data, isLoading } = useQuery({ queryKey: ["product", id], queryFn: () => productsAPI.getById(id).then(r => r.data) });
  const toast = require("react-hot-toast").default;
  const [qty, setQty] = React.useState(1);
  if (isLoading) return <LoadingSpinner />;
  const product = data?.product;
  if (!product) return <div className="text-center py-20 text-gray-500">Product not found</div>;
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden">
          <img src={product.images?.[0]?.url || "https://placehold.co/500x500?text=Product"} alt={product.name} className="w-full h-full object-cover" />
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-2">{product.category}{product.brand ? ` · ${product.brand}` : ""}</p>
          <h1 className="text-3xl font-black text-gray-900 mb-3">{product.name}</h1>
          <div className="flex items-center gap-2 mb-5"><span className="text-yellow-400">★</span><span className="text-sm text-gray-600">{product.rating} ({product.numReviews} reviews)</span></div>
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-4xl font-black text-gray-900">${product.price}</span>
            {product.comparePrice > 0 && <span className="text-xl text-gray-400 line-through">${product.comparePrice}</span>}
          </div>
          <p className="text-gray-600 leading-relaxed mb-8">{product.description}</p>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-4 py-3 hover:bg-gray-50 font-bold">−</button>
              <span className="px-4 py-3 font-medium w-14 text-center">{qty}</span>
              <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="px-4 py-3 hover:bg-gray-50 font-bold">+</button>
            </div>
            <button onClick={() => { addItem(product, qty); toast.success("Added to cart!"); openCart(); }} disabled={product.stock === 0}
              className="flex-1 bg-gray-900 text-white py-3.5 rounded-xl font-bold hover:bg-gray-700 transition-colors disabled:opacity-40">
              {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
            </button>
          </div>
          <p className="text-sm text-gray-500">{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</p>
        </div>
      </div>
    </div>
  );
}

// Admin stub pages
export function AdminProducts() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-products"], queryFn: () => productsAPI.getAll({ limit: 20 }).then(r => r.data) });
  if (isLoading) return <LoadingSpinner />;
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Products ({data?.total})</h2>
        <Link to="/admin/products/new" className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors">+ Add Product</Link>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>{["Product","Category","Price","Stock","Status"].map(h => <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data?.products?.map((p) => (
              <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4"><div className="flex items-center gap-3"><img src={p.images?.[0]?.url || "https://placehold.co/40x40"} className="w-10 h-10 rounded-lg object-cover" /><span className="font-medium text-gray-900 line-clamp-1">{p.name}</span></div></td>
                <td className="px-5 py-4 text-gray-500">{p.category}</td>
                <td className="px-5 py-4 font-bold text-gray-900">${p.price}</td>
                <td className="px-5 py-4"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${p.stock === 0 ? "bg-red-100 text-red-700" : p.stock < 10 ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>{p.stock}</span></td>
                <td className="px-5 py-4"><Link to={`/admin/products/${p._id}/edit`} className="text-blue-600 hover:underline text-xs font-medium">Edit</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminOrders() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-orders"], queryFn: () => ordersAPI.getAll().then(r => r.data) });
  if (isLoading) return <LoadingSpinner />;
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Orders ({data?.total})</h2>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>{["Order","Customer","Date","Total","Status"].map(h => <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data?.orders?.map((o) => (
              <tr key={o._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4 font-mono font-medium text-gray-900 text-xs">{o.orderNumber}</td>
                <td className="px-5 py-4 text-gray-700">{o.user?.name}</td>
                <td className="px-5 py-4 text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                <td className="px-5 py-4 font-bold text-gray-900">${o.totalPrice.toFixed(2)}</td>
                <td className="px-5 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  o.orderStatus === "delivered" ? "bg-green-100 text-green-700" :
                  o.orderStatus === "pending" ? "bg-yellow-100 text-yellow-700" :
                  o.orderStatus === "cancelled" ? "bg-red-100 text-red-700" :
                  "bg-blue-100 text-blue-700"}`}>{o.orderStatus}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminUsers() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: () => adminAPI.getUsers().then(r => r.data) });
  if (isLoading) return <LoadingSpinner />;
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Users ({data?.total})</h2>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>{["Name","Email","Role","Joined"].map(h => <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data?.users?.map((u) => (
              <tr key={u._id} className="hover:bg-gray-50">
                <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-white text-xs font-bold">{u.name.charAt(0)}</div><span className="font-medium text-gray-900">{u.name}</span></div></td>
                <td className="px-5 py-4 text-gray-500">{u.email}</td>
                <td className="px-5 py-4"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.role === "admin" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"}`}>{u.role}</span></td>
                <td className="px-5 py-4 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminProductForm() {
  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Add / Edit Product</h2>
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {["Product Name","Brand","Price","Compare Price","Stock","SKU","Category","Description"].map((label) => (
            <div key={label} className={label === "Description" ? "sm:col-span-2" : ""}>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">{label}</label>
              {label === "Description" ? (
                <textarea rows={4} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              ) : (
                <input type="text" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              )}
            </div>
          ))}
        </div>
        <div className="mt-6 flex gap-3">
          <Link to="/admin/products" className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm text-center hover:bg-gray-50 transition-colors">Cancel</Link>
          <button className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-semibold text-sm hover:bg-gray-700 transition-colors">Save Product</button>
        </div>
      </div>
    </div>
  );
}
