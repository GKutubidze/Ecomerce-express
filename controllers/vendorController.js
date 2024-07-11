const Vendor = require("../models/vendorModel");

// Get All Vendors
exports.getAllVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find();
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a Single Vendor by ID
exports.getVendorById = async (req, res) => {
  const { id } = req.params;

  try {
    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }
    res.json(vendor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create a New Vendor
exports.createVendor = async (req, res) => {
  const { name, address, contactInfo, website } = req.body;

  try {
    const vendor = new Vendor({ name, address, contactInfo, website });
    await vendor.save();
    res.status(201).json(vendor);
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).json({ error: "Vendor name must be unique" });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
};

// Update an Existing Vendor
exports.updateVendor = async (req, res) => {
  const { id } = req.params;
  const { name, address, contactInfo, website } = req.body;

  try {
    const vendor = await Vendor.findByIdAndUpdate(
      id,
      { name, address, contactInfo, website },
      { new: true, runValidators: true }
    );
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }
    res.json(vendor);
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).json({ error: "Vendor name must be unique" });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
};

// Delete a Vendor
exports.deleteVendor = async (req, res) => {
  const { id } = req.params;

  try {
    const vendor = await Vendor.findByIdAndDelete(id);
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    res.json({ message: "Vendor deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
