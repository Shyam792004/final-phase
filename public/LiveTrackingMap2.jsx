import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet.heat";
import { FiPhone, FiAlertTriangle, FiMapPin, FiSearch, FiMap } from "react-icons/fi";

import crimeIconUrl from "./icons/crime.png";
import policeIconUrl from "./icons/police.png";
import hospitalIconUrl from "./icons/hospital.png";

// Custom icons for severity
const severityIcons = {
  low: new L.Icon({ iconUrl: new URL("./icons/low.png", import.meta.url).href, iconSize: [30, 30] }),
  medium: new L.Icon({ iconUrl: new URL("./icons/medium.png", import.meta.url).href, iconSize: [30, 30] }),
  high: new L.Icon({ iconUrl: new URL("./icons/high.png", import.meta.url).href, iconSize: [30, 30] }),
  alert: new L.Icon({ iconUrl: new URL("./icons/alert.png", import.meta.url).href, iconSize: [30, 30] }),
  caution: new L.Icon({ iconUrl: new URL("./icons/caution.png", import.meta.url).href, iconSize: [30, 30] }),
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

// Safe route polyline
const SafeRoute = ({ route }) => {
  const map = useMap();
  useEffect(() => {
    if (!route || !route.length) return;
    const routeLine = L.polyline(route, {
      color: "green",
      weight: 6,
      opacity: 0.7,
      dashArray: "8,6",
    }).addTo(map);
    return () => map.removeLayer(routeLine);
  }, [route, map]);
  return null;
};

export default function App() {
  const [userLocation, setUserLocation] = useState(null);
  const [destination, setDestination] = useState("");
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [crimeData, setCrimeData] = useState([]);
  const [emergencyMsg, setEmergencyMsg] = useState("");
  const [safeRoute, setSafeRoute] = useState([]);
  const mapRef = useRef();

  // Get user location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => alert("Unable to get your location")
    );
  }, []);

  // Load crime data from public folder
  useEffect(() => {
    fetch("/data/coimbatore_crimes.json")
      .then(res => res.json())
      .then(data => {
        const mappedData = data.map(d => ({
          type: "crime",
          lat: d.lat,
          lng: d.lng,
          description: `${d.crime_type}: ${d.description}`,
          severity: d.severity, // low, medium, high, alert, caution
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

  const handleGetDirections = async () => {
    if (!destination) return alert("Enter a destination");
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${destination}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const dest = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        setDestinationCoords(dest);
        if (mapRef.current) mapRef.current.flyTo([dest.lat, dest.lng], 14);

        // Safe route calculation example
        if (userLocation) {
          const midLat = (userLocation.lat + dest.lat) / 2 + 0.002;
          const midLng = (userLocation.lng + dest.lng) / 2 - 0.002;
          setSafeRoute([[userLocation.lat, userLocation.lng], [midLat, midLng], [dest.lat, dest.lng]]);
        }
      } else alert("Destination not found");
    } catch (err) {
      console.error(err);
      alert("Error fetching destination");
    }
  };

  const handleSendEmergency = () => {
    if (!emergencyMsg) return alert("Type your emergency message");
    alert(`Emergency message sent: ${emergencyMsg}`);
    setEmergencyMsg("");
  };

  const handlePanToType = type => {
    const item = crimeData.find(c => c.severity === type || c.type === type);
    if (item && mapRef.current) mapRef.current.flyTo([item.lat, item.lng], 15);
    else alert(`${type} not found nearby`);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Navbar */}
      <header className="h-16 bg-gradient-to-r from-indigo-700 via-indigo-900 to-purple-700 text-white flex items-center justify-between px-6 shadow-lg">
        <h1 className="text-2xl font-bold tracking-wide">NightSafe Map</h1>
        <button className="flex items-center gap-2 bg-red-600 px-5 py-2 rounded-lg hover:bg-red-700 transition-all">
          <FiPhone /> Emergency Call
        </button>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-96 bg-gradient-to-b from-gray-800 to-gray-900 text-white p-6 flex flex-col gap-6 shadow-lg overflow-y-auto">
          <h2 className="text-2xl font-semibold border-b border-gray-600 pb-2 mb-6">Quick Actions</h2>

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

          <div className="mt-4">
            <h3 className="text-lg font-semibold border-b border-gray-600 pb-2 mb-2">Nearby</h3>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handlePanToType("police")}
                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-all shadow-md"
              >
                <FiMapPin /> Police
              </button>
              <button
                onClick={() => handlePanToType("hospital")}
                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-all shadow-md"
              >
                <FiMapPin /> Hospital
              </button>
              <button
                onClick={() => alert("Coming soon")}
                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-all shadow-md"
              >
                <FiMap /> Crime Spots
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 p-4 bg-gray-800 rounded-lg shadow-inner">
            <h3 className="font-semibold mb-2 text-lg">Zone Legend</h3>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2"><span className="w-4 h-4 bg-green-500 rounded-sm"></span> Safe Area</div>
              <div className="flex items-center gap-2"><span className="w-4 h-4 bg-yellow-400 rounded-sm"></span> Caution Area</div>
              <div className="flex items-center gap-2"><span className="w-4 h-4 bg-orange-500 rounded-sm"></span> Medium Crime Area</div>
              <div className="flex items-center gap-2"><span className="w-4 h-4 bg-red-600 rounded-sm"></span> High Crime Area</div>
              <div className="flex items-center gap-2"><span className="w-4 h-4 bg-purple-600 rounded-sm"></span> Alert Area</div>
              <div className="flex items-center gap-2"><span className="w-4 h-4 bg-red-500 rounded-sm"></span> Normal Route</div>
              <div className="flex items-center gap-2"><span className="w-4 h-4 bg-green-500 rounded-sm"></span> Safe Route</div>
            </div>
          </div>
        </aside>

        {/* Map */}
        <main className="flex-1 relative">
          {userLocation && (
            <MapContainer
              center={[userLocation.lat, userLocation.lng]}
              zoom={14}
              scrollWheelZoom
              className="h-full w-full"
              whenCreated={mapInstance => (mapRef.current = mapInstance)}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

              {/* User marker */}
              <Marker position={[userLocation.lat, userLocation.lng]}>
                <Popup>You are here</Popup>
              </Marker>

              {/* Crime/Police/Hospital markers with severity icons */}
              {crimeData.map((item, idx) => (
                <Marker
                  key={idx}
                  position={[item.lat, item.lng]}
                  icon={severityIcons[item.severity] || crimeIconUrl}
                >
                  <Popup>{item.description}</Popup>
                </Marker>
              ))}

              {/* Crime HeatMap */}
              {crimeData.length > 0 && <CrimeHeatLayer crimeData={crimeData} />}

              {/* Crime Zones */}
              {crimeData.map((zone, idx) => (
                <Circle
                  key={idx}
                  center={[zone.lat, zone.lng]}
                  radius={zone.type === "crime" ? 150 : 80}
                  pathOptions={{ color: getZoneColor(zone), fillOpacity: 0.3 }}
                />
              ))}

              {/* Routes */}
              {userLocation && destinationCoords && (
                <>
                  <RoutingMachine start={userLocation} end={destinationCoords} color="red" />
                  <SafeRoute route={safeRoute} />
                </>
              )}
            </MapContainer>
          )}
        </main>
      </div>
    </div>
  );
}
