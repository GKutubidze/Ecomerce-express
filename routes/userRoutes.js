const express = require("express");
const {
  registerUser,
  loginUser,
  getCart,
  addToCart,
  increaseQuantity,
  decreaseQuantity,
  buy,
  decreaseFromCart,
  logout,
  getUser,
  getUserData,
  removeFromCart,
  verifyToken,
  refreshToken,
  updateUserPassword,
} = require("../controllers/userController");
const jwtMiddleware = require("../middleware/jwtMiddleware");
const authenticateToken = require("../middleware/verifyToken");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/cart/:userId", jwtMiddleware, getCart);
router.post("/cart/add", jwtMiddleware, addToCart);
router.post("/cart/remove/:userId", jwtMiddleware, decreaseFromCart);

router.post("/cart/increase", jwtMiddleware, increaseQuantity);
router.post("/cart/decrease", jwtMiddleware, decreaseQuantity);
router.post("/cart/buy", jwtMiddleware, buy);
router.post("/logout", logout);
router.post("/user", jwtMiddleware, getUser);
router.get("/me", jwtMiddleware, getUserData);
router.delete("/cart/remove/:productId", jwtMiddleware, removeFromCart);
router.put("/update-password", jwtMiddleware, updateUserPassword);

router.get("/verify", authenticateToken, verifyToken);

module.exports = router;
