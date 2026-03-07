import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsAPI } from "../api";
import { useCartStore, useAuthStore } from "../store";
import toast from "react-hot-toast";
import { FiStar, FiShoppingBag, FiHeart, FiShare2, FiArrowLeft, FiTruck, FiShield, FiRefreshCw, FiMinus, FiPlus } from "react-icons/fi";

function StarRating({ rating, onRate, interactive = false }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(star => (
        <button key={star} type="button"
          onClick={() => interactive && onRate(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          className={interactive ? "cursor-pointer" : "cursor-default"}>
          <FiStar size={interactive ? 22 : 14}
            className={`${(hover || rating) >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} transition-colors`}/>
        </button>
      ))}
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, openCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [qty, setQty] = useState(1);
  const [selectedImg, setSelectedImg] = useState(0);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: "" });
  const [showReviewForm, setShowReviewForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => productsAPI.getById(id).then(r => r.data),
  });

  const reviewMutation = useMutation({
    mutationFn: (data) => productsAPI.addReview(id, data),
    onSuccess: () => {
      toast.success("Review submitted!");
      queryClient.invalidateQueries(["product", id]);
      setReviewForm({ rating: 0, comment: "" });
      setShowReviewForm(false);
    },
    onError: (err) => toast.error(err.message || "Failed to submit review")
  });

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin"/>
    </div>
  );

  const product = data?.product;
  if (!product) return <div className="text-center py-20 text-gray-500">Product not found</div>;

  const discount = product.comparePrice > 0
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0;
  const images = product.images?.length > 0
    ? product.images : [{ url: "https://placehold.co/500x500?text=Product" }];

  const handleAddToCart = () => {
    if (product.stock === 0) return;
    addItem(product, qty);
    toast.success(`${product.name} added to cart!`);
    openCart();
  };

  const handleBuyNow = () => {
    if (product.stock === 0) return;
    addItem(product, qty);
    navigate("/checkout");
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 hover:text-gray-900 transition-colors">
          <FiArrowLeft size={14}/> Back
        </button>
        <span>/</span>
        <Link to="/products" className="hover:text-gray-900">Products</Link>
        <span>/</span>
        <Link to={`/products?category=${product.category}`} className="hover:text-gray-900">{product.category}</Link>
        <span>/</span>
        <span className="text-gray-900 line-clamp-1">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Images */}
        <div className="space-y-4">
          <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden">
            <img src={images[selectedImg]?.url} alt={product.name} className="w-full h-full object-cover"/>
          </div>
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img, i) => (
                <button key={i} onClick={() => setSelectedImg(i)}
                  className={`w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-colors ${i === selectedImg ? "border-gray-900" : "border-transparent hover:border-gray-300"}`}>
                  <img src={img.url} alt="" className="w-full h-full object-cover"/>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              {product.brand && <p className="text-sm text-gray-500 mb-1">{product.brand}</p>}
              <h1 className="text-3xl font-black text-gray-900 leading-tight">{product.name}</h1>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0">
              <FiShare2 size={18} className="text-gray-500"/>
            </button>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <StarRating rating={product.rating}/>
            <span className="text-sm text-gray-600">{product.rating} ({product.numReviews} reviews)</span>
            <span className="text-sm text-gray-400">· {product.sold} sold</span>
          </div>

          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-4xl font-black text-gray-900">${product.price}</span>
            {product.comparePrice > 0 && <>
              <span className="text-xl text-gray-400 line-through">${product.comparePrice}</span>
              <span className="bg-red-100 text-red-600 text-sm font-bold px-2 py-0.5 rounded-lg">-{discount}% OFF</span>
            </>}
          </div>

          <p className="text-gray-600 leading-relaxed mb-6">{product.description}</p>

          {/* Quantity */}
          <div className="flex items-center gap-4 mb-6">
            <p className="text-sm font-semibold text-gray-700">Quantity</p>
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-4 py-3 hover:bg-gray-50">
                <FiMinus size={14}/>
              </button>
              <span className="w-14 text-center font-semibold">{qty}</span>
              <button onClick={() => setQty(Math.min(product.stock, qty + 1))} disabled={qty >= product.stock} className="px-4 py-3 hover:bg-gray-50 disabled:opacity-40">
                <FiPlus size={14}/>
              </button>
            </div>
            <span className="text-sm">
              {product.stock > 0
                ? <span className="text-green-600 font-medium">✓ {product.stock} in stock</span>
                : <span className="text-red-500 font-medium">Out of stock</span>}
            </span>
          </div>

          {/* CTA */}
          <div className="flex gap-3 mb-8">
            <button onClick={handleAddToCart} disabled={product.stock === 0}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <FiShoppingBag size={18}/>
              {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
            </button>
            <button onClick={handleBuyNow} disabled={product.stock === 0}
              className="flex-1 border-2 border-gray-900 text-gray-900 py-4 rounded-xl font-bold hover:bg-gray-50 transition-colors disabled:opacity-40">
              Buy Now
            </button>
            <button className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <FiHeart size={20} className="text-gray-500"/>
            </button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 pt-5 border-t border-gray-100">
            {[
              { icon: FiTruck, text: "Free shipping over $50" },
              { icon: FiShield, text: "Secure Stripe payment" },
              { icon: FiRefreshCw, text: "30-day returns" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="text-center">
                <Icon size={18} className="text-gray-500 mx-auto mb-1"/>
                <p className="text-xs text-gray-500 leading-tight">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Related products */}
      {data?.related?.length > 0 && (
        <div className="mt-16">
          <h2 className="text-xl font-black text-gray-900 mb-6">Related Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {data.related.map(p => (
              <Link key={p._id} to={`/products/${p._id}`}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:-translate-y-1 transition-transform group">
                <div className="aspect-square bg-gray-50 overflow-hidden">
                  <img src={p.images?.[0]?.url || "https://placehold.co/200x200"} alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                </div>
                <div className="p-3">
                  <p className="font-semibold text-gray-900 text-sm line-clamp-2">{p.name}</p>
                  <p className="font-black text-gray-900 mt-1">${p.price}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      <div className="mt-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-gray-900">Reviews ({product.numReviews})</h2>
          {isAuthenticated && !showReviewForm && (
            <button onClick={() => setShowReviewForm(true)}
              className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors">
              Write a Review
            </button>
          )}
        </div>

        {showReviewForm && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
            <h3 className="font-bold text-gray-900 mb-4">Your Review</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Rating</p>
              <StarRating rating={reviewForm.rating} interactive onRate={(r) => setReviewForm({ ...reviewForm, rating: r })}/>
            </div>
            <textarea value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              placeholder="Share your experience..." rows={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none mb-4"/>
            <div className="flex gap-3">
              <button onClick={() => setShowReviewForm(false)}
                className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => reviewMutation.mutate(reviewForm)}
                disabled={!reviewForm.rating || !reviewForm.comment || reviewMutation.isPending}
                className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-semibold text-sm hover:bg-gray-700 disabled:opacity-50">
                {reviewMutation.isPending ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </div>
        )}

        {product.reviews?.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FiStar size={40} className="mx-auto mb-3 opacity-30"/>
            <p>No reviews yet. Be the first to review!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {product.reviews.map((review, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gray-900 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {review.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{review.name}</p>
                      <p className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <StarRating rating={review.rating}/>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}