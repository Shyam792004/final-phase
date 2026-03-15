import { CheckCircle, Shield, MapPin, Clock, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";

export default function TravelStatusOverview({ travelStatus = {}, onSelect }) {
  // Default values
  const [status, setStatus] = useState(travelStatus.status || "Safe");
  const [safetyScore, setSafetyScore] = useState(travelStatus.safetyScore || 90);
  const [duration, setDuration] = useState(travelStatus.duration || "--");
  const [checkpointDistance, setCheckpointDistance] = useState(travelStatus.checkpointDistance || "--");
  const [checkpointETA, setCheckpointETA] = useState(travelStatus.checkpointETA || "--");
  const [selectedCity, setSelectedCity] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // 🧭 City list
  const cities = [
    "RS Puram", "Gandhipuram", "Saibaba Colony", "Peelamedu",
    "Singanallur", "Coimbatore North", "Coimbatore South", "Podanur",
    "Race Course", "Vadavalli", "Eachanari", "Ukkadam",
    "Kuniamuthur", "Kalapatti", "Saravanampatti", "Kovaipudur",
  ];

  // 🧩 Dynamic city safety data (you can expand this list later)
  const cityData = {
    "RS Puram":        { score: 92, status: "Safe", checkpoint: "Vadavalli", eta: "8 mins", distance: "3.2 km" },
    "Gandhipuram":     { score: 75, status: "Caution", checkpoint: "Peelamedu", eta: "12 mins", distance: "5.4 km" },
    "Saibaba Colony":  { score: 88, status: "Safe", checkpoint: "RS Puram", eta: "6 mins", distance: "2.8 km" },
    "Peelamedu":       { score: 65, status: "Caution", checkpoint: "Singanallur", eta: "10 mins", distance: "4.7 km" },
    "Singanallur":     { score: 55, status: "Alert", checkpoint: "Ukkadam", eta: "14 mins", distance: "6.1 km" },
    "Coimbatore North":{ score: 85, status: "Safe", checkpoint: "RS Puram", eta: "9 mins", distance: "3.9 km" },
    "Coimbatore South":{ score: 62, status: "Caution", checkpoint: "Podanur", eta: "15 mins", distance: "7.2 km" },
    "Podanur":         { score: 48, status: "Alert", checkpoint: "Singanallur", eta: "20 mins", distance: "8.5 km" },
    "Race Course":     { score: 90, status: "Safe", checkpoint: "Gandhipuram", eta: "5 mins", distance: "2.2 km" },
    "Vadavalli":       { score: 83, status: "Safe", checkpoint: "RS Puram", eta: "7 mins", distance: "3.0 km" },
    "Eachanari":       { score: 50, status: "Alert", checkpoint: "Podanur", eta: "16 mins", distance: "7.8 km" },
    "Ukkadam":         { score: 58, status: "Alert", checkpoint: "Singanallur", eta: "18 mins", distance: "8.9 km" },
    "Kuniamuthur":     { score: 63, status: "Caution", checkpoint: "Ukkadam", eta: "12 mins", distance: "5.9 km" },
    "Kalapatti":       { score: 80, status: "Safe", checkpoint: "Peelamedu", eta: "9 mins", distance: "4.3 km" },
    "Saravanampatti":  { score: 72, status: "Caution", checkpoint: "Kalapatti", eta: "10 mins", distance: "4.5 km" },
    "Kovaipudur":      { score: 65, status: "Caution", checkpoint: "Ukkadam", eta: "13 mins", distance: "5.5 km" },
  };

  const handleSelect = (city) => {
    setSelectedCity(city);
    setDropdownOpen(false);
    const data = cityData[city];
    if (data) {
      setSafetyScore(data.score);
      setStatus(data.status);
      setCheckpointDistance(data.distance);
      setCheckpointETA(data.eta);
      setDuration(`${Math.floor(Math.random() * 15) + 5} mins`);
    }
    if (onSelect) onSelect(city);
  };

  const getLoaderColor = (score) => {
    if (score >= 80) return "green";
    if (score >= 60) return "yellow";
    return "red";
  };
  const loaderColor = getLoaderColor(safetyScore);

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "safe": return "text-green-500";
      case "caution": return "text-yellow-500";
      case "alert": return "text-red-500";
      default: return "text-slate-400";
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case "safe": return <CheckCircle className="text-green-500 w-6 h-6 animate-bounce" />;
      case "caution": return <Shield className="text-yellow-500 w-6 h-6 animate-pulse" />;
      case "alert": return <Shield className="text-red-500 w-6 h-6 animate-pulse" />;
      default: return <CheckCircle className="text-slate-400 w-6 h-6" />;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" data-testid="travel-status-overview">

      {/* Travel Status */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:scale-105 transform transition">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm font-medium">Travel Status</p>
            <p className={`text-2xl font-bold ${getStatusColor(status)}`}>{status}</p>
          </div>
          <div className="w-12 h-12 bg-red-500 bg-opacity-20 rounded-full flex items-center justify-center">
            {getStatusIcon(status)}
          </div>
        </div>

        <div className="mt-4 flex items-center text-sm text-slate-400">
          <Clock className="w-4 h-4 mr-2" />
          <span>{duration}</span>
        </div>

        {/* City Selector */}
        <div className="mt-5 relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg flex items-center justify-between transition"
          >
            {selectedCity || "Select Destination"}
            <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto z-20">
              {cities.map((city, index) => (
                <button
                  key={index}
                  onClick={() => handleSelect(city)}
                  className="w-full text-left px-4 py-2 text-sm text-white hover:bg-indigo-600 transition"
                >
                  {city}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Safety Score */}
      <div className="space-y-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 hover:scale-105 transform transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Safety Score</p>
              <p className={`text-2xl font-bold text-${loaderColor}-500`}>{safetyScore}%</p>
            </div>
            <div className={`w-12 h-12 bg-${loaderColor}-500 bg-opacity-20 rounded-full flex items-center justify-center`}>
              <Shield className={`text-${loaderColor}-500 w-6 h-6`} />
            </div>
          </div>
          <div className="mt-4">
            <div className="bg-slate-700 rounded-full h-2">
              <div
                className={`bg-${loaderColor}-500 h-2 rounded-full transition-all duration-500 ease-in-out`}
                style={{ width: `${safetyScore}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Next Checkpoint */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:scale-105 transform transition">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm font-medium">Next Safepoint</p>
            <p className="text-2xl font-bold text-slate-100">{checkpointDistance}</p>
          </div>
          <div className="w-12 h-12 bg-blue-600 bg-opacity-20 rounded-full flex items-center justify-center">
            <MapPin className="text-blue-500 w-6 h-6 animate-bounce" />
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm text-slate-400">
          <MapPin className="w-4 h-4 mr-2" />
          <span>{checkpointETA}</span>
        </div>
      </div>
    </div>
  );
}