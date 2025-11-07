
// Location controller for live location sharing (MongoDB)
const Location = require('./location.model');

// Save/update worker location
exports.updateLocation = async (req, res) => {
  try {
    const { workerId, lat, lng } = req.body;
    if (!workerId || lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, message: 'workerId, lat, lng required' });
    }
    const location = await Location.findOneAndUpdate(
      { workerId },
      { lat, lng, timestamp: Date.now() },
      { upsert: true, new: true }
    );
    // Emit location update via socket.io if io is available
    if (req.app.get('io')) {
      req.app.get('io').emit('locationUpdate', { workerId, lat, lng, timestamp: Date.now() });
    }
    res.json({ success: true, location });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get worker location
exports.getLocation = async (req, res) => {
  try {
    const { workerId } = req.params;
    if (!workerId) {
      return res.status(400).json({ success: false, message: 'workerId required' });
    }
    const location = await Location.findOne({ workerId });
    res.json({ success: true, location });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
