/**
 * Calculate distance between two coordinates using the Haversine formula
 * @param {[number, number]} coords1 - [longitude, latitude]
 * @param {[number, number]} coords2 - [longitude, latitude]
 * @returns {number} distance in kilometers
 */
function calculateDistanceKm(coords1, coords2) {
  if (!coords1 || !coords2 || coords1.length < 2 || coords2.length < 2) {
    return 0;
  }

  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;

  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Format distance into human-friendly string
 * @param {number} distanceKm
 * @returns {string} e.g. "450 m" or "2.4 km"
 */
function formatDistance(distanceKm) {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

/**
 * Estimate travel time in minutes based on distance and average urban vehicle speed (approx 30 km/h)
 * @param {number} distanceKm
 * @returns {number} estimated minutes
 */
function estimateETA(distanceKm) {
  const avgSpeedKmH = 30;
  const hours = distanceKm / avgSpeedKmH;
  const minutes = Math.max(3, Math.round(hours * 60)); // minimum 3 minutes
  return minutes;
}

module.exports = {
  calculateDistanceKm,
  formatDistance,
  estimateETA,
};
