const express = require("express");
const router = express.Router();
const { isAdmin } = require("../middleware/authMiddleware");
const jwtMiddleware = require("../middleware/jwtMiddleware");
const productController = require("../controllers/productController");

router.get("/", productController.getAllProducts);
router.post("/", jwtMiddleware, isAdmin, productController.createProduct);
router.put("/:id", jwtMiddleware, isAdmin, productController.updateProduct);
router.delete("/:id", jwtMiddleware, isAdmin, productController.deleteProduct);
router.get("/:id", productController.getProductById);

module.exports = router;
