import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAPI } from "../../api";
import { useAuthStore } from "../../store";
import toast from "react-hot-toast";
import { FiSearch, FiEdit2, FiTrash2, FiShield, FiUser, FiX } from "react-icons/fi";

function RoleModal({ user, onClose, onUpdate }) {
  const [role, setRole] = useState(user.role);
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900">Update Role</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><FiX size={18}/></button>
        </div>
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl mb-5">
          <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
        <div className="space-y-3 mb-6">
          {["user","admin"].map(r => (
            <label key={r} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${role === r ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"}`}>
              <input type="radio" value={r} checked={role === r} onChange={() => setRole(r)} className="sr-only"/>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${role === r ? "border-gray-900 bg-gray-900" : "border-gray-300"}`}>
                {role === r && <div className="w-2 h-2 bg-white rounded-full"/>}
              </div>
              <div>
                <p className="font-semibold text-gray-900 capitalize">{r}</p>
                <p className="text-xs text-gray-500">{r === "admin" ? "Full access to admin panel" : "Regular customer access"}</p>
              </div>
            </label>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm">Cancel</button>
          <button onClick={() => onUpdate(role)} className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-gray-700 transition-colors">Save Role</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [editUser, setEditUser] = useState(null);
  const { user: me } = useAuthStore();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", page, search, roleFilter],
    queryFn: () => adminAPI.getUsers({ page, limit: 15, search, role: roleFilter }).then(r => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, role }) => adminAPI.updateUser(id, { role }),
    onSuccess: () => { toast.success("Role updated!"); queryClient.invalidateQueries(["admin-users"]); setEditUser(null); },
    onError: () => toast.error("Failed to update role"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteUser(id),
    onSuccess: () => { toast.success("User deleted"); queryClient.invalidateQueries(["admin-users"]); },
    onError: (err) => toast.error(err.message || "Cannot delete user"),
  });

  const handleDelete = (id, name) => {
    if (id === me?._id) return toast.error("You cannot delete your own account");
    if (window.confirm(`Delete user "${name}"? This cannot be undone.`)) deleteMutation.mutate(id);
  };

  return (
    <div>
      {editUser && (
        <RoleModal user={editUser} onClose={() => setEditUser(null)}
          onUpdate={(role) => updateMutation.mutate({ id: editUser._id, role })}/>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-gray-900">Users</h2>
          <p className="text-sm text-gray-500 mt-0.5">{data?.total || 0} registered users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
          <input type="text" placeholder="Search by name or email..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"/>
        </div>
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900">
          <option value="">All Roles</option>
          <option value="user">Users</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin"/></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["User","Email","Role","Joined","Actions"].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.users?.map((u) => (
                  <tr key={u._id} className={`hover:bg-gray-50 transition-colors ${u._id === me?._id ? "bg-blue-50/30" : ""}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${u.role === "admin" ? "bg-gray-900" : "bg-gray-500"}`}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{u.name} {u._id === me?._id && <span className="text-xs text-blue-500">(you)</span>}</p>
                          {u.phone && <p className="text-xs text-gray-400">{u.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs">{u.email}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${u.role === "admin" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"}`}>
                        {u.role === "admin" ? <FiShield size={10}/> : <FiUser size={10}/>}
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs">{new Date(u.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditUser(u)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Change role">
                          <FiEdit2 size={14}/>
                        </button>
                        {u._id !== me?._id && (
                          <button onClick={() => handleDelete(u._id, u.name)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete user">
                            <FiTrash2 size={14}/>
                          </button>
                        )}
                      </div>
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