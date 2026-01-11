const db = require('../models/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');


 // REGISTER USER

exports.register = async (req, res) => {
  const { name, email, password, confirmPassword, role } = req.body;

  if (!name || !email || !password || !confirmPassword || !role) {
    return res.status(400).json({ msg: "All fields are required" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ msg: "Passwords do not match" });
  }

  try {
    // Check if user exists
    const users = await queryDB("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length > 0) return res.status(400).json({ msg: "Email already exists" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    await queryDB(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, role]
    );

    // Send confirmation email
    try {
      await sendEmail(
        email,
        "Registration Completed",
        `Hello ${name}, your ${role} account has been successfully created on Fast Discount.`
      );
      return res.status(201).json({ msg: `Registration successful as ${role}. Confirmation email sent.` });
    } catch (emailErr) {
      console.error("Email Error:", emailErr);
      return res.status(201).json({ msg: "User created, but email sending failed." });
    }

  } catch (err) {
    console.error("Register Error:", err);
    return res.status(500).json({ msg: "Internal server error" });
  }
};


// LOGIN USER

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) return res.status(400).json({ msg: "Email and password are required" });

  try {
    const users = await queryDB("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) return res.status(404).json({ msg: "Email not found" });

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });

  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ msg: "Internal server error" });
  }
};


// FORGOT PASSWORD

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ msg: "Email is required" });

  try {
    const users = await queryDB("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) return res.status(404).json({ msg: "Email not found" });

    const user = users[0];
    // Generate reset token
    const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "15m" });
    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    await sendEmail(
      email,
      "Password Reset Request",
      `Hello ${user.name},\n\nClick the link below to reset your password:\n${resetLink}\n\nThis link will expire in 15 minutes.`
    );

    res.json({ msg: "Password reset instructions sent to your email." });

  } catch (err) {
    console.error("Forgot Password Error:", err);
    return res.status(500).json({ msg: "Internal server error" });
  }
};


// RESET PASSWORD

exports.resetPassword = async (req, res) => {
  const { token, newPassword, confirmPassword } = req.body;

  if (!token || !newPassword || !confirmPassword) {
    return res.status(400).json({ msg: "All fields are required" });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ msg: "Passwords do not match" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await queryDB("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, userId]);

    res.json({ msg: "Password reset successfully." });

  } catch (err) {
    console.error("Reset Password Error:", err);
    if (err.name === "TokenExpiredError") {
      return res.status(400).json({ msg: "Reset token expired" });
    }
    return res.status(500).json({ msg: "Internal server error" });
  }
};


// HELPER FUNCTION: PROMISE DB QUERY

function queryDB(query, params) {
  return new Promise((resolve, reject) => {
    db.query(query, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}
