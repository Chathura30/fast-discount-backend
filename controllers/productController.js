const db = require("../models/db");
const sendFCMNotification = require("../utils/fcm");
const schedule = require("node-schedule");

/**
 * Add a new product by admin
 */
const addProduct = (req, res) => {
  const io = req.app.get("io");
  const { code, name, description, expire_date, price, discount_price } = req.body;
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

  const sql = `
    INSERT INTO products 
    (code, name, image, description, expire_date, price, discount_price)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [code, name, imagePath, description, expire_date, price, discount_price],
    async (err, result) => {
      if (err) {
        console.error("❌ Database error adding product:", err.message);
        return res.status(500).json({ error: err.message });
      }

      const BASE_URL = `${req.protocol}://${req.get("host")}`;

      const newProduct = {
        id: result.insertId,
        code,
        name,
        // ✅ Return full image URL
        image: imagePath ? `${BASE_URL}${imagePath}` : null,
        description,
        expire_date,
        price,
        discount_price,
      };

      // 🔥 Emit new product to all connected clients
      try {
        if (io) {
          io.emit("newProduct", newProduct);
        }
      } catch (socketErr) {
        console.error("⚠️ Socket.io error:", socketErr.message);
      }

      // 📱 Send push notification (non-blocking)
      try {
        await sendFCMNotification(
          "🛒 New Product Added",
          `${name} is now available at a discount price!`
        );
      } catch (fcmErr) {
        console.error("⚠️ FCM notification error:", fcmErr.message);
        // Don't fail the request if notification fails
      }

      // ⏳ Schedule expiry deletion
      try {
        scheduleProductExpiry(newProduct, io);
      } catch (scheduleErr) {
        console.error("⚠️ Scheduler error:", scheduleErr.message);
      }

      res.status(201).json({
        message: "Product added successfully",
        product: newProduct,
      });
    }
  );
};

/**
 * Schedule automatic deletion when product expires
 */
const scheduleProductExpiry = (product, io) => {
  try {
    const expireDate = new Date(product.expire_date);

    if (isNaN(expireDate.getTime()) || expireDate <= new Date()) {
      console.log(`⚠️ Invalid or past expire date for ${product.name}, skipping scheduler`);
      return;
    }

    schedule.scheduleJob(expireDate, () => {
      const deleteSQL = `DELETE FROM products WHERE id = ?`;

      db.query(deleteSQL, [product.id], async (err, result) => {
        if (err) {
          console.error(`❌ Failed to auto-delete product ${product.name}:`, err.message);
          return;
        }

        console.log(`🕒 Product expired and auto-deleted: ${product.name}`);
        io.emit("productExpired", { code: product.code, name: product.name });

        await sendFCMNotification(
          "⚠️ Product Expired",
          `${product.name} has been removed as it reached expiry.`
        );
      });
    });

    console.log(`⏳ Countdown scheduled for ${product.name} at ${expireDate.toISOString()}`);
  } catch (error) {
    console.error("Error scheduling product expiry:", error.message);
  }
};

/**
 * Get all products
 */
const getAllProducts = (req, res) => {
  const sql = "SELECT * FROM products";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    const BASE_URL = `${req.protocol}://${req.get("host")}`;

    // ✅ Convert image paths to full URLs
    const updatedResults = results.map((product) => ({
      ...product,
      image: product.image ? `${BASE_URL}${product.image}` : null,
    }));

    res.status(200).json(updatedResults);
  });
};

/**
 * Manually delete a product (admin or system)
 */
const deleteProduct = (req, res) => {
  const io = req.app.get("io");
  const { code } = req.params;

  const sql = "DELETE FROM products WHERE code = ?";
  db.query(sql, [code], async (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Product not found" });

    io.emit("productDeleted", code);
    await sendFCMNotification("🗑️ Product Removed", `Product ${code} has been removed.`);

    res.status(200).json({ message: "Product deleted successfully" });
  });
};

// ✅ Export functions
module.exports = {
  addProduct,
  getAllProducts,
  deleteProduct,
};


