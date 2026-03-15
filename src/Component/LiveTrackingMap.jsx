  import { useState } from "react";

  export default function LiveTrackingMap({ currentLocation, onSelect }) {
    const [selectedCity, setSelectedCity] = useState("");
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const cities = [
      "RS Puram",
      "Gandhipuram",
      "Saibaba Colony",
      "Peelamedu",
      "Singanallur",
      "Coimbatore North",
      "Coimbatore South",
      "Podanur",
      "Race Course",
      "Vadavalli",
      "Eachanari",
      "Ukkadam",
      "Kuniamuthur",
      "Kalapatti",
      "Saravanampatti",
      "Kovaipudur",
    ];

    const handleSelect = (city) => {
      setSelectedCity(city);
      if (onSelect) onSelect(city);
      setDropdownOpen(false);
    };

    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden" data-testid="live-tracking-map">
            {/* Dropdown */}
            <div className="mt-20">
            <h1 className="ml-12 text-xl">Check Safety Status</h1>
            <br></br>

            <div className="w-72 ml-10 mb-4">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full bg-slate-800 text-slate-200 rounded-xl p-3 flex justify-between items-center shadow-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                {selectedCity || "Select a city"}
                <svg
                  className={`w-5 h-5 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
      
              {/* FIX: Made dropdown push content instead of overlap */}
              {dropdownOpen && (
                <ul className="mt-2 w-full bg-slate-800 rounded-xl shadow-lg max-h-60 overflow-y-auto relative z-10">
                  {cities.map((city) => (
                    <li
                    key={city}
                    className="px-4 py-2 cursor-pointer hover:bg-green-500 hover:text-white transition-colors"
                    onClick={() => handleSelect(city)}
                    >
                      {city}
                    </li>
                  ))}
                </ul>
              )}
            </div>
              </div>



        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Live Route Tracking</h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-400">Live</span>
            </div>
          </div>
        </div>

        <div className="relative h-80 bg-slate-900">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-60" 
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=800&h=600')"
            }}
          ></div>

          <div className="absolute inset-0 p-4">
            <svg className="w-full h-full" viewBox="0 0 400 300">
              <path 
                d="M50 250 Q150 200 200 150 T350 100" 
                stroke="#10b981" 
                strokeWidth="4" 
                fill="none" 
                strokeDasharray="10,5" 
                className="animate-pulse"
              />
              <circle cx="200" cy="150" r="8" fill="#3b82f6" className="animate-pulse">
                <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite"/>
              </circle>
              <circle cx="120" cy="220" r="20" fill="#ef4444" fillOpacity="0.3" stroke="#ef4444" strokeWidth="2"/>
              <circle cx="300" cy="120" r="15" fill="#f59e0b" fillOpacity="0.3" stroke="#f59e0b" strokeWidth="2"/>
            </svg>
          </div>
        </div>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Current Location:</span>
            <span className="text-slate-200">{currentLocation}</span>
          </div>
        </div>

        

      </div>
    );
  }
