const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Order = require("../models/Order");
const { protect } = require("../middleware/auth");

// @route   POST /api/payments/create-payment-intent
// @desc    Create Stripe payment intent
// @access  Private
router.post("/create-payment-intent", protect, async (req, res) => {
  try {
    const { amount, currency = "usd", metadata = {} } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId: req.user._id.toString(),
        userEmail: req.user.email,
        ...metadata,
      },
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/payments/create-checkout-session
// @desc    Create Stripe checkout session
// @access  Private
router.post("/create-checkout-session", protect, async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;

    const lineItems = items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : [],
          description: item.variant ? `${item.variant.name}: ${item.variant.value}` : undefined,
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/cart`,
      customer_email: req.user.email,
      metadata: {
        userId: req.user._id.toString(),
        shippingAddress: JSON.stringify(shippingAddress),
      },
      shipping_address_collection: {
        allowed_countries: ["US", "CA", "GB", "AU", "IN"],
      },
      billing_address_collection: "required",
    });

    res.json({ success: true, url: session.url, sessionId: session.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/payments/verify/:sessionId
// @desc    Verify checkout session
// @access  Private
router.get("/verify/:sessionId", protect, async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId, {
      expand: ["payment_intent", "line_items"],
    });

    res.json({
      success: true,
      session: {
        id: session.id,
        status: session.payment_status,
        amount: session.amount_total / 100,
        currency: session.currency,
        customerEmail: session.customer_email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/payments/refund
// @desc    Process refund (Admin)
// @access  Private/Admin
router.post("/refund", protect, async (req, res) => {
  try {
    const { orderId, amount, reason } = req.body;
    const order = await Order.findById(orderId);

    if (!order) return res.status(404).json({ message: "Order not found" });
    if (!order.paymentInfo?.id) {
      return res.status(400).json({ message: "No payment info found" });
    }

    const refund = await stripe.refunds.create({
      payment_intent: order.paymentInfo.id,
      amount: amount ? Math.round(amount * 100) : undefined,
      reason: reason || "requested_by_customer",
    });

    order.orderStatus = "refunded";
    order.refundAmount = refund.amount / 100;
    order.refundedAt = new Date();
    order.statusHistory.push({ status: "refunded", note: `Refund of $${refund.amount / 100} processed` });
    await order.save();

    res.json({ success: true, refund });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/payments/webhook
// @desc    Stripe webhook handler
// @access  Public (Stripe)
router.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case "payment_intent.succeeded":
      console.log("✅ Payment succeeded:", event.data.object.id);
      break;

    case "payment_intent.payment_failed":
      console.log("❌ Payment failed:", event.data.object.id);
      break;

    case "checkout.session.completed":
      const session = event.data.object;
      console.log("✅ Checkout completed:", session.id);
      // Handle post-checkout order creation if using hosted checkout
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

module.exports = router;
