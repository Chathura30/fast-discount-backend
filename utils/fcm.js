const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

let firebaseInitialized = false;

// Try to load Firebase service account key
try {
  const serviceAccountPath = path.join(__dirname, '../firebase-service-account.json');
  
  // Check if file exists
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    firebaseInitialized = true;
    console.log('✅ Firebase initialized successfully');
  } else {
    console.warn('⚠️ firebase-service-account.json not found. FCM notifications disabled.');
  }
} catch (error) {
  console.error('⚠️ Failed to initialize Firebase:', error.message);
  console.log('FCM notifications will be disabled.');
}

const sendFCMNotification = async (title, body, topic = 'customers') => {
  if (!firebaseInitialized) {
    console.log('⚠️ FCM not initialized, skipping notification:', title);
    return;
  }

  const message = {
    notification: { title, body },
    topic,
  };

  try {
    await admin.messaging().send(message);
    console.log('📢 Notification sent:', title);
  } catch (err) {
    console.error('❌ FCM Error:', err.message);
    throw err; // Re-throw to let caller handle
  }
};

module.exports = sendFCMNotification;
