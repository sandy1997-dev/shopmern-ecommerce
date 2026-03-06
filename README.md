# 🛍️ ShopMERN — Full-Stack E-Commerce Platform

A production-grade Shopify-style e-commerce platform built with the **MERN stack** and **Stripe** payments.

**Built by:** Sandeep Kumar Pati  
**Stack:** MongoDB · Express · React · Node.js · Stripe · Cloudinary

---

## ✨ Features

### 🛒 Customer Features
- Browse & search products with filters (category, price, rating, sort)
- Product detail pages with image gallery, reviews, ratings
- Shopping cart with persistent state (Zustand)
- Wishlist management
- Secure Stripe checkout (card payments)
- Real-time order tracking with status history
- User profile & order history
- Guest browsing, authenticated checkout

### 🔧 Admin Dashboard
- 📊 Analytics dashboard with revenue charts (Recharts)
- 📦 Full product CRUD (create, edit, delete, image upload via Cloudinary)
- 🛍️ Order management (view, update status, process refunds)
- 👥 User management (view, update roles, delete)
- 📉 Low stock alerts
- 🔝 Top-selling products tracking

### 💳 Payment Features
- Stripe Payment Intents (card payments)
- Stripe Checkout Sessions (hosted)
- Webhook handling for payment events
- Refund processing via API

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier)
- Stripe account (free)
- Cloudinary account (free)

### 1. Clone & Install

```bash
git clone https://github.com/sandy1997-dev/shopmern.git
cd shopmern
npm run install-all
```

### 2. Configure Environment Variables

**Server** — copy `server/.env.example` → `server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/ecommerce
JWT_SECRET=your_super_long_secret_here
JWT_EXPIRE=30d
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=http://localhost:3000
```

**Client** — copy `client/.env.example` → `client/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
```

### 3. Run Development

```bash
npm run dev
# Server: http://localhost:5000
# Client: http://localhost:3000
```

### 4. Create Admin User

After registering, update the user role in MongoDB:
```js
// In MongoDB Atlas or Compass
db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
```

---

## 📁 Project Structure

```
shopmern/
├── server/
│   ├── index.js              # Express app entry
│   ├── models/
│   │   ├── User.js           # User + auth methods
│   │   ├── Product.js        # Products + reviews + variants
│   │   └── Order.js          # Orders + lifecycle
│   ├── routes/
│   │   ├── auth.js           # Register, login, profile
│   │   ├── products.js       # CRUD + search + filter
│   │   ├── orders.js         # Order management
│   │   ├── payments.js       # Stripe integration
│   │   ├── admin.js          # Admin dashboard + analytics
│   │   ├── cart.js           # Cart validation
│   │   └── upload.js         # Cloudinary uploads
│   └── middleware/
│       └── auth.js           # JWT + role guards
│
└── client/
    └── src/
        ├── App.js             # Routes + providers
        ├── store.js           # Zustand (auth, cart, UI)
        ├── api.js             # Axios client + all API methods
        ├── pages/
        │   ├── Home.js        # Hero + featured + categories
        │   ├── Products.js    # Grid + filters + pagination
        │   ├── ProductDetail.js
        │   ├── Cart.js
        │   ├── Checkout.js    # Stripe payment + multi-step
        │   ├── Orders.js
        │   ├── Profile.js
        │   ├── Login.js
        │   ├── Register.js
        │   └── admin/
        │       ├── Dashboard.js  # Charts + analytics
        │       ├── Products.js
        │       ├── Orders.js
        │       └── Users.js
        └── components/
            ├── layout/
            │   ├── Layout.js      # Navbar + footer
            │   └── AdminLayout.js # Sidebar admin layout
            └── cart/
                └── CartDrawer.js  # Slide-out cart
```

---

## 🌐 Deployment

### Backend → Railway (free)
1. Push to GitHub
2. Connect Railway → New Project → GitHub repo
3. Add environment variables
4. Deploy

### Frontend → Vercel (free)
1. Connect Vercel → client folder
2. Set `REACT_APP_*` env vars
3. Deploy

---

## 🧪 Test Stripe Payments

Use Stripe test cards:
```
Card:    4242 4242 4242 4242
Expiry:  Any future date
CVC:     Any 3 digits
```

---

## 📊 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Framer Motion |
| State | Zustand (persist middleware) |
| Data Fetching | TanStack Query (React Query v5) |
| Payments | Stripe (Payment Intents + Webhooks) |
| Backend | Node.js, Express 4 |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcryptjs |
| Images | Cloudinary |
| Charts | Recharts |
| Security | Helmet, express-rate-limit, express-validator |
| Email | Nodemailer |

---

## 👨‍💻 Author

**Sandeep Kumar Pati**  
GitHub: [@sandy1997-dev](https://github.com/sandy1997-dev)  
Email: sandeepkumar.pati1997@gmail.com
