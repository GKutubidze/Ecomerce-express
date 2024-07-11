const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwtMiddleware = require("./middleware/jwtMiddleware");
require("dotenv").config({ path: ".env.local" });

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(morgan("dev"));
app.use(
  cors({
    origin: "https://ecomerce-website-blue.vercel.app", // specify your frontend URL
    credentials: true, // allow credentials
  })
);

app.use(cookieParser());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Define routes
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/category", require("./routes/categoryRoutes"));
app.use("/api/vendor", require("./routes/vendorRoutes"));

app.get("/", (req, res) => {
  res.send("Welcome to the E-commerce API");
});

app.get("/verify-token", jwtMiddleware, (req, res) => {
  res.json({
    message: "Protected endpoint accessed successfully",
    user: req.user,
  });
});

app.post("/create-checkout-session", async (req, res) => {
  const { amount } = req.body; // Get amount from request body

  if (!amount || amount <= 0) {
    return res.status(400).send({ error: "Invalid amount" });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Total Amount",
            },
            unit_amount: amount, // Use dynamic amount
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: "http://localhost:5173/cancel",
    });
    res.json({ id: session.id });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.post("/verify-session", async (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    return res
      .status(400)
      .json({ success: false, error: "Session ID is required." });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      res.json({ success: true, session });
    } else {
      res.json({ success: false, error: "Payment not completed." });
    }
  } catch (error) {
    console.error("Error verifying session:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start the server
app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);