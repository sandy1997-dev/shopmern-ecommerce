import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { authAPI } from "../api";
import { useAuthStore } from "../store";
import toast from "react-hot-toast";
import { FiUser, FiMail, FiPhone, FiMapPin, FiLock, FiPackage, FiHeart, FiEdit2, FiSave, FiX } from "react-icons/fi";

export default function Profile() {
  const { user: authUser, updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [pwMode, setPwMode] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: { street: "", city: "", state: "", zipCode: "", country: "" } });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => authAPI.getMe().then(r => r.data),
    onSuccess: (data) => {
      const u = data.user;
      setForm({ name: u.name || "", phone: u.phone || "", address: { street: u.address?.street || "", city: u.address?.city || "", state: u.address?.state || "", zipCode: u.address?.zipCode || "", country: u.address?.country || "" } });
    }
  });

  const user = data?.user;

  React.useEffect(() => {
    if (user) {
      setForm({ name: user.name || "", phone: user.phone || "", address: { street: user.address?.street || "", city: user.address?.city || "", state: user.address?.state || "", zipCode: user.address?.zipCode || "", country: user.address?.country || "" } });
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: (data) => authAPI.updateProfile(data),
    onSuccess: (res) => {
      updateUser(res.data.user);
      queryClient.invalidateQueries(["profile"]);
      toast.success("Profile updated!");
      setEditMode(false);
    },
    onError: (err) => toast.error(err.message || "Update failed")
  });

  const pwMutation = useMutation({
    mutationFn: (data) => authAPI.changePassword(data),
    onSuccess: () => {
      toast.success("Password changed!");
      setPwMode(false);
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (err) => toast.error(err.message || "Failed to change password")
  });

  const handleSave = () => updateMutation.mutate(form);

  const handlePwSave = () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error("Passwords don't match");
    if (pwForm.newPassword.length < 6) return toast.error("Password must be at least 6 characters");
    pwMutation.mutate({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
  };

  if (isLoading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin"/></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-black text-gray-900 mb-8">My Profile</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left — Avatar + quick links */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
            <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center text-white text-3xl font-black mx-auto mb-3">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <p className="font-bold text-gray-900 text-lg">{user?.name}</p>
            <p className="text-gray-500 text-sm truncate">{user?.email}</p>
            <span className={`inline-block mt-2 text-xs px-3 py-1 rounded-full font-semibold ${user?.role === "admin" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"}`}>
              {user?.role}
            </span>
            <p className="text-xs text-gray-400 mt-2">Member since {new Date(user?.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {[
              { icon: FiPackage, label: "My Orders", href: "/orders" },
              { icon: FiHeart, label: "Wishlist", href: "/wishlist" },
              ...(user?.role === "admin" ? [{ icon: FiUser, label: "Admin Panel", href: "/admin" }] : [])
            ].map(({ icon: Icon, label, href }) => (
              <Link key={label} to={href} className="flex items-center gap-3 px-5 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors">
                <Icon size={16} className="text-gray-400" />{label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right — Edit form */}
        <div className="lg:col-span-2 space-y-5">

          {/* Personal Info */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900">Personal Information</h2>
              {!editMode ? (
                <button onClick={() => setEditMode(true)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                  <FiEdit2 size={14}/> Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setEditMode(false)} className="flex items-center gap-1 text-sm text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50">
                    <FiX size={14}/> Cancel
                  </button>
                  <button onClick={handleSave} disabled={updateMutation.isPending} className="flex items-center gap-1 text-sm bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-60">
                    <FiSave size={14}/> {updateMutation.isPending ? "Saving..." : "Save"}
                  </button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { field: "name", label: "Full Name", icon: FiUser, type: "text" },
                { field: "phone", label: "Phone Number", icon: FiPhone, type: "tel" },
              ].map(({ field, label, icon: Icon, type }) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
                  <div className="relative">
                    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15}/>
                    <input type={type} value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                      disabled={!editMode}
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-50 disabled:text-gray-500"/>
                  </div>
                </div>
              ))}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email Address</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15}/>
                  <input type="email" value={user?.email} disabled className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-500"/>
                </div>
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900 flex items-center gap-2"><FiMapPin size={16}/>Shipping Address</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { field: "street", label: "Street Address", colSpan: "sm:col-span-2" },
                { field: "city", label: "City" },
                { field: "state", label: "State" },
                { field: "zipCode", label: "ZIP Code" },
                { field: "country", label: "Country" },
              ].map(({ field, label, colSpan = "" }) => (
                <div key={field} className={colSpan}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
                  <input type="text" value={form.address[field]} onChange={(e) => setForm({ ...form, address: { ...form.address, [field]: e.target.value } })}
                    disabled={!editMode} placeholder={editMode ? `Enter ${label}` : "Not set"}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-50 disabled:text-gray-500"/>
                </div>
              ))}
            </div>
            {editMode && (
              <button onClick={handleSave} disabled={updateMutation.isPending} className="mt-4 bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-60">
                {updateMutation.isPending ? "Saving..." : "Save Address"}
              </button>
            )}
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900 flex items-center gap-2"><FiLock size={16}/>Change Password</h2>
              {!pwMode && (
                <button onClick={() => setPwMode(true)} className="flex items-center gap-2 text-sm text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                  <FiEdit2 size={14}/> Change
                </button>
              )}
            </div>
            {!pwMode ? (
              <p className="text-sm text-gray-500">••••••••••••</p>
            ) : (
              <div className="space-y-4">
                {[
                  { field: "currentPassword", label: "Current Password" },
                  { field: "newPassword", label: "New Password" },
                  { field: "confirmPassword", label: "Confirm New Password" },
                ].map(({ field, label }) => (
                  <div key={field}>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
                    <input type="password" value={pwForm[field]} onChange={(e) => setPwForm({ ...pwForm, [field]: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"/>
                  </div>
                ))}
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setPwMode(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
                  <button onClick={handlePwSave} disabled={pwMutation.isPending} className="flex-1 bg-gray-900 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 disabled:opacity-60">
                    {pwMutation.isPending ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}