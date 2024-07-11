const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
  productname: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  // vendor: { type: Schema.Types.ObjectId, ref: "Vendor", required: true },
  stock: { type: Number, required: true },
  images: {
    coverImage: { type: String },
    additionalImages: [{ type: String }],
  },
  category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
});

module.exports = mongoose.model("Product", ProductSchema);
