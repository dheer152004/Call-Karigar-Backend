// Firebase setup for location sharing
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');

// You need to set GOOGLE_APPLICATION_CREDENTIALS env variable to your service account key JSON
initializeApp({
  credential: applicationDefault(),
  databaseURL: 'https://karigrow-location-default-rtdb.asia-southeast1.firebasedatabase.app'
});

const db = getDatabase();
module.exports = db;
