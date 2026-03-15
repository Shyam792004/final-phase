// src/lib/safetyAI.js
import crimes from '../../coimbatore_crimes.json';

/**
 * Safety AI Engine
 * Provides risk assessment based on historical crime data.
 */

// Haversine formula to calculate distance between two points in KM
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; 
}

const severityWeights = {
  'alert': 1.0,
  'high': 0.8,
  'medium': 0.5,
  'caution': 0.3,
  'low': 0.1
};

export const SafetyAI = {
  /**
   * Calculates a safety score (0-100) for a given location.
   * 100 = Very Safe, 0 = High Risk
   */
  getSafetyScore: (lat, lng) => {
    if (!lat || !lng) return 100;
    
    let riskFactor = 0;
    const radius = 2.0; // km

    crimes.forEach(crime => {
      const dist = getDistance(lat, lng, crime.lat, crime.lng);
      if (dist < radius) {
        // Closer crimes have higher weight
        const proximityWeight = 1 - (dist / radius);
        const severityWeight = severityWeights[crime.severity] || 0.1;
        riskFactor += proximityWeight * severityWeight;
      }
    });

    // Normalize risk factor to a score (heuristic)
    // If riskFactor is 0, score is 100. If high, score drops.
    const score = Math.max(0, 100 - (riskFactor * 15));
    return Math.round(score);
  },

  getSafetyInsights: (lat, lng) => {
    const nearbyCrimes = crimes.filter(c => getDistance(lat, lng, c.lat, c.lng) < 1.0);
    if (nearbyCrimes.length === 0) return "This area looks relatively safe based on recent historical data.";
    
    const types = [...new Set(nearbyCrimes.map(c => c.crime_type))];
    return `Recently, there have been reports of ${types.join(', ')} in this vicinity. Exercise caution.`;
  },

  getResponse: async (query, context = {}) => {
    const q = query.toLowerCase();
    const { lat, lng, locality } = context;

    if (q.includes('safe') || q.includes('risk')) {
      const score = SafetyAI.getSafetyScore(lat, lng);
      const insight = SafetyAI.getSafetyInsights(lat, lng);
      
      let verdict = score > 80 ? "Safe" : score > 50 ? "Moderate Risk" : "High Risk";
      return `AI Analysis: The current safety score for your location is ${score}/100 (${verdict}). ${insight}`;
    }

    if (q.includes('emergency') || q.includes('help')) {
      return "I've detected an emergency request. I can automatically notify your contacts if you confirm, or you can use the SOS button in the sidebar.";
    }

    return "I am your NightSafe AI Assistant. I can analyze local crime data to provide safety scores, suggest well-lit routes, or automatically alert your contacts in case of danger.";
  }
};
