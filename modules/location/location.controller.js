// Location controller for live location sharing
const db = require('./firebase');

// Save/update user location
exports.updateLocation = async (req, res) => {
  try {
    const { userId, lat, lng } = req.body;
    if (!userId || !lat || !lng) {
      return res.status(400).json({ success: false, message: 'userId, lat, lng required' });
    }
    await db.ref(`locations/${userId}`).set({ lat, lng, timestamp: Date.now() });
    res.json({ success: true });
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
    const snapshot = await db.ref(`locations/${userId}`).once('value');
    res.json({ success: true, location: snapshot.val() });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
