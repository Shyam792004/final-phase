import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet.heat";
import "./leaflet-routing.css";
import { FiPhone, FiAlertTriangle, FiMapPin, FiSearch, FiMap } from "react-icons/fi";
import "./NightSafeMap.css";
import { Shield, PhoneCall, Mail, MapPin, HouseIcon, Github, Linkedin } from "lucide-react";
import Lognav from "./Lognav";
import AppHeader from "./AppHeader";

import crimeIconUrl from "../icons/crime.png";
import policeIconUrl from "../icons/police.png";
import hospitalIconUrl from "../icons/hospital.png";

// Custom icons for severity
const severityIcons = {
  low: new L.Icon({ iconUrl: new URL("../icons/low.png", import.meta.url).href, iconSize: [30, 30] }),
  medium: new L.Icon({ iconUrl: new URL("../icons/medium.png", import.meta.url).href, iconSize: [30, 30] }),
  high: new L.Icon({ iconUrl: new URL("../icons/high.png", import.meta.url).href, iconSize: [30, 30] }),
  alert: new L.Icon({ iconUrl: new URL("../icons/alert.png", import.meta.url).href, iconSize: [30, 30] }),
  caution: new L.Icon({ iconUrl: new URL("../icons/caution.png", import.meta.url).href, iconSize: [30, 30] }),
};

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).href,
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).href,
});

// Routing component
const RoutingMachine = ({ start, end, color = "red" }) => {
  const map = useMap();
  useEffect(() => {
    if (!start || !end) return;
    const routingControl = L.Routing.control({
      waypoints: [L.latLng(start.lat, start.lng), L.latLng(end.lat, end.lng)],
      lineOptions: { styles: [{ color, weight: 5 }] },
      addWaypoints: false,
      routeWhileDragging: true,
      show: false,
      fitSelectedRoutes: true,
    }).addTo(map);
    return () => map.removeControl(routingControl);
  }, [start, end, color]);
  return null;
};

// Crime heatmap
function CrimeHeatLayer({ crimeData }) {
  const map = useMap();
  useEffect(() => {
    if (!crimeData.length) return;
    const heatPoints = crimeData.map(c => {
      let intensity = 0.3;
      if (c.severity === "medium") intensity = 0.6;
      if (c.severity === "high") intensity = 1.0;
      return [c.lat, c.lng, intensity];
    });
    const heatLayer = L.heatLayer(heatPoints, { radius: 25, blur: 15, maxZoom: 17 }).addTo(map);
    return () => map.removeLayer(heatLayer);
  }, [crimeData, map]);
  return null;
}

export default function App() {
  const [userLocation, setUserLocation] = useState(null);
  const [destination, setDestination] = useState("");
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [crimeData, setCrimeData] = useState([]);
  const [emergencyMsg, setEmergencyMsg] = useState("");
  const [safeRoute, setSafeRoute] = useState([]);
  const [routeSafety, setRouteSafety] = useState({ status: "Unknown", color: "gray" });
  const mapRef = useRef();

  // ✅ Get user location (improved)
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      err => {
        alert("Unable to get your location — please allow location access in your browser.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Load crime data
  useEffect(() => {
    fetch("/data/coimbatore_crimes.json")
      .then(res => res.json())
      .then(data => {
        const mappedData = data.map(d => ({
          type: "crime",
          lat: d.lat,
          lng: d.lng,
          description: `${d.crime_type}: ${d.description}`,
          severity: d.severity,
        }));
        setCrimeData(mappedData);
      })
      .catch(err => console.error("Failed to load crime data:", err));
  }, []);

  const getZoneColor = zone => {
    switch (zone.severity) {
      case "low":
        return "yellow";
      case "medium":
        return "orange";
      case "high":
        return "red";
      case "alert":
        return "purple";
      case "caution":
        return "blue";
      default:
        return "gray";
    }
  };

  // ✅ Fixed handleGetDirections
  const handleGetDirections = async () => {
    if (!destination) return alert("Enter a destination");
    if (!userLocation) return alert("Please wait — detecting your current location...");

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${destination}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const dest = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        setDestinationCoords(dest);
        if (mapRef.current) mapRef.current.flyTo([dest.lat, dest.lng], 14);

        const midLat = (userLocation.lat + dest.lat) / 2 + 0.002;
        const midLng = (userLocation.lng + dest.lng) / 2 - 0.002;
        setSafeRoute([[userLocation.lat, userLocation.lng], [midLat, midLng], [dest.lat, dest.lng]]);

        const nearbyCrimes = crimeData.filter(
          c => Math.abs(c.lat - midLat) < 0.02 && Math.abs(c.lng - midLng) < 0.02
        );

        let status = "Safe";
        let color = "green";

        if (nearbyCrimes.some(c => c.severity === "medium" || c.severity === "caution")) {
          status = "Caution";
          color = "yellow";
        }
        if (nearbyCrimes.some(c => c.severity === "high" || c.severity === "alert")) {
          status = "Alert";
          color = "red";
        }

        setRouteSafety({ status, color });
      } else alert("Destination not found");
    } catch (err) {
      console.error(err);
      alert("Error fetching destination");
    }
  };

  const handleSendEmergency = () => {
    if (!emergencyMsg) return alert("Type your emergency message");
    const msg = encodeURIComponent(emergencyMsg);
    window.open(`https://wa.me/919498111191?text=${msg}`, "_blank");
    setEmergencyMsg("");
  };

  const handlePanToType = type => {
    const item = crimeData.find(c => c.severity === type || c.type === type);
    if (item && mapRef.current) mapRef.current.flyTo([item.lat, item.lng], 15);
    else alert(`${type} not found nearby`);
  };

  return (
    <>
      <div className="h-screen flex flex-col">
       <AppHeader/>

        <div className="flex flex-1">
          <aside className="w-96 text-white p-6 flex flex-col gap-6 overflow-y-auto custom-sidebar">
            <h2 className="text-2xl font-semibold border-b border-gray-600 pb-2 mb-6">Quick Actions</h2>

            {/* Destination input */}
            <div className="flex flex-col gap-3">
              <label className="font-medium">Destination</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter destination"
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  className="p-2 rounded-lg flex-1 text-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleGetDirections}
                  className="bg-indigo-600 hover:bg-indigo-700 transition-all px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <FiSearch /> Go
                </button>
              </div>
            </div>

            {/* Emergency section */}
            <div className="flex flex-col gap-3">
              <label className="font-medium">Emergency</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type emergency message"
                  value={emergencyMsg}
                  onChange={e => setEmergencyMsg(e.target.value)}
                  className="p-2 rounded-lg flex-1 text-black focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  onClick={handleSendEmergency}
                  className="bg-red-600 hover:bg-red-700 transition-all px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <FiAlertTriangle /> Send
                </button>
              </div>
            </div>

            {/* Live Route Safety */}
            <div className="mt-6 p-5 bg-gray-800 rounded-lg shadow-inner text-center flex flex-col items-center justify-center">
              <h3 className="text-lg font-semibold border-b border-gray-600 pb-2 mb-3 w-full">
                Live Route Safety
              </h3>
              {destinationCoords ? (
                <div className="flex flex-col items-center justify-center gap-3 w-full transition-all duration-700">
                  <div
                    className={`w-11/12 h-3 rounded-full animate-pulse`}
                    style={{
                      backgroundColor:
                        routeSafety.color === "green"
                          ? "#22c55e"
                          : routeSafety.color === "yellow"
                          ? "#eab308"
                          : routeSafety.color === "red"
                          ? "#ef4444"
                          : "#6b7280",
                      boxShadow: `0 0 20px ${routeSafety.color}`,
                      transition: "all 0.6s ease-in-out",
                    }}
                  ></div>
                  <div
                    className="text-2xl font-bold tracking-wider"
                    style={{ color: routeSafety.color }}
                  >
                    {routeSafety.status}
                  </div>
                  <p className="text-sm text-gray-400 mt-2 italic">
                    {routeSafety.status === "Safe"
                      ? "Your route is clear ✅"
                      : routeSafety.status === "Caution"
                      ? "Minor risks detected ⚠️ Stay cautious"
                      : routeSafety.status === "Alert"
                      ? "Stay alert and follow the map route! 🚨"
                      : "Set destination to analyze route safety"}
                  </p>
                </div>
              ) : (
                <p className="text-gray-400 text-sm italic">
                  Set a destination to analyze route safety...
                </p>
              )}
            </div>

            {/* Zone Legend */}
            <div className="mt-6 p-4 bg-gray-800 rounded-lg shadow-inner">
              <h3 className="font-semibold mb-2 text-lg">Zone Legend</h3>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-green-500 rounded-sm"></span> Safe Area
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-yellow-400 rounded-sm"></span> Caution Area
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-orange-500 rounded-sm"></span> Medium Crime Area
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-red-600 rounded-sm"></span> High Crime Area
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-purple-600 rounded-sm"></span> Alert Area
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-red-500 rounded-sm"></span> Normal Route
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-green-500 rounded-sm"></span> Safe Route
                </div>
              </div>
            </div>
          </aside>

          {/* Main Map */}
          <main className="flex-1 relative">
            {userLocation ? (
              <MapContainer
                center={[userLocation.lat, userLocation.lng]}
                zoom={14}
                scrollWheelZoom
                className="h-full w-full"
                whenCreated={mapInstance => (mapRef.current = mapInstance)}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[userLocation.lat, userLocation.lng]}>
                  <Popup>You are here</Popup>
                </Marker>

                {crimeData.map((item, idx) => (
                  <Marker
                    key={idx}
                    position={[item.lat, item.lng]}
                    icon={severityIcons[item.severity] || crimeIconUrl}
                  >
                    <Popup>{item.description}</Popup>
                  </Marker>
                ))}

                {crimeData.length > 0 && <CrimeHeatLayer crimeData={crimeData} />}

                {crimeData.map((zone, idx) => (
                  <Circle
                    key={idx}
                    center={[zone.lat, zone.lng]}
                    radius={zone.type === "crime" ? 150 : 80}
                    pathOptions={{ color: getZoneColor(zone), fillOpacity: 0.3 }}
                  />
                ))}

                {userLocation && destinationCoords && (
                  <RoutingMachine start={userLocation} end={destinationCoords} color="green" />
                )}
              </MapContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-lg">
                Fetching your current location...
              </div>
            )}

            {/* Footer */}
            <footer className="bg-gradient-to-r from-indigo-800 via-indigo-900 to-purple-900 text-gray-200 py-8 px-6 shadow-inner border-t border-white/10">
              <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                <div className="flex flex-col items-start space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white/10 p-2 rounded-full border border-white/20">
                      <Shield size={26} className="text-yellow-300" />
                    </div>
                    <h2 className="text-xl font-semibold text-white tracking-wide">NightSafe</h2>
                  </div>
                  <p className="text-sm text-gray-400">
                    Empowering communities with safety insights and live location alerts. Stay safe, stay informed.
                  </p>
                </div>

                <div className="flex flex-col space-y-2">
                  <h3 className="text-lg font-semibold text-yellow-300 mb-2">Quick Links</h3>
                  <a href="/" className="hover:text-yellow-400 transition-colors duration-200">Home</a>
                  <a href="/FamilyLogin" className="hover:text-yellow-400 transition-colors duration-200">Member Login</a>
                  <a href="/Signup" className="hover:text-yellow-400 transition-colors duration-200">Create Account</a>
                  <a href="/NightSafeMap" className="hover:text-yellow-400 transition-colors duration-200">Map</a>
                </div>

                <div className="flex flex-col space-y-3">
                  <h3 className="text-lg font-semibold text-yellow-300 mb-2">Contact Us</h3>
                  <div className="flex items-center gap-2">
                    <PhoneCall size={18} />
                    <span className="text-sm">+91 6380368540</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={18} />
                    <span className="text-sm">shri@nightsafe.in</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={18} />
                    <span className="text-sm">Coimbatore, Tamil Nadu</span>
                  </div>

                 
                </div>
              </div>

              <div className="text-center text-gray-400 text-sm mt-8 border-t border-white/10 pt-4">
                © 2025 NightSafe. All rights reserved. | Built for Safety and Awareness.
              </div>
            </footer>
          </main>
        </div>
      </div>
    </>
  );
}
