import React, { useEffect, useState } from "react";
import {
  ref,
  onValue,
  set,
  push,
  get,
  query,
  limitToLast,
  remove,
} from "firebase/database";
import { db } from "../firebaseConfig";
import { motion } from "framer-motion";
import QRCode from "react-qr-code";
import AppHeader from "./AppHeader";
import {AnimatePresence } from "framer-motion";
// import { motion, AnimatePresence } from "framer-motion";
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  Polygon,
  Popup,
} from "react-leaflet";

export default function SafeCabVerification() {
  const userId = localStorage.getItem("currentUserName")?.replace(/\s/g, "_") || 
                 localStorage.getItem("loggedInUser")?.replace(/\s/g, "_") || 
                 "User";

  const [activeView, setActiveView] = useState("verification");

  const [cabId, setCabId] = useState("");
  const [verified, setVerified] = useState(null);
  const [cabDetails, setCabDetails] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [myLoc, setMyLoc] = useState(null);
  const [tripId, setTripId] = useState(null);
  const [tripActive, setTripActive] = useState(false);
  const [history, setHistory] = useState([]);

  

  const [scanState, setScanState] = useState("idle");

  /* LOCATION */
  useEffect(() => {
    const id = navigator.geolocation.watchPosition((pos) => {
      setMyLoc([pos.coords.latitude, pos.coords.longitude]);
    });
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  /* HISTORY */
  useEffect(() => {
    const tripsRef = query(ref(db, `cabTrips/${userId}`), limitToLast(10));
    onValue(tripsRef, (snap) => {
      const val = snap.val() || {};
      const arr = Object.entries(val)
        .map(([k, t]) => ({ ...t, tripKey: k }))
        .reverse();
      setHistory(arr);
    });
  }, [userId]);

  /* VERIFY CAB */
  const checkCab = async () => {
    if (!cabId.trim()) return;

    const idFormatted = cabId.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

    const snap = await get(ref(db, `trustedCabs/${idFormatted}`));
    const val = snap.val();

    if (val) {
      setVerified(true);
      setCabDetails(val);
      setStatusMsg("Verified Safe Cab ✓");

      const tripRef = push(ref(db, `cabTrips/${userId}`));
      await set(tripRef, {
        cabId: idFormatted,
        verified: true,
        startTime: Date.now(),
        status: "active",
        driver: val,
      });

      setTripId(tripRef.key);
      setTripActive(true);
    } else {
      setVerified(false);
      setStatusMsg("⚠️ Unverified Cab Detected!");
    }
  };

  const startVerification = async () => {
    setScanState("scanning");
    setTimeout(async () => {
      await checkCab();
      setScanState("result");
    }, 2000);
  };

  const endTrip = () => {
    if (!tripId) return;
    set(ref(db, `cabTrips/${userId}/${tripId}/status`), "completed");
    setTripActive(false);
  };

  const deleteTrip = (k) =>
    remove(ref(db, `cabTrips/${userId}/${k}`));

  /* METRICS */
  const stats = {
    total: history.length,
    safe: history.filter((h) => h.verified).length,
    alerts: history.filter((h) => !h.verified).length,
  };

  const riskScore =
    stats.total === 0 ? 10 : Math.min(95, (stats.alerts / stats.total) * 100);

  /* ===== LIVE VERIFICATION VIEW ===== */
  const VerificationView = () => {
    const safetyScore =
      verified === null ? 0 : verified ? 92 : 28;

    return (
      <div className="relative overflow-hidden rounded-2xl border border-indigo-800/40 bg-[#0B1026]/80 backdrop-blur-xl p-6">

        <div className="absolute inset-0 opacity-10 pointer-events-none
          bg-[linear-gradient(to_right,#6C63FF22_1px,transparent_1px),linear-gradient(to_bottom,#6C63FF22_1px,transparent_1px)]
          bg-[size:40px_40px]" />

        <motion.div
          animate={{ opacity:[0.2,0.6,0.2] }}
          transition={{ repeat:Infinity, duration:5 }}
          className="absolute -top-20 -left-20 w-96 h-96 bg-purple-600/30 blur-3xl rounded-full"
        />

        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-[#6C63FF] mb-2">
            LIVE CAB VERIFICATION
          </h2>

          <p className="text-gray-400 text-sm mb-6">
            Intelligence-grade verification protocol
          </p>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-md">
            <input
              value={cabId}
              onChange={(e)=>setCabId(e.target.value)}
              placeholder="TN-38-AB-1234"
              className="w-full p-3 rounded-lg bg-black/40 border border-indigo-500/40 text-white tracking-widest"
            />

            <motion.button
              whileTap={{ scale:0.96 }}
              whileHover={{ scale:1.02 }}
              onClick={startVerification}
              className="mt-4 w-full py-3 rounded-lg bg-[#6C63FF] font-semibold"
            >
              Start Secure Verification
            </motion.button>
          </div>

          {scanState === "scanning" && (
            <div className="mt-6 bg-black/40 border border-cyan-400/40 rounded-xl p-5">
              <p className="text-cyan-300 text-sm mb-3">
                🔍 Scanning identity...
              </p>

              <div className="relative h-24 bg-black/40 rounded overflow-hidden">
                <motion.div
                  animate={{ y:["0%","100%","0%"] }}
                  transition={{ repeat:Infinity, duration:1.5 }}
                  className="absolute left-0 w-full h-1 bg-cyan-400"
                />
              </div>
            </div>
          )}

          {scanState === "result" && verified !== null && (
            <motion.div
              initial={{ opacity:0,y:20 }}
              animate={{ opacity:1,y:0 }}
              className={`mt-6 rounded-xl p-5 border ${
                verified
                  ? "border-green-500 bg-green-500/10"
                  : "border-red-500 bg-red-500/10"
              }`}
            >
              <h3 className="font-bold text-lg">
                {verified ? "✔ VERIFIED VEHICLE" : "⚠ THREAT DETECTED"}
              </h3>

              <p className="text-sm mt-2">{statusMsg}</p>

              <div className="mt-4 flex items-center gap-5">
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 rotate-[-90deg]">
                    <circle cx="48" cy="48" r="40" stroke="#222" strokeWidth="8" fill="none"/>
                    <motion.circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="#00FF9D"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={251}
                      strokeDashoffset={251-(251*safetyScore)/100}
                      initial={{ strokeDashoffset:251 }}
                      animate={{ strokeDashoffset:251-(251*safetyScore)/100 }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-bold">
                    {safetyScore}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-300">Safety Score</p>
                  <p className="text-xs text-gray-500">
                    Pattern recognition active
                  </p>
                </div>
              </div>

              {verified && cabDetails && (
                <div className="mt-4 bg-black/30 p-3 rounded-lg">
                  <p>Driver: {cabDetails.driverName}</p>
                  <p className="text-sm text-gray-400">
                    Company: {cabDetails.company}
                  </p>
                </div>
              )}

              {tripId && verified && (
                <div className="mt-4">
                  <QRCode value={`Trip:${tripId}`} size={120}/>
                </div>
              )}

              {tripActive && (
                <button
                  onClick={endTrip}
                  className="mt-4 bg-red-600 px-4 py-2 rounded"
                >
                  End Trip
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>
    );
  };

const GuardianView = () => {
  const [battery, setBattery] = useState(null);
  const [signal, setSignal] = useState("Checking...");
  const [speed, setSpeed] = useState(0);

  /* ==============================
     BATTERY MONITOR
  ============================== */
  useEffect(() => {
    if (!navigator.getBattery) return;

    let batteryManager;

    navigator.getBattery().then((bat) => {
      batteryManager = bat;
      setBattery(Math.round(bat.level * 100));

      const update = () =>
        setBattery(Math.round(bat.level * 100));

      bat.addEventListener("levelchange", update);

      return () => bat.removeEventListener("levelchange", update);
    });
  }, []);

  /* ==============================
     NETWORK SIGNAL
  ============================== */
  useEffect(() => {
    const connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;

    if (!connection) {
      setSignal("Unsupported");
      return;
    }

    setSignal(connection.effectiveType);

    const update = () =>
      setSignal(connection.effectiveType);

    connection.addEventListener("change", update);

    return () =>
      connection.removeEventListener("change", update);
  }, []);

  /* ==============================
     SPEED TRACKING
  ============================== */
  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const sp = pos.coords.speed;
        setSpeed(sp ? Math.round(sp * 3.6) : 0);
      },
      () => {},
      { enableHighAccuracy: true }
    );

    return () =>
      navigator.geolocation.clearWatch(watchId);
  }, []);

  /* ==============================
     MOCK HIGH-RISK ZONES
  ============================== */
  const riskZones = [
    [
      [13.082, 80.27],
      [13.084, 80.275],
      [13.08, 80.279],
    ],
    [
      [13.05, 80.23],
      [13.053, 80.235],
      [13.047, 80.238],
    ],
  ];

  const policeStations = [
    [13.067, 80.24],
    [13.09, 80.28],
  ];

  return (
    <div className="space-y-4">

      {/* TOP METRICS */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
          <p className="text-gray-400 text-sm">Battery</p>
          <p className="text-green-400 text-xl font-bold">
            {battery ?? "--"}%
          </p>
        </div>

        <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
          <p className="text-gray-400 text-sm">Network</p>
          <p className="text-cyan-400 text-xl font-bold">{signal}</p>
        </div>

        <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
          <p className="text-gray-400 text-sm">Speed</p>
          <p className="text-indigo-400 text-xl font-bold">
            {speed} km/h
          </p>
        </div>

        <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
          <p className="text-gray-400 text-sm">Trip Status</p>
          <p className={tripActive ? "text-green-400" : "text-red-400"}>
            {tripActive ? "LIVE MONITORING" : "INACTIVE"}
          </p>
        </div>
      </div>

      {/* LIVE MAP */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="p-3 border-b border-gray-800 text-sm text-gray-400">
          Guardian Live Monitoring Map
        </div>

        <MapContainer
          center={myLoc || [13.0827, 80.2707]}
          zoom={13}
          style={{ height: "500px", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* USER POSITION */}
          {myLoc && (
            <Marker position={myLoc}>
              <Popup>Live User Location</Popup>
            </Marker>
          )}

          {/* POLICE COVERAGE */}
          {policeStations.map((p, i) => (
            <Circle
              key={i}
              center={p}
              radius={1000}
              pathOptions={{ color: "blue", fillOpacity: 0.1 }}
            />
          ))}

          {/* HIGH RISK ZONES */}
          {riskZones.map((zone, i) => (
            <Polygon
              key={i}
              positions={zone}
              pathOptions={{
                color: "red",
                fillOpacity: 0.3,
              }}
            />
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

// HOTEL STAY AND POLICE STATION FINDER  
const RiskView = () => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState("ALL");

  /* ===========================
     DISTANCE
  ============================ */
  const calcDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;

    return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
  };

  /* ===========================
     ICONS + COLORS
  ============================ */
  const meta = {
    "Hotel Stay": { icon: "🏨", color: "bg-blue-500/20 text-blue-300" },
    Restaurant: { icon: "🍽️", color: "bg-orange-500/20 text-orange-300" },
    Cafe: { icon: "☕", color: "bg-yellow-500/20 text-yellow-300" },
    "Police Station": { icon: "👮", color: "bg-red-500/20 text-red-300" },
    "Bus Stand": { icon: "🚌", color: "bg-green-500/20 text-green-300" },
    "Train Station": { icon: "🚆", color: "bg-purple-500/20 text-purple-300" },
    "Metro Station": { icon: "🚇", color: "bg-cyan-500/20 text-cyan-300" },
  };

  /* ===========================
     IMAGE POOLS
  ============================ */
  const imagePools = {
    hotel: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945",
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa",
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb",
    ],
    restaurant: [
      "https://images.unsplash.com/photo-1559339352-11d035aa65de",
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4",
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5",
    ],
    cafe: [
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93",
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085",
    ],
    police: [
      "https://images.unsplash.com/photo-1581093458791-9d42e7f2f6b0",
    ],
    bus: [
      "https://images.unsplash.com/photo-1519003722824-194d4455a60c",
    ],
    train: [
      "https://images.unsplash.com/photo-1474487548417-781cb71495f3",
    ],
    metro: [
      "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df",
    ],
  };

  /* ===========================
     FETCH (ONCE ONLY)
  ============================ */
  useEffect(() => {
    if (!myLoc || loaded) return;

    const [lat, lng] = myLoc;

    const fetchPlaces = async () => {
      try {
        const query = `
          [out:json];
          (
            node["tourism"="hotel"](around:5000,${lat},${lng});
            node["amenity"="restaurant"](around:5000,${lat},${lng});
            node["amenity"="cafe"](around:5000,${lat},${lng});
            node["amenity"="police"](around:5000,${lat},${lng});
            node["amenity"="bus_station"](around:5000,${lat},${lng});
            node["railway"="station"](around:5000,${lat},${lng});
            node["railway"="subway_entrance"](around:5000,${lat},${lng});
          );
          out;
        `;

        const res = await fetch(
          "https://overpass-api.de/api/interpreter",
          { method: "POST", body: query }
        );

        const data = await res.json();

        let results = (data.elements || [])
          .filter((p) => p.tags?.name)
          .map((p, i) => {
            let type = "Hotel Stay";
            let key = "hotel";

            if (p.tags?.amenity === "restaurant") {
              type = "Restaurant"; key = "restaurant";
            } else if (p.tags?.amenity === "cafe") {
              type = "Cafe"; key = "cafe";
            } else if (p.tags?.amenity === "police") {
              type = "Police Station"; key = "police";
            } else if (p.tags?.amenity === "bus_station") {
              type = "Bus Stand"; key = "bus";
            } else if (p.tags?.railway === "station") {
              type = "Train Station"; key = "train";
            } else if (p.tags?.railway === "subway_entrance") {
              type = "Metro Station"; key = "metro";
            }

            const pool = imagePools[key];
            const image = pool[i % pool.length];

            return {
              id: i,
              name: p.tags.name,
              type,
              distance: calcDistance(lat, lng, p.lat, p.lon),
              lat: p.lat,
              lon: p.lon,
              image,
            };
          });

        results.sort((a, b) => a.distance - b.distance);
        setPlaces(results.slice(0, 30));
      } finally {
        setLoading(false);
        setLoaded(true);
      }
    };

    fetchPlaces();
  }, [myLoc, loaded]);

  const navigateTo = (lat, lon) => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`,
      "_blank"
    );
  };

  /* ===========================
     FILTERED DATA
  ============================ */
  const filtered =
    filter === "ALL"
      ? places
      : places.filter((p) => p.type === filter);

  /* ===========================
     UI
  ============================ */
  return (
    <div className="bg-gradient-to-br from-black via-gray-950 to-black p-6 rounded-2xl border border-gray-800">

      <h2 className="text-2xl font-bold text-indigo-400 mb-4">
        Nearby Safety Navigator
      </h2>

      {/* FILTER CHIPS */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {["ALL", ...Object.keys(meta)].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-sm border ${
              filter === f
                ? "bg-indigo-600 border-indigo-500"
                : "bg-gray-900 border-gray-700"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-gray-400">Loading nearby places...</div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {filtered.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              whileHover={{ scale: 1.04 }}
              className="relative rounded-2xl overflow-hidden group bg-black/40 border border-gray-800 shadow-xl"
            >
              <img
                src={p.image}
                alt={p.name}
                className="h-56 w-full object-cover group-hover:scale-110 transition duration-500"
              />

              {/* gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

              <div className="absolute bottom-0 p-4 w-full">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${meta[p.type]?.color}`}
                >
                  {meta[p.type]?.icon} {p.type}
                </span>

                <h3 className="text-white font-bold mt-2">{p.name}</h3>

                <p className="text-gray-300 text-sm">
                  {p.distance} km away
                </p>

                <button
                  onClick={() => navigateTo(p.lat, p.lon)}
                  className="mt-3 w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition"
                >
                  Navigate
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};


const AnalyticsView = () => {
  const [search, setSearch] = useState("");

  const filtered = history.filter((h) =>
    h.cabId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-950 to-black border border-gray-800 rounded-2xl p-6 shadow-2xl">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-2xl font-bold text-indigo-400">
            Trip Analytics
          </h2>
          <p className="text-gray-400 text-sm">
            Monitoring recent verification activity
          </p>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Cab ID..."
          className="bg-black/40 border border-gray-700 px-3 py-2 rounded-lg text-sm w-64 focus:border-indigo-500 outline-none"
        />
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-xl border border-gray-800">
        <div className="max-h-[420px] overflow-y-auto">

          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-950 border-b border-gray-800">
              <tr className="text-gray-400">
                <th className="text-left p-3">Cab ID</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Time</th>
                <th className="text-left p-3">Action</th>
              </tr>
            </thead>

<tbody>
  <AnimatePresence mode="popLayout">
    {filtered.length === 0 ? (
      <motion.tr
        key="empty"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <td colSpan="4" className="text-center p-8 text-gray-500">
          No trips found
        </td>
      </motion.tr>
    ) : (
      filtered.map((h) => (
        <motion.tr
          key={h.tripKey}
          layout
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{
            opacity: 0,
            x: 120,
            scale: 0.85,
            transition: { duration: 0.25 }
          }}
          whileHover={{
            scale: 1.01,
            backgroundColor: "rgba(255,255,255,0.04)",
          }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="border-b border-gray-900"
        >
          <td className="p-3 font-mono text-indigo-300">
            {h.cabId}
          </td>

          <td className="p-3">
            <span
              className={`px-3 py-1 rounded-full text-xs ${
                h.verified
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {h.verified ? "Verified" : "Alert"}
            </span>
          </td>

          <td className="p-3 text-gray-300">
            {new Date(h.startTime).toLocaleString()}
          </td>

          <td className="p-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.08 }}
              onClick={() => deleteTrip(h.tripKey)}
              className="px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-xs"
            >
              Delete
            </motion.button>
          </td>
        </motion.tr>
      ))
    )}
  </AnimatePresence>
</tbody>

          </table>
        </div>
      </div>
    </div>
  );
};

  /* FIXED HERE ONLY */
  const views = {
    verification: VerificationView(),
    guardian: GuardianView(),
     risk: <RiskView />,
      analytics: <AnalyticsView />,
  };

  return (
    <>
      <AppHeader />
      <div className="min-h-screen bg-black text-white flex">

        <aside className="w-72 bg-gray-950 border-r border-gray-800 p-6">
          <h2 className="text-2xl font-bold text-indigo-400 mb-6">
           NIGHT SHIELD
          </h2>

          {[
            ["verification","🚖 Live Verification"],
            ["guardian","🛡 Guardian Monitor"],
            ["risk","🧠 Safepoint Locator"],
            ["analytics","📊 Analytics"],
          ].map(([k,label])=>(
            <button
              key={k}
              onClick={()=>setActiveView(k)}
              className={`w-full mb-3 p-3 rounded-xl text-left ${
                activeView===k
                  ? "bg-indigo-600"
                  : "bg-gray-900 hover:bg-gray-800"
              }`}
            >
              {label}
            </button>
          ))}
        </aside>

        <main className="flex-1 p-8">

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-900 p-4 rounded-xl">Trips: {stats.total}</div>
            <div className="bg-gray-900 p-4 rounded-xl">Verified: {stats.safe}</div>
            <div className="bg-gray-900 p-4 rounded-xl">Alerts: {stats.alerts}</div>
          </div>

          {views[activeView]}
        </main>
      </div>
    </>
  );
}