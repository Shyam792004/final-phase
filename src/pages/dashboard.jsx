import AppHeader from "../Component/AppHeader";
import EmergencySOSBar from "../Component/EmergencySOSBar";
import TravelStatusOverview from "../Component/TravelStatusOverview";
import LiveTrackingMap from "../Component/LiveTrackingMap";
import SafetyAlerts from "../Component/SafetyAlerts";
import SafetyAnalytics from "../Component/SafetyAnalytics";
import TechnicalSpecs from "../Component/AdvancedSafetyMap";
import FloatingSOSButton from "../Component/FloatingSOSButton";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [travelStatus, setTravelStatus] = useState({
    status: "Normal",
    safetyScore: 92,
    duration: "2h 15m traveling",
    checkpointDistance: "3.2 km",
    checkpointETA: "~8 minutes",
    currentLocation: "Downtown Transit Hub"
  });

  // 🔹 Utility: decide travel status & checkpoint by safety score
  const getStatusBySafetyScore = (safetyScore, city) => {
    if (safetyScore >= 90) {
      return {
        status: "Safe",
        safetyScore,
        checkpointDistance: "3 km",
        checkpointETA: "5 mins",
        duration: "20 mins",
        currentLocation: city
      };
    } else if (safetyScore >= 60) {
      return {
        status: "Caution",
        safetyScore,
        checkpointDistance: "7 km",
        checkpointETA: "15 mins",
        duration: "35 mins",
        currentLocation: city
      };
    } else {
      return {
        status: "Alert",
        safetyScore,
        checkpointDistance: "10 km",
        checkpointETA: "25 mins",
        duration: "50 mins",
        currentLocation: city
      };
    }
  };

  

  // 🔹 Simulate real-time updates every 15s
  useEffect(() => {
    const interval = setInterval(() => {
      const statuses = ["Normal", "Caution", "Alert"];
      // const locations = [
      //   "Downtown Transit Hub",
      //   "Main Street Intersection",
      //   "University District",
      //   "Shopping Center Plaza",
      //   "Residential Area"
      // ];

      const randomSafety = Math.floor(Math.random() * 50) + 50; // 50 - 100
      const randomLocation = locations[Math.floor(Math.random() * locations.length)];

      setTravelStatus(getStatusBySafetyScore(randomSafety, randomLocation));
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // 🔹 Handler when city is selected from dropdown
  const handleCitySelect = (city) => {
    const randomSafety = Math.floor(Math.random() * 50) + 50; // 50 - 100
    setTravelStatus(getStatusBySafetyScore(randomSafety, city));
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-inter">
      <AppHeader />
      <EmergencySOSBar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <TravelStatusOverview travelStatus={travelStatus} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <LiveTrackingMap 
            currentLocation={travelStatus.currentLocation} 
            onSelect={handleCitySelect} 
          />
          <SafetyAlerts />
        </div>

        <SafetyAnalytics />
        <TechnicalSpecs />
      </main>

      <FloatingSOSButton />
    </div>
  );
}
