const isAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next(); // User is admin, proceed to next middleware/route handler
  } else {
    res.status(403).json({ error: "Unauthorized" }); // User is not admin
  }
};

module.exports = { isAdmin };
