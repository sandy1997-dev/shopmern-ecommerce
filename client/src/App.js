import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useAuthStore } from "./store";

// Layout
import Layout from "./components/layout/Layout";
import AdminLayout from "./components/layout/AdminLayout";
import LoadingSpinner from "./components/common/LoadingSpinner";

// Pages - lazy loaded
const Home         = lazy(() => import("./pages/Home"));
const Products     = lazy(() => import("./pages/Products"));
const ProductDetail= lazy(() => import("./pages/ProductDetail"));
const Cart         = lazy(() => import("./pages/Cart"));
const Checkout     = lazy(() => import("./pages/Checkout"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
const Orders       = lazy(() => import("./pages/Orders"));
const OrderDetail  = lazy(() => import("./pages/OrderDetail"));
const Profile      = lazy(() => import("./pages/Profile"));
const Wishlist     = lazy(() => import("./pages/Wishlist"));
const Login        = lazy(() => import("./pages/Login"));
const Register     = lazy(() => import("./pages/Register"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminProducts  = lazy(() => import("./pages/admin/Products"));
const AdminOrders    = lazy(() => import("./pages/admin/Orders"));
const AdminUsers     = lazy(() => import("./pages/admin/Users"));
const AdminProductForm = lazy(() => import("./pages/admin/ProductForm"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

// Route guards
const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== "admin") return <Navigate to="/" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated ? children : <Navigate to="/" replace />;
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Elements stripe={stripePromise}>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: "#1a1a1a",
                color: "#f0ede8",
                border: "1px solid #2a2a2a",
                borderRadius: "4px",
                fontSize: "0.875rem",
              },
              success: { iconTheme: { primary: "#10b981", secondary: "#fff" } },
              error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
            }}
          />
          <Suspense fallback={<LoadingSpinner fullPage />}>
            <Routes>
              {/* Public routes */}
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/order/success" element={<OrderSuccess />} />

                {/* Auth routes */}
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

                {/* Private routes */}
                <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
                <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
                <Route path="/orders/:id" element={<PrivateRoute><OrderDetail /></PrivateRoute>} />
                <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                <Route path="/wishlist" element={<PrivateRoute><Wishlist /></PrivateRoute>} />
              </Route>

              {/* Admin routes */}
              <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="products/new" element={<AdminProductForm />} />
                <Route path="products/:id/edit" element={<AdminProductForm />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="users" element={<AdminUsers />} />
              </Route>

              {/* 404 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </Elements>
    </QueryClientProvider>
  );
}
