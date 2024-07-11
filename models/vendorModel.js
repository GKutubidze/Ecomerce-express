const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const VendorSchema = new Schema({
  name: { type: String, required: true, unique: true },
  address: { type: String },
  contactInfo: { type: String },
  website: { type: String },
  // Add more fields as needed
});

module.exports = mongoose.model("Vendor", VendorSchema);
