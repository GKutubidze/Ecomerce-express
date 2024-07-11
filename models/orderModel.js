 const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  items: [
    {
      product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
    }
  ],
  status: { type: String, enum: ['Pending', 'Shipped', 'Delivered'], default: 'Pending' },
  totalPrice: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
});

module.exports = mongoose.model('Order', OrderSchema);
