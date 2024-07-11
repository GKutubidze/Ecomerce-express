const Product = require("../models/productModel");
const Category = require("../models/categoryModel");

exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().populate("category", "name image");
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.createProduct = async (req, res) => {
  const { productname, description, price, stock, category, images } = req.body;

  try {
    const existingCategory = await Category.findById(category);
    if (!existingCategory) {
      return res.status(400).json({ error: "Category does not exist" });
    }

    const product = new Product({
      productname,
      description,
      price,
      stock,
      category,
      images,
    });
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { productname, description, price, stock, category, images } = req.body;

  try {
    if (category) {
      const existingCategory = await Category.findById(category);
      if (!existingCategory) {
        return res.status(400).json({ error: "Category does not exist" });
      }
    }

    const updateFields = {
      productname,
      description,
      price,
      stock,
      category,

      images,
    };

    const product = await Product.findByIdAndUpdate(id, updateFields, {
      new: true,
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a Product
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findById(id).populate(
      "category",
      "name image"
    );

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
