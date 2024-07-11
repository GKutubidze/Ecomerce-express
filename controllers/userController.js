const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const validator = require("validator");

exports.registerUser = async (req, res) => {
  const { firstname, surname, email, username, password } = req.body;

  try {
    // Check if email already exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Check if username already exists
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({ message: "Username already taken" });
    }

    // Validate password manually before hashing
    const isPasswordValid = validator.isStrongPassword(password, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    });

    if (!isPasswordValid) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one symbol.",
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user object
    const newUser = new User({
      firstname,
      surname,
      email,
      username,
      password: hashedPassword,
      cart: [], // Initialize cart as an empty array
    });

    // Save the user to the database
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    // Handle any errors
    console.error("Error registering user:", err); // Log the error for debugging purposes
    if (err.name === "ValidationError") {
      // Send validation error messages
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: "Server error, please try again later." });
  }
};
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const userWithoutPassword = {
      id: user._id,
      firstname: user.firstname,
      surname: user.surname,
      email: user.email,
      username: user.username,
    };

    res.status(200).json({
      message: "Login successful",
      token,
      user: userWithoutPassword,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCart = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId).populate("cart.product");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    res.status(200).json(user.cart);
  } catch (error) {
    console.error("Error getting cart:", error.message);
    res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
};

exports.addToCart = async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.user._id; // Use the authenticated user ID from middleware

  try {
    const user = await User.findById(userId);
    if (!user) {
      console.log(`User not found: ${userId}`);
      return res.status(404).json({ message: "User not found" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      console.log(`Product not found: ${productId}`);
      return res.status(404).json({ message: "Product not found" });
    }

    // Convert quantity to number
    const quantityNumber = parseInt(quantity, 10);
    if (isNaN(quantityNumber) || quantityNumber <= 0) {
      console.log(`Invalid quantity: ${quantity}`);
      return res.status(400).json({ message: "Invalid quantity" });
    }

    // Check if the product is already in the cart
    const cartItem = user.cart.find(
      (item) => item.product.toString() === productId
    );

    // Calculate the new quantity if the product is already in the cart
    const newQuantity = cartItem
      ? cartItem.quantity + quantityNumber
      : quantityNumber;

    // Ensure that the new quantity does not exceed the product's stock
    if (newQuantity > product.stock) {
      return res.status(400).json({
        message: `Only ${product.stock} units of this product are available in stock`,
      });
    }

    if (cartItem) {
      cartItem.quantity = newQuantity; // Update the quantity to the new valid quantity
    } else {
      user.cart.push({ product: productId, quantity: quantityNumber });
    }

    await user.save();

    res.status(200).json({ message: "Product added to cart", cart: user.cart });
  } catch (error) {
    console.error(`Error occurred: ${error.message}`);
    res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
};

exports.increaseQuantity = async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const cartItem = user.cart.find(
      (item) => item.product.toString() === productId
    );
    if (!cartItem) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (cartItem.quantity < product.stock) {
      cartItem.quantity += 1;
      await user.save();
      res
        .status(200)
        .json({ message: "Product quantity increased", cart: user.cart });
    } else {
      res.status(400).json({ message: "No more stock available" });
    }
  } catch (error) {
    console.error(`Error occurred: ${error.message}`);
    res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
};

exports.decreaseQuantity = async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const cartItem = user.cart.find(
      (item) => item.product.toString() === productId
    );
    if (!cartItem) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    if (cartItem.quantity > 1) {
      cartItem.quantity -= 1;
    } else {
      // Optionally remove the item from the cart if the quantity is 1
      // user.cart = user.cart.filter(item => item.product.toString() !== productId);
    }

    await user.save();

    res
      .status(200)
      .json({ message: "Product quantity decreased", cart: user.cart });
  } catch (error) {
    console.error(`Error occurred: ${error.message}`);
    res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
};
exports.buy = async (req, res) => {
  const userId = req.user._id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      console.log(`User not found: ${userId}`);
      return res.status(404).json({ message: "User not found" });
    }

    const cart = user.cart;

    // Check if cart is empty
    if (cart.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Process each item in the cart
    for (const item of cart) {
      const product = await Product.findById(item.product);
      if (!product) {
        console.log(`Product not found: ${item.product}`);
        return res
          .status(404)
          .json({ message: `Product not found: ${item.product}` });
      }

      // Check if product has enough stock
      if (product.stock < item.quantity) {
        return res
          .status(400)
          .json({ message: `Insufficient stock for product: ${product._id}` });
      }

      // Decrease product stock
      product.stock -= item.quantity;
      await product.save();
    }

    // Clear the user's cart
    user.cart = [];
    await user.save();

    res.status(200).json({ message: "Purchase completed successfully" });
  } catch (error) {
    console.error(`Error occurred: ${error.message}`);
    res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
};

exports.decreaseQuantity = async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const cartItem = user.cart.find(
      (item) => item.product.toString() === productId
    );
    if (!cartItem) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Ensure that the cart quantity is less than or equal to the product stock
    if (cartItem.quantity > product.stock) {
      return res.status(400).json({ message: "Insufficient stock available" });
    }

    if (cartItem.quantity > 1) {
      cartItem.quantity -= 1;
    } else {
      // Optionally remove the item from the cart if the quantity is 1
      // user.cart = user.cart.filter(item => item.product.toString() !== productId);
    }

    await user.save();

    res
      .status(200)
      .json({ message: "Product quantity decreased", cart: user.cart });
  } catch (error) {
    console.error(`Error occurred: ${error.message}`);
    res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
};

exports.decreaseFromCart = async (req, res) => {
  const { userId } = req.params;
  const { productId, quantity } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      console.log(`User not found: ${userId}`);
      return res.status(404).json({ message: "User not found" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      console.log(`Product not found: ${productId}`);
      return res.status(404).json({ message: "Product not found" });
    }

    // Convert quantity to number
    const quantityNumber = parseInt(quantity, 10);
    if (isNaN(quantityNumber) || quantityNumber <= 0) {
      console.log(`Invalid quantity: ${quantity}`);
      return res.status(400).json({ message: "Invalid quantity" });
    }

    // Check if product exists in cart
    const cartItemIndex = user.cart.findIndex(
      (item) => item.product.toString() === productId
    );
    if (cartItemIndex !== -1) {
      const cartItem = user.cart[cartItemIndex];

      // Ensure that the new cart quantity does not exceed the product stock
      if (cartItem.quantity - quantityNumber > product.stock) {
        return res
          .status(400)
          .json({ message: "Insufficient stock available" });
      }

      // Update quantity or remove item from cart if quantity becomes 0 or less
      cartItem.quantity -= quantityNumber;
      if (cartItem.quantity <= 0) {
        user.cart.splice(cartItemIndex, 1);
      }
    } else {
      console.log(`Product not found in cart: ${productId}`);
      return res.status(404).json({ message: "Product not found in cart" });
    }

    // Check for missing required fields before saving
    if (
      !user.firstname ||
      !user.surname ||
      !user.email ||
      !user.username ||
      !user.password
    ) {
      console.log(`Missing required fields for user: ${userId}`);
      return res.status(400).json({ message: "User missing required fields" });
    }

    await user.save();

    res
      .status(200)
      .json({ message: "Product quantity decreased in cart", cart: user.cart });
  } catch (error) {
    console.error(`Error occurred: ${error.message}`);
    res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
};

exports.logout = (req, res) => {
  res.clearCookie("jwt", { path: "/", secure: true, sameSite: "strict" });
  return res.status(200).json({ message: "Logout successful" });
};

exports.getUserData = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.removeFromCart = async (req, res) => {
  const { productId } = req.params;
  const userId = req.user._id; // Use the authenticated user ID from middleware

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const cartItemIndex = user.cart.findIndex(
      (item) => item.product.toString() === productId
    );

    if (cartItemIndex === -1) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    // Remove the item from the cart
    user.cart.splice(cartItemIndex, 1);
    await user.save();

    res
      .status(200)
      .json({ message: "Product removed from cart", cart: user.cart });
  } catch (error) {
    console.error(`Error occurred: ${error.message}`);
    res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
};

exports.verifyToken = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error verifying token", error });
  }
};

exports.updateUserPassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user._id;

  try {
    const user = await User.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Validate new password
    const isPasswordValid = validator.isStrongPassword(newPassword, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    });

    if (!isPasswordValid) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one symbol.",
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(`Error updating user password: ${error.message}`);
    res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
};
