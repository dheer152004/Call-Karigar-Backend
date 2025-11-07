# Location Module

Live location sharing using Firebase Realtime Database and Socket.io

## Files
- `firebase.js`: Firebase admin SDK setup
- `location.controller.js`: API logic for updating and fetching user location
- `location.routes.js`: Express routes for location endpoints

## API Endpoints
- `POST /api/location/update` — update user location (body: userId, lat, lng)
- `GET /api/location/:userId` — get user location

## Required Packages
- `firebase-admin` (for server-side Firebase)
- `socket.io` (for real-time updates)
- `webgeolocator` or similar (for client-side location, optional)

## Setup
1. Install dependencies:
   ```powershell
   npm install firebase-admin socket.io
   ```
2. Set up Firebase service account and databaseURL in `firebase.js`
3. Mount `location.routes.js` in your main app:
   ```js
   const locationRoutes = require('./modules/location/location.routes');
   app.use('/api/location', locationRoutes);
   ```

## Example Socket.io Usage
You can emit location updates to clients in real-time:
```js
const io = require('socket.io')(server);
io.on('connection', (socket) => {
  socket.on('locationUpdate', (data) => {
    // Broadcast to other clients
    socket.broadcast.emit('locationUpdate', data);
  });
});
```
