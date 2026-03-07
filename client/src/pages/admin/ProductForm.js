import React, { useState, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsAPI, uploadAPI } from "../../api";
import toast from "react-hot-toast";
import { FiUpload, FiX, FiChevronLeft, FiChevronRight, FiStar, FiAlertCircle, FiPlus, FiTrash2 } from "react-icons/fi";

const CATEGORIES = ["Electronics","Clothing","Books","Home & Garden","Sports","Beauty","Toys","Automotive","Food","Other"];

const REQUIRED = ["name","price","category","stock","description"];

function ImageCarousel({ images, onRemove }) {
  const [current, setCurrent] = useState(0);
  if (images.length === 0) return null;
  const prev = () => setCurrent(i => (i - 1 + images.length) % images.length);
  const next = () => setCurrent(i => (i + 1) % images.length);

  return (
    <div className="relative">
      {/* Main image */}
      <div className="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden">
        <img src={images[current].url || images[current].preview} alt="" className="w-full h-full object-cover"/>
        {/* Remove button */}
        <button type="button" onClick={() => { onRemove(current); setCurrent(Math.max(0, current - 1)); }}
          className="absolute top-3 right-3 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg">
          <FiX size={14}/>
        </button>
        {/* Counter badge */}
        <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full font-medium">
          {current + 1} / {images.length}
        </div>
        {/* Nav arrows */}
        {images.length > 1 && <>
          <button type="button" onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-colors">
            <FiChevronLeft size={18}/>
          </button>
          <button type="button" onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-colors">
            <FiChevronRight size={18}/>
          </button>
        </>}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button key={i} type="button" onClick={() => setCurrent(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${i === current ? "border-gray-900" : "border-transparent hover:border-gray-300"}`}>
              <img src={img.url || img.preview} alt="" className="w-full h-full object-cover"/>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileRef = useRef();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: "", description: "", shortDescription: "",
    price: "", comparePrice: "", category: "", subcategory: "",
    brand: "", stock: "", sku: "", tags: "", weight: "",
    featured: false, isActive: true,
  });
  const [images, setImages] = useState([]); // { url, public_id, preview }
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);

  // Load existing product if editing
  useQuery({
    queryKey: ["product-edit", id],
    queryFn: () => productsAPI.getById(id).then(r => r.data),
    enabled: isEdit,
    onSuccess: (data) => {
      const p = data.product;
      setForm({
        name: p.name || "", description: p.description || "",
        shortDescription: p.shortDescription || "", price: p.price || "",
        comparePrice: p.comparePrice || "", category: p.category || "",
        subcategory: p.subcategory || "", brand: p.brand || "",
        stock: p.stock || "", sku: p.sku || "",
        tags: p.tags?.join(", ") || "", weight: p.weight || "",
        featured: p.featured || false, isActive: p.isActive !== false,
      });
      setImages(p.images || []);
    }
  });

  const saveMutation = useMutation({
    mutationFn: (data) => isEdit ? productsAPI.update(id, data) : productsAPI.create(data),
    onSuccess: () => {
      toast.success(isEdit ? "Product updated!" : "Product created!");
      queryClient.invalidateQueries(["admin-products"]);
      navigate("/admin/products");
    },
    onError: (err) => toast.error(err.message || "Failed to save product")
  });

  // Handle image file selection
  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 6) {
      toast.error("Maximum 6 images allowed");
      return;
    }

    setUploading(true);
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target.result;
        try {
          // Try Cloudinary upload
          const { data } = await uploadAPI.upload(base64);
          setImages(prev => [...prev, { url: data.url, public_id: data.public_id }]);
        } catch {
          // Fallback: use local preview (works without Cloudinary)
          setImages(prev => [...prev, { url: base64, preview: base64, public_id: `local_${Date.now()}` }]);
          toast("Image added (using local preview)", { icon: "ℹ️" });
        }
      };
      reader.readAsDataURL(file);
    }
    setUploading(false);
    e.target.value = "";
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Product name is required";
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0) errs.price = "Valid price is required";
    if (!form.category) errs.category = "Category is required";
    if (!form.stock && form.stock !== 0) errs.stock = "Stock quantity is required";
    if (!form.description.trim()) errs.description = "Description is required";
    if (images.length === 0) errs.images = "At least one image is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix the errors below");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const payload = {
      ...form,
      price: Number(form.price),
      comparePrice: Number(form.comparePrice) || 0,
      stock: Number(form.stock),
      weight: Number(form.weight) || undefined,
      tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      images: images.map(img => ({
        public_id: img.public_id || `img_${Date.now()}`,
        url: img.url,
        alt: form.name,
      })),
    };

    saveMutation.mutate(payload);
  };

  const set = (field) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm(prev => ({ ...prev, [field]: val }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const inputClass = (field) =>
    `w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition-colors ${errors[field] ? "border-red-400 bg-red-50 focus:ring-red-400" : "border-gray-200"}`;

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to="/admin/products" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <FiChevronLeft size={20}/>
        </Link>
        <div>
          <h1 className="text-xl font-black text-gray-900">{isEdit ? "Edit Product" : "Add New Product"}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Fields marked with <span className="text-red-500">*</span> are required</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column — Images */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-4">
                Product Images <span className="text-red-500">*</span>
                <span className="text-xs font-normal text-gray-400 ml-2">({images.length}/6)</span>
              </h2>

              {/* Carousel */}
              <ImageCarousel images={images} onRemove={removeImage}/>

              {/* Upload button */}
              {images.length < 6 && (
                <button type="button" onClick={() => fileRef.current.click()}
                  disabled={uploading}
                  className={`w-full mt-3 border-2 border-dashed rounded-xl py-6 flex flex-col items-center gap-2 transition-colors ${uploading ? "border-gray-200 bg-gray-50 cursor-wait" : "border-gray-300 hover:border-gray-900 hover:bg-gray-50 cursor-pointer"}`}>
                  {uploading ? (
                    <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"/>
                  ) : (
                    <>
                      <FiUpload size={22} className="text-gray-400"/>
                      <span className="text-sm font-medium text-gray-600">Click to upload images</span>
                      <span className="text-xs text-gray-400">PNG, JPG up to 5MB each</span>
                    </>
                  )}
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect}/>

              {errors.images && (
                <p className="flex items-center gap-1.5 text-red-500 text-xs mt-2">
                  <FiAlertCircle size={13}/>{errors.images}
                </p>
              )}
            </div>

            {/* Status toggles */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
              <h2 className="font-bold text-gray-900">Status</h2>
              {[
                { field: "isActive", label: "Active", desc: "Visible to customers" },
                { field: "featured", label: "Featured", desc: "Show on homepage", icon: FiStar },
              ].map(({ field, label, desc }) => (
                <label key={field} className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{label}</p>
                    <p className="text-xs text-gray-400">{desc}</p>
                  </div>
                  <div className={`w-11 h-6 rounded-full transition-colors relative ${form[field] ? "bg-gray-900" : "bg-gray-200"}`}>
                    <input type="checkbox" checked={form[field]} onChange={set(field)} className="sr-only"/>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${form[field] ? "translate-x-6" : "translate-x-1"}`}/>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Right column — Details */}
          <div className="lg:col-span-2 space-y-5">

            {/* Basic info */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-5">Basic Information</h2>
              <div className="space-y-4">

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={form.name} onChange={set("name")} placeholder="e.g. iPhone 15 Pro Max"
                    className={inputClass("name")}/>
                  {errors.name && <p className="flex items-center gap-1 text-red-500 text-xs mt-1"><FiAlertCircle size={12}/>{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    Short Description
                  </label>
                  <input type="text" value={form.shortDescription} onChange={set("shortDescription")}
                    placeholder="Brief one-line description (shown in cards)" maxLength={150}
                    className={inputClass("shortDescription")}/>
                  <p className="text-xs text-gray-400 mt-1">{form.shortDescription.length}/150</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    Full Description <span className="text-red-500">*</span>
                  </label>
                  <textarea value={form.description} onChange={set("description")}
                    placeholder="Detailed product description, features, specifications..."
                    rows={5} className={`${inputClass("description")} resize-none`}/>
                  {errors.description && <p className="flex items-center gap-1 text-red-500 text-xs mt-1"><FiAlertCircle size={12}/>{errors.description}</p>}
                </div>
              </div>
            </div>

            {/* Pricing & Inventory */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-5">Pricing & Inventory</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    Price ($) <span className="text-red-500">*</span>
                  </label>
                  <input type="number" value={form.price} onChange={set("price")} placeholder="0.00" min="0" step="0.01"
                    className={inputClass("price")}/>
                  {errors.price && <p className="flex items-center gap-1 text-red-500 text-xs mt-1"><FiAlertCircle size={12}/>{errors.price}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    Compare Price ($)
                    <span className="text-gray-400 font-normal ml-1">(original/strikethrough)</span>
                  </label>
                  <input type="number" value={form.comparePrice} onChange={set("comparePrice")} placeholder="0.00" min="0" step="0.01"
                    className={inputClass("comparePrice")}/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    Stock Quantity <span className="text-red-500">*</span>
                  </label>
                  <input type="number" value={form.stock} onChange={set("stock")} placeholder="0" min="0"
                    className={inputClass("stock")}/>
                  {errors.stock && <p className="flex items-center gap-1 text-red-500 text-xs mt-1"><FiAlertCircle size={12}/>{errors.stock}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">SKU</label>
                  <input type="text" value={form.sku} onChange={set("sku")} placeholder="e.g. IPHONE-15-PRO"
                    className={inputClass("sku")}/>
                </div>
              </div>
            </div>

            {/* Organisation */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-5">Organisation</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select value={form.category} onChange={set("category")} className={inputClass("category")}>
                    <option value="">Select category...</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.category && <p className="flex items-center gap-1 text-red-500 text-xs mt-1"><FiAlertCircle size={12}/>{errors.category}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Subcategory</label>
                  <input type="text" value={form.subcategory} onChange={set("subcategory")} placeholder="e.g. Smartphones"
                    className={inputClass("subcategory")}/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Brand</label>
                  <input type="text" value={form.brand} onChange={set("brand")} placeholder="e.g. Apple"
                    className={inputClass("brand")}/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Weight (grams)</label>
                  <input type="number" value={form.weight} onChange={set("weight")} placeholder="e.g. 200"
                    className={inputClass("weight")}/>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    Tags <span className="text-gray-400 font-normal">(comma separated)</span>
                  </label>
                  <input type="text" value={form.tags} onChange={set("tags")} placeholder="e.g. phone, apple, 5g, pro"
                    className={inputClass("tags")}/>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pb-6">
              <Link to="/admin/products" className="flex-1 border border-gray-200 text-gray-700 py-4 rounded-xl font-semibold text-sm text-center hover:bg-gray-50 transition-colors">
                Cancel
              </Link>
              <button type="submit" disabled={saveMutation.isPending}
                className="flex-2 flex-1 bg-gray-900 text-white py-4 rounded-xl font-bold text-sm hover:bg-gray-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {saveMutation.isPending ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Saving...</>
                ) : (
                  isEdit ? "Update Product" : "Create Product"
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}