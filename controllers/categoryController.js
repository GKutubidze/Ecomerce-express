const Category = require("../models/categoryModel");

// Get All Categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a Single Category by ID
exports.getCategoryById = async (req, res) => {
  const { id } = req.params;

  try {
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create a New Category
exports.createCategory = async (req, res) => {
  const { name, image } = req.body;

  try {
    const category = new Category({ name, image });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    if (err.code === 11000) {
      // Duplicate key error for unique field
      res.status(400).json({ error: "Category name must be unique" });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
};

// Update an Existing Category
exports.updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, image } = req.body;

  try {
    const category = await Category.findByIdAndUpdate(
      id,
      { name, image },
      { new: true, runValidators: true }
    );
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.json(category);
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).json({ error: "Category name must be unique" });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
};

// Delete a Category
exports.deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
