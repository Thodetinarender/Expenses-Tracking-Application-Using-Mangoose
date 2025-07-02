const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken"); 
const Order = require("../models/order");

const CF_API_URL = process.env.CF_API_URL;  
const CF_CLIENT_ID = process.env.CASHFREE_API_ID;  
const CF_CLIENT_SECRET = process.env.CASHFREE_SECURITY_KEY;  

const createOrder = async (req, res) => {
    try {
        console.log("Received Payment Request:", req.body);

        const { amount } = req.body;
        const token = req.headers.authorization?.split(" ")[1]; 

        if (!amount || !token) {
            return res.status(400).json({ message: "Amount and valid token are required!" });
        }

        let user;
        try {
            user = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ message: "Invalid or expired token" });
        }

        const userId = user.id;
        const customerName = user.name || "Unknown User"; 
        const customerEmail = user.email || process.env.DEFAULT_EMAIL; 
        const customerPhone = process.env.DEFAULT_PHONE; 

        const orderId = `ORDER_${uuidv4()}`; 

        const orderData = {
            order_id: orderId,  
            order_amount: Number(amount),  
            order_currency: "INR",
            order_note: "Test Order",
            customer_details: {
                customer_id: `user_${userId}`,
                customer_name: customerName,
                customer_email: customerEmail,
                customer_phone: customerPhone, 
            },
            order_meta: {
                return_url: `https://expenses-tracking-application.onrender.com/payment/response?order_id=${orderId}`,
                notify_url: "https://expenses-tracking-application.onrender.com/api/payment/webhook", // Webhook URL for notification
               // return_url: `http://65.0.178.125:5000/payment/response?order_id=${orderId}`,
               // notify_url: "http://65.0.178.125:5000/api/payment/webhook", // Webhook URL for notification           
            },
            order_splits: [],
        };

        const response = await axios.post(
            CF_API_URL,  
            orderData,
            {
                headers: {
                    "x-api-version": "2023-08-01",
                    "x-client-id": CF_CLIENT_ID,  
                    "x-client-secret": CF_CLIENT_SECRET,  
                    "Content-Type": "application/json",
                },
            }
        );

        if (response.data && response.data.payment_session_id) {
            // Save order details to the database with PENDING status
            await Order.create({
                orderId,
                userId,
                amount: Number(amount),
                status: "PENDING", // Initial status before payment confirmation
            });
           
             return res.json({ 
                payment_session_id: response.data.payment_session_id, 
                order_id: orderId 
              });
        } else {
            // If payment session creation failed, redirect to payment response with status FAILED
            await Order.create({
                orderId,
                userId,
                amount: Number(amount),
                status: "FAILED", // Failed status
            });
            return res.redirect(`https://expenses-tracking-application.onrender.com/payment/response?order_id=${orderId}`); // Redirect on failure
            //return res.redirect(`http://65.0.178.125:5000/payment/response?order_id=${orderId}`); // Redirect on failure
        }
    } catch (error) {
        console.error("Error in createOrder:", error.response ? error.response.data : error.message);
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.response ? error.response.data : error.message,
        });
    }
};

const getPaymentStatus = async (req, res) => {
    const { order_id } = req.query;

    if (!order_id) {
        return res.status(400).json({ message: "order_id is required" });
    }

    try {
        const response = await axios.get(
            `https://sandbox.cashfree.com/pg/orders/${order_id}`,
            {
                headers: {
                    "x-api-version": "2023-08-01",
                    "x-client-id": CF_CLIENT_ID,
                    "x-client-secret": CF_CLIENT_SECRET,
                    "Content-Type": "application/json",
                },
            }
        );

        console.log("🔍 Live Payment Status:", response.data);

        const paymentStatus = response.data.order_status;

        if (paymentStatus === "PAID") {
            // ✅ Update order status in the database
            await Order.processPaymentWebhook(order_id, "PAID");

        }

        return res.json({ status: paymentStatus });
    } catch (error) {
        console.error("❌ Error fetching payment status:", error);
        return res.status(500).json({ message: "Error fetching payment status" });
    }
};


const handlePaymentWebhook = async (req, res) => {
    try {
        console.log("🔔 Webhook Received:", req.body); 
        
        const { order_id, order_status } = req.body;

        if (!order_id || !order_status) {
            console.log("❌ Invalid webhook data received:", req.body);
            return res.status(400).json({ message: "Invalid webhook data" });
        }

        console.log(`✅ Webhook for Order: ${order_id}, Status: ${order_status}`);
        await Order.processPaymentWebhook(order_id, order_status);


        
        return res.status(200).json({ message: "Webhook processed successfully" });
    } catch (error) {
        console.error("❌ Error processing webhook:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

module.exports = { createOrder, getPaymentStatus, handlePaymentWebhook }; // ✅ CommonJS syntax
