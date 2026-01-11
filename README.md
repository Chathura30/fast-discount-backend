# Fast Discount - Backend

Backend API for Fast Discount, an e-commerce mobile application with AI-powered health analysis features.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MySQL
- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** bcryptjs
- **Real-time Communication:** Socket.io
- **Cloud Messaging:** Firebase Cloud Messaging (FCM)
- **AI Integration:** Groq SDK
- **File Upload:** Multer
- **Email Service:** Nodemailer
- **Task Scheduling:** node-schedule

## Features

- User authentication (Login/Register/Password Reset)
- Product management (CRUD operations)
- Order processing and management
- AI-powered health analysis
- Push notifications (FCM & Expo)
- Email notifications
- Real-time order updates via WebSockets
- Image upload for products
- Admin dashboard support
- Scheduled tasks


## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MySQL database
- Firebase project (for FCM)
- Groq API key (for AI features)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Chathura30/fast-discount-backend.git
cd fast-discount-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
PORT=3000
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=your_database_name
JWT_SECRET=your_jwt_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
GROQ_API_KEY=your_groq_api_key
```

4. Set up Firebase:
   - Download your Firebase service account JSON file
   - Save it as `firebase-service-account.json` in the root directory
   - **Note:** This file is gitignored for security

5. Set up the database:
   - Create a MySQL database
   - Run migrations if available, or set up tables manually

### Running the Server

Development mode:
```bash
npm start
```

The server will start on `http://localhost:3000` (or your specified PORT)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/reset-password` - Reset password

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create new product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order status

### AI Health Analysis
- `POST /api/ai/analyze` - Analyze health data using AI


## Author

Chathura30
