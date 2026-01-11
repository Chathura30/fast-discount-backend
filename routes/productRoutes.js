const express = require('express');
const { addProduct, getAllProducts, deleteProduct } = require('../controllers/productController');
const upload = require('../middleware/upload');

const router = express.Router();

// 🔥 Add product with image upload
router.post('/add', upload.single('image'), addProduct);

// 🧾 Get all products
router.get('/all', getAllProducts);

// 🗑️ Delete product by code
router.delete('/delete/:code', deleteProduct);

module.exports = router;
