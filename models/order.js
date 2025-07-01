const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = new Schema({
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        required: true,
        default: 'PENDING'
    }
}, { timestamps: true });

// Static method to create an order
orderSchema.statics.createOrder = async function({ orderId, userId, amount, status }) {
    return this.create({ orderId, userId, amount, status });
};

// // Static method to update order status
// orderSchema.statics.updateOrderStatus = async function(orderId, status) {
//     return this.findOneAndUpdate({ orderId }, { status }, { new: true });
// };

// Static method to find order by orderId
orderSchema.statics.findByOrderId = async function(orderId) {
    return this.findOne({ orderId });
};

orderSchema.statics.processPaymentWebhook = async function(order_id, order_status) {
    const order = await this.findOne({ orderId: order_id });
    if (!order) throw new Error("Order not found");

    if (order_status === "PAID") {
        order.status = "PAID";
        await order.save();

        // Upgrade user to premium
        const User = require("./user");
        console.log("Order userId:", order.userId); // Add this
        const user = await User.findById(order.userId);
        console.log("User found:", user); // Add this
        if (user) {
            user.isPremium = true;
            await user.save();
        }
    }
    return order;
};

module.exports = mongoose.model('Order', orderSchema);

// const Sequelize = require('sequelize');
// const sequelize = require('../util/database');

// const Order = sequelize.define('order', {
//     id: {
//         type: Sequelize.INTEGER,
//         autoIncrement: true,
//         allowNull: false,
//         primaryKey: true
//     },
//     orderId: {
//         type: Sequelize.STRING,
//         allowNull: false,
//         unique: true
//     },
//     userId: {
//         type: Sequelize.INTEGER,
//         allowNull: false
//     },
//     amount: {
//         type: Sequelize.FLOAT,
//         allowNull: false
//     },
//     status: {
//         type: Sequelize.STRING,
//         allowNull: false,
//         defaultValue: "PENDING"  // Initial status when order is created
//     }
// });

// module.exports = Order;
