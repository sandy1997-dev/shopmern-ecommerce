import React from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authAPI } from "../api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { FiHeart, FiShoppingBag, FiArrowRight } from "react-icons/fi";
import toast from "react-hot-toast";

export default function Wishlist() {
  const queryClient = useQueryClient();
  
  const { data, isLoading } = useQuery({ 
    queryKey: ["wishlist"], 
    queryFn: () => authAPI.getMe().then(r => r.data) 
  });

  const wishlistMutation = useMutation({
    mutationFn: (productId) => authAPI.toggleWishlist(productId),
    onSuccess: () => {
      queryClient.invalidateQueries(["wishlist"]);
      toast.success("Item removed from wishlist");
    },
  });

  if (isLoading) return <LoadingSpinner fullPage />;

  const wishlist = data?.user?.wishlist || [];

  if (wishlist.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <FiHeart size={32} className="text-gray-300" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Your wishlist is empty</h1>
        <p className="text-gray-500 mb-8">Save items you love to find them easily later.</p>
        <Link to="/products" className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-gray-700 transition-colors">
          Explore Products <FiArrowRight />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Wishlist</h1>
          <p className="text-gray-500 mt-1">{wishlist.length} items saved</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {wishlist.map((product) => (
          <div key={product._id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm group relative">
            {/* Remove button */}
            <button 
              onClick={() => wishlistMutation.mutate(product._id)}
              className="absolute top-3 right-3 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full text-red-500 shadow-sm hover:bg-red-500 hover:text-white transition-all"
            >
              <FiHeart size={16} className="fill-current" />
            </button>

            <Link to={`/products/${product._id}`} className="block aspect-square bg-gray-50 overflow-hidden">
              <img 
                src={product.images?.[0]?.url || "https://placehold.co/400x400?text=Product"} 
                alt={product.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
              />
            </Link>

            <div className="p-4">
              <Link to={`/products/${product._id}`}>
                <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-2 hover:text-gray-600 transition-colors">
                  {product.name}
                </h3>
              </Link>
              <div className="flex items-center justify-between mt-3">
                <span className="font-black text-gray-900">${product.price.toFixed(2)}</span>
                <Link 
                  to={`/products/${product._id}`}
                  className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-900 hover:text-white transition-colors"
                >
                  <FiShoppingBag size={16} />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}