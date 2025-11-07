
// Location controller for live location sharing (MongoDB)
const Location = require('./location.model');

// Save/update user location
exports.updateLocation = async (req, res) => {
  try {
    const { userId, lat, lng } = req.body;
    if (!userId || lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, message: 'userId, lat, lng required' });
    }
    const location = await Location.findOneAndUpdate(
      { userId },
      { lat, lng, timestamp: Date.now() },
      { upsert: true, new: true }
    );
    // Emit location update via socket.io if io is available
    if (req.app.get('io')) {
      req.app.get('io').emit('locationUpdate', { userId, lat, lng, timestamp: Date.now() });
    }
    res.json({ success: true, location });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get user location
exports.getLocation = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId required' });
    }
    const location = await Location.findOne({ userId });
    res.json({ success: true, location });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
