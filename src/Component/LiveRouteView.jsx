// src/Component/LiveRouteView.jsx
import React, { useEffect, useState, useRef } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebaseConfig";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion } from "framer-motion";

// Custom car icon for better tracking look
const carIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3448/3448613.png",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

// Helper component to recenter map dynamically
function RecenterAutomatically({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], map.getZoom(), { animate: true });
    }
  }, [lat, lng]);
  return null;
}

export default function LiveRouteView() {
  const userId = localStorage.getItem("currentUserName")?.replace(/\s/g, "_") || 
                 localStorage.getItem("loggedInUser")?.replace(/\s/g, "_") || 
                 "User";
  const [points, setPoints] = useState([]);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);
  const pointsRef = useRef([]);

  // Live Firebase subscription
  useEffect(() => {
    const routeRef = ref(db, `routes/${userId}/points`);
    const unsubscribe = onValue(
      routeRef,
      (snapshot) => {
        const val = snapshot.val();
        if (val) {
          const coords = Object.values(val)
            .sort((a, b) => (a.ts || 0) - (b.ts || 0))
            .map((p) => [p.lat, p.lng]);
          setPoints(coords);
          pointsRef.current = coords;
          setIsLive(true);
          setLastUpdate(new Date().toLocaleTimeString());
        } else {
          setPoints([]);
          setIsLive(false);
        }
      },
      (err) => setError(err.message)
    );
    return () => unsubscribe();
  }, [userId]);

  const last = points[points.length - 1];
  const center = last || [20.5937, 78.9629]; // Default India center

  return (
    <motion.div
      className="w-full min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 className="text-2xl font-bold mb-4 text-indigo-400">
        🚗 Live Route Tracking
      </h2>

      <div className="w-full max-w-5xl border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
        <MapContainer
          center={center}
          zoom={14}
          style={{ height: "70vh", width: "100%" }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://openstreetmap.org">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {last && <RecenterAutomatically lat={last[0]} lng={last[1]} />}

          {points.length > 1 && (
            <Polyline
              positions={points}
              color="#4ade80"
              weight={5}
              opacity={0.8}
              smoothFactor={1}
            />
          )}

          {last && (
            <Marker position={last} icon={carIcon}>
              <Popup>
                <p className="font-semibold text-indigo-600">Current Location</p>
                <p className="text-sm text-gray-600">
                  Updated at: {lastUpdate}
                </p>
              </Popup>
            </Marker>
          )}
        </MapContainer>

        {/* Status bar */}
        <div className="bg-gray-900 text-gray-300 text-center py-3 text-sm">
          {error ? (
            <span className="text-red-400">⚠️ Error: {error}</span>
          ) : !isLive ? (
            "Waiting for live route updates..."
          ) : (
            <>
              ✅ Live Tracking Active —{" "}
              <span className="text-emerald-400 font-semibold">
                {points.length} points
              </span>{" "}
              updated at {lastUpdate}
            </>
          )}
        </div>
      </div>

      {/* Back button */}
      <button
        onClick={() => (window.location.href = "/")}
        className="mt-6 px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600
                   text-white font-semibold shadow-md hover:shadow-lg 
                   hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700
                   transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 active:scale-95"
      >
        ⬅ Back to Dashboard
      </button>
    </motion.div>
  );
}
