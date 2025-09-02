/**
 * Generate a unique username based on role and full name
 * @param {string} role - The user's role (customer/worker)
 * @param {string} fullName - The user's full name
 * @returns {string} - Generated username in format @role_namexxx where xxx is random number
 */
function generateUsername(role, fullName) {
    const namePart = fullName.split(" ")[0].toLowerCase();
    const random = Math.floor(100 + Math.random() * 900); // 3-digit random
    return `@${role}${namePart}${random}`; // e.g., @workerjohn345
}

/**
 * Check if a username is already taken
 * @param {string} username - The username to check
 * @param {string} role - The user's role (customer/worker)
 * @returns {Promise<boolean>} - True if username is taken, false otherwise
 */
async function isUsernameTaken(username, role) {
    const CustomerProfile = require('../models/CustomerProfile');
    const WorkerProfile = require('../models/WorkerProfile');
    
    if (role === 'customer') {
        const exists = await CustomerProfile.findOne({ username });
        return !!exists;
    } else {
        const exists = await WorkerProfile.findOne({ username });
        return !!exists;
    }
}

/**
 * Generate a unique username that isn't already taken
 * @param {string} role - The user's role (customer/worker)
 * @param {string} fullName - The user's full name
 * @returns {Promise<string>} - A unique username
 */
async function generateUniqueUsername(role, fullName) {
    let username;
    let attempts = 0;
    const maxAttempts = 10;

    do {
        username = generateUsername(role, fullName);
        const taken = await isUsernameTaken(username, role);
        if (!taken) return username;
        attempts++;
    } while (attempts < maxAttempts);

    // If we couldn't generate a unique username with the regular pattern,
    // add more random digits
    const timestamp = Date.now().toString().slice(-4);
    return `@${role}${fullName.split(" ")[0].toLowerCase()}${timestamp}`;
}

module.exports = {
    generateUsername,
    isUsernameTaken,
    generateUniqueUsername
};
