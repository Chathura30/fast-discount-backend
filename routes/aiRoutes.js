const express = require("express");
const router = express.Router();
const { analyzeProduct } = require("../controllers/aiController");

// Run AI analysis using Product ID from database
router.get("/analyze/:id", analyzeProduct);

module.exports = router;
