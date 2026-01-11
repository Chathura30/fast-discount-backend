const fetch = require('node-fetch');

/**
 * Send Expo push notifications
 * @param {string|string[]} tokens - Expo push token(s)
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 */
const sendExpoNotification = async (tokens, title, body) => {
  if (!tokens) return;

  // Ensure tokens is an array
  const tokenArray = Array.isArray(tokens) ? tokens : [tokens];

  const messages = tokenArray.map(token => ({
    to: token,
    sound: 'default',
    title,
    body,
    data: { title, body },
  }));

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const data = await response.json();
    console.log('📱 Expo notifications sent:', data);
  } catch (error) {
    console.error('❌ Expo notification error:', error.message);
  }
};

module.exports = sendExpoNotification;
