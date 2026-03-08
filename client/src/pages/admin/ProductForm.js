import React, { useState, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsAPI } from "../../api";
import toast from "react-hot-toast";
import {
  FiUpload, FiX, FiChevronLeft, FiChevronRight,
  FiStar, FiAlertCircle, FiLink, FiTrash2
} from "react-icons/fi";

const CATEGORIES = ["Electronics","Clothing","Books","Home & Garden","Sports","Beauty","Toys","Automotive","Food","Other"];

// Compress image to max 800px and convert to base64
function compressImage(file, maxWidth = 800, quality = 0.75) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > maxWidth) { height = (height * maxWidth) / width; width = maxWidth; }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function ImageCarousel({ images, onRemove }) {
  const [current, setCurrent] = useState(0);
  if (images.length === 0) return null;
  const prev = () => setCurrent(i => (i - 1 + images.length) % images.length);
  const next = () => setCurrent(i => (i + 1) % images.length);
  return (
    <div>
      <div className="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden">
        <img src={images[current].url} alt="" className="w-full h-full object-cover"/>
        <button type="button" onClick={() => { onRemove(current); setCurrent(Math.max(0, current-1)); }}
          className="absolute top-3 right-3 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg">
          <FiX size={14}/>
        </button>
        <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">
          {current+1} / {images.length}
        </div>
        {images.length > 1 && <>
          <button type="button" onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 w-9 h-9 rounded-full flex items-center justify-center shadow-md hover:bg-white">
            <FiChevronLeft size={18}/>
          </button>
          <button type="button" onClick={next} className="absolute right-12 top-1/2 -translate-y-1/2 bg-white/90 w-9 h-9 rounded-full flex items-center justify-center shadow-md hover:bg-white">
            <FiChevronRight size={18}/>
          </button>
        </>}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button key={i} type="button" onClick={() => setCurrent(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${i === current ? "border-gray-900" : "border-transparent hover:border-gray-300"}`}>
              <img src={img.url} alt="" className="w-full h-full object-cover"/>
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
  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);

  const { data: editData } = useQuery({
    queryKey: ["product-edit", id],
    queryFn: () => productsAPI.getById(id).then(r => r.data),
    enabled: isEdit,
  });

  React.useEffect(() => {
    if (editData?.product) {
      const p = editData.product;
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
  }, [editData]);

  const saveMutation = useMutation({
    mutationFn: (data) => isEdit ? productsAPI.update(id, data) : productsAPI.create(data),
    onSuccess: () => {
      toast.success(isEdit ? "Product updated!" : "Product created!");
      queryClient.invalidateQueries(["admin-products"]);
      navigate("/admin/products");
    },
    onError: (err) => toast.error(err.message || "Failed to save product")
  });

  // Upload via file — compress first, then try Cloudinary, fallback to base64
  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 6) { toast.error("Max 6 images"); return; }
    setUploading(true);
    for (const file of files) {
      try {
        // Compress to max 800px, 75% quality
        const compressed = await compressImage(file, 800, 0.75);

        // Try Cloudinary upload
        let imageUrl = compressed; // fallback to base64
        try {
          const token = JSON.parse(localStorage.getItem("auth-storage") || "{}")?.state?.token;
          const res = await fetch(`${process.env.REACT_APP_API_URL}/upload`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ image: compressed }),
          });
          const data = await res.json();
          if (res.ok && data.url) {
            imageUrl = data.url; // use Cloudinary URL
            toast.success("Image uploaded to cloud ✓");
          } else {
            imageUrl = compressed; // use compressed base64
            toast("Image added locally (Cloudinary unavailable)", { icon: "ℹ️" });
          }
        } catch {
          imageUrl = compressed;
          toast("Image added locally", { icon: "ℹ️" });
        }

        setImages(prev => [...prev, {
          url: imageUrl,
          public_id: `img_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        }]);
      } catch (err) {
        toast.error(`Failed to process ${file.name}`);
      }
    }
    setUploading(false);
    e.target.value = "";
  };

  // Add image via URL
  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    if (images.length >= 6) { toast.error("Max 6 images"); return; }
    // Basic URL validation
    try { new URL(urlInput); } catch { toast.error("Invalid URL"); return; }
    setImages(prev => [...prev, { url: urlInput.trim(), public_id: `url_${Date.now()}` }]);
    setUrlInput("");
    setShowUrlInput(false);
    toast.success("Image URL added!");
  };

  const removeImage = (index) => setImages(prev => prev.filter((_, i) => i !== index));

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Product name is required";
    if (!form.price || Number(form.price) <= 0) errs.price = "Valid price is required";
    if (!form.category) errs.category = "Category is required";
    if (form.stock === "" || form.stock === null) errs.stock = "Stock quantity is required";
    if (!form.description.trim()) errs.description = "Description is required";
    if (images.length === 0) errs.images = "At least one image is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) { toast.error("Please fix the errors"); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    saveMutation.mutate({
      ...form,
      price: Number(form.price),
      comparePrice: Number(form.comparePrice) || 0,
      stock: Number(form.stock),
      weight: Number(form.weight) || undefined,
      tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      images: images.map(img => ({ public_id: img.public_id || `img_${Date.now()}`, url: img.url, alt: form.name })),
    });
  };

  const set = (field) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm(prev => ({ ...prev, [field]: val }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const inputClass = (field) =>
    `w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 ${errors[field] ? "border-red-400 bg-red-50" : "border-gray-200"}`;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/admin/products" className="p-2 hover:bg-gray-100 rounded-xl"><FiChevronLeft size={20}/></Link>
        <div>
          <h1 className="text-xl font-black text-gray-900">{isEdit ? "Edit Product" : "Add New Product"}</h1>
          <p className="text-sm text-gray-500">Fields marked with <span className="text-red-500">*</span> are required</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left — Images */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-4">
                Images <span className="text-red-500">*</span>
                <span className="text-xs font-normal text-gray-400 ml-1">({images.length}/6)</span>
              </h2>

              <ImageCarousel images={images} onRemove={removeImage}/>

              {images.length < 6 && (
                <div className="space-y-2 mt-3">
                  {/* File upload */}
                  <button type="button" onClick={() => fileRef.current.click()} disabled={uploading}
                    className="w-full border-2 border-dashed border-gray-300 rounded-xl py-5 flex flex-col items-center gap-1.5 hover:border-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50">
                    {uploading
                      ? <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"/>
                      : <><FiUpload size={20} className="text-gray-400"/>
                         <span className="text-sm font-medium text-gray-600">Upload image</span>
                         <span className="text-xs text-gray-400">Auto-compressed · Max 6</span></>
                    }
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect}/>

                  {/* URL input */}
                  {!showUrlInput ? (
                    <button type="button" onClick={() => setShowUrlInput(true)}
                      className="w-full border border-gray-200 rounded-xl py-2.5 flex items-center justify-center gap-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors">
                      <FiLink size={14}/> Add image URL
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <input type="url" value={urlInput} onChange={e => setUrlInput(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-gray-900"
                        onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleAddUrl())}/>
                      <button type="button" onClick={handleAddUrl} className="bg-gray-900 text-white px-3 py-2 rounded-xl text-xs font-semibold">Add</button>
                      <button type="button" onClick={() => setShowUrlInput(false)} className="p-2 hover:bg-gray-100 rounded-xl"><FiX size={14}/></button>
                    </div>
                  )}
                </div>
              )}

              {errors.images && (
                <p className="flex items-center gap-1 text-red-500 text-xs mt-2"><FiAlertCircle size={12}/>{errors.images}</p>
              )}

              {/* Quick URL suggestions */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-2">Quick sample images:</p>
                <div className="space-y-1">
                  {[
                    { label: "📱 iPhone", url: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800" },
                    { label: "👟 Shoes", url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800" },
                    { label: "🎧 Headphones", url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800" },
                    { label: "💻 Laptop", url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800" },
                  ].map(({ label, url }) => (
                    <button key={label} type="button"
                      onClick={() => { if (images.length < 6) { setImages(prev => [...prev, { url, public_id: `sample_${Date.now()}` }]); toast.success(`${label} image added!`); } }}
                      className="w-full text-left text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors">
                      + {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
              <h2 className="font-bold text-gray-900">Status</h2>
              {[
                { field: "isActive", label: "Active", desc: "Visible to customers" },
                { field: "featured", label: "Featured", desc: "Show on homepage" },
              ].map(({ field, label, desc }) => (
                <label key={field} className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{label}</p>
                    <p className="text-xs text-gray-400">{desc}</p>
                  </div>
                  <div className={`w-11 h-6 rounded-full transition-colors relative ${form[field] ? "bg-gray-900" : "bg-gray-200"}`}
                    onClick={() => setForm(prev => ({ ...prev, [field]: !prev[field] }))}>
                    <input type="checkbox" checked={form[field]} onChange={set(field)} className="sr-only"/>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform shadow ${form[field] ? "translate-x-6" : "translate-x-1"}`}/>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Right — Details */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-5">Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Product Name <span className="text-red-500">*</span></label>
                  <input type="text" value={form.name} onChange={set("name")} placeholder="e.g. Apple iPhone 15 Pro" className={inputClass("name")}/>
                  {errors.name && <p className="flex items-center gap-1 text-red-500 text-xs mt-1"><FiAlertCircle size={12}/>{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Short Description</label>
                  <input type="text" value={form.shortDescription} onChange={set("shortDescription")} placeholder="Brief one-line description" maxLength={150} className={inputClass("shortDescription")}/>
                  <p className="text-xs text-gray-400 mt-1">{form.shortDescription.length}/150</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Full Description <span className="text-red-500">*</span></label>
                  <textarea value={form.description} onChange={set("description")} placeholder="Detailed product description..." rows={5} className={`${inputClass("description")} resize-none`}/>
                  {errors.description && <p className="flex items-center gap-1 text-red-500 text-xs mt-1"><FiAlertCircle size={12}/>{errors.description}</p>}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-5">Pricing & Inventory</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Price ($) <span className="text-red-500">*</span></label>
                  <input type="number" value={form.price} onChange={set("price")} placeholder="0.00" min="0" step="0.01" className={inputClass("price")}/>
                  {errors.price && <p className="flex items-center gap-1 text-red-500 text-xs mt-1"><FiAlertCircle size={12}/>{errors.price}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Compare Price ($)</label>
                  <input type="number" value={form.comparePrice} onChange={set("comparePrice")} placeholder="0.00" min="0" step="0.01" className={inputClass("comparePrice")}/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Stock Quantity <span className="text-red-500">*</span></label>
                  <input type="number" value={form.stock} onChange={set("stock")} placeholder="0" min="0" className={inputClass("stock")}/>
                  {errors.stock && <p className="flex items-center gap-1 text-red-500 text-xs mt-1"><FiAlertCircle size={12}/>{errors.stock}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">SKU</label>
                  <input type="text" value={form.sku} onChange={set("sku")} placeholder="e.g. APPLE-IP15-PRO" className={inputClass("sku")}/>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-5">Organisation</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Category <span className="text-red-500">*</span></label>
                  <select value={form.category} onChange={set("category")} className={inputClass("category")}>
                    <option value="">Select category...</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.category && <p className="flex items-center gap-1 text-red-500 text-xs mt-1"><FiAlertCircle size={12}/>{errors.category}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Brand</label>
                  <input type="text" value={form.brand} onChange={set("brand")} placeholder="e.g. Apple" className={inputClass("brand")}/>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Tags <span className="text-gray-400 font-normal">(comma separated)</span></label>
                  <input type="text" value={form.tags} onChange={set("tags")} placeholder="e.g. phone, apple, 5g" className={inputClass("tags")}/>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pb-6">
              <Link to="/admin/products" className="flex-1 border border-gray-200 text-gray-700 py-4 rounded-xl font-semibold text-sm text-center hover:bg-gray-50">Cancel</Link>
              <button type="submit" disabled={saveMutation.isPending}
                className="flex-1 bg-gray-900 text-white py-4 rounded-xl font-bold text-sm hover:bg-gray-700 disabled:opacity-60 flex items-center justify-center gap-2">
                {saveMutation.isPending
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Saving...</>
                  : isEdit ? "Update Product" : "Create Product"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}