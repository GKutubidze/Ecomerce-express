const User = require("../models/userModel");
const jwt = require("jsonwebtoken");

module.exports = async (req, res, next) => {
  const authHeader = req.header("Authorization");
  console.log("authHeader:", authHeader);

  const token = authHeader && authHeader.split(" ")[1];
  console.log("token:", token);

  if (!token) {
    console.log("No token, authorization denied");
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded);

    const user = await User.findById(decoded.id);
    console.log("user:", user);

    if (!user) {
      console.log("User does not exist");
      return res.status(401).json({ message: "User does not exist" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Error:", err);
    return res.status(401).json({ message: "Token is not valid" });
  }
};
