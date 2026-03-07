import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsAPI } from "../../api";
import toast from "react-hot-toast";
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiStar, FiPackage, FiAlertTriangle } from "react-icons/fi";

export default function AdminProducts() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-products", page, search, category],
    queryFn: () => productsAPI.getAll({ page, limit: 15, keyword: search, category }).then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => productsAPI.delete(id),
    onSuccess: () => { toast.success("Product removed"); queryClient.invalidateQueries(["admin-products"]); },
    onError: () => toast.error("Failed to delete product"),
  });

  const handleDelete = (id, name) => {
    if (window.confirm(`Remove "${name}"? This will hide it from the store.`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-gray-900">Products</h2>
          <p className="text-sm text-gray-500 mt-0.5">{data?.total || 0} total products</p>
        </div>
        <Link to="/admin/products/new"
          className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors">
          <FiPlus size={16}/> Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
          <input type="text" placeholder="Search products..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"/>
        </div>
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900">
          <option value="">All Categories</option>
          {["Electronics","Clothing","Books","Home & Garden","Sports","Beauty","Toys","Automotive","Food","Other"].map(c =>
            <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin"/></div>
        ) : data?.products?.length === 0 ? (
          <div className="text-center py-16">
            <FiPackage size={40} className="mx-auto text-gray-300 mb-3"/>
            <p className="font-semibold text-gray-700">No products found</p>
            <Link to="/admin/products/new" className="mt-4 inline-block bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold">Add First Product</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Product","Category","Price","Stock","Status","Actions"].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.products.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img src={p.images?.[0]?.url || "https://placehold.co/48x48?text=?"} alt={p.name}
                          className="w-12 h-12 rounded-xl object-cover flex-shrink-0 bg-gray-100"/>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate max-w-[180px]">{p.name}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <FiStar size={11} className="text-yellow-400 fill-yellow-400"/>
                            <span className="text-xs text-gray-400">{p.rating} · {p.sold} sold</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-500">{p.category}</td>
                    <td className="px-5 py-4">
                      <div>
                        <span className="font-bold text-gray-900">${p.price}</span>
                        {p.comparePrice > 0 && <span className="text-xs text-gray-400 line-through ml-1">${p.comparePrice}</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        p.stock === 0 ? "bg-red-100 text-red-700" :
                        p.stock <= 10 ? "bg-yellow-100 text-yellow-700" :
                        "bg-green-100 text-green-700"}`}>
                        {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                      </span>
                      {p.stock <= 10 && p.stock > 0 && <FiAlertTriangle size={12} className="inline ml-1 text-yellow-500"/>}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold w-fit ${p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {p.isActive ? "Active" : "Hidden"}
                        </span>
                        {p.featured && <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 w-fit flex items-center gap-1"><FiStar size={10}/>Featured</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Link to={`/admin/products/${p._id}/edit`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                          <FiEdit2 size={15}/>
                        </Link>
                        <button onClick={() => handleDelete(p._id, p.name)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <FiTrash2 size={15}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
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