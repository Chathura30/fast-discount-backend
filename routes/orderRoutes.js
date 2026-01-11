const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');



// Create a new order
router.post('/create', orderController.createOrder);

// Get all orders of a user (Customer Dashboard)
router.get('/user/:customer_id', orderController.getUserOrders);

// Get full order details (Customer/Admin view)
router.get('/details/:orderId', orderController.getOrderDetails);


// ADMIN ROUTES


// Get all orders (Admin Dashboard)
router.get('/admin/orders', orderController.getAllOrders);

// Get today’s pending orders (Admin Dashboard - Today Orders tab)
router.get('/admin/today', orderController.getTodayOrders);

// Get confirmed orders (Admin Dashboard - Confirm Delivery tab)
router.get('/admin/confirmed', orderController.getConfirmedOrders);

// Admin confirms an order
router.put('/admin/confirm/:orderId', orderController.confirmOrder);

// Get sales report (Admin Dashboard - Sales Report tab)
router.get('/admin/sales-report', orderController.getSalesReport);


module.exports = router;
