const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwtMiddleware = require("./middleware/jwtMiddleware");

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();
console.log();
// Middleware
app.use(bodyParser.json());
app.use(morgan("dev"));
app.use(
  cors({
    origin: process.env.FRONTEND_URL, // specify your frontend URL
    credentials: true, // allow credentials
  })
);
app.use(cookieParser());

const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
  throw new Error("MONGO_URI is not defined in the environment variables.");
}
console.log("Environment Variables:");
console.log("MONGO_URI:", process.env.MONGO_URI);
console.log("STRIPE_SECRET_KEY:", process.env.STRIPE_SECRET_KEY);
console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
console.log("PORT:", process.env.PORT);
// Connect to MongoDB
mongoose
  .connect(mongoURI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit the process with failure
  });

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
  const { amount } = req.body;

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
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
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
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
