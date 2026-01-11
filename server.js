const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const aiRoutes = require("./routes/aiRoutes");
require('./models/db');

dotenv.config();

const app = express();
const server = http.createServer(app);

// ✅ Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'DELETE'],
  },
});

// ✅ Use __dirname directly (CommonJS provides it)
const __dirnameValue = __dirname;

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// 🔥 Serve static image folder
app.use('/uploads', express.static(path.join(__dirnameValue, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.set('io', io);
app.use('/api/orders', orderRoutes);
app.use("/api/ai", aiRoutes);

// ✅ Socket.IO events
io.on('connection', (socket) => {
  console.log('⚡ Client connected:', socket.id);
  socket.on('disconnect', () => console.log('❌ Client disconnected:', socket.id));
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
