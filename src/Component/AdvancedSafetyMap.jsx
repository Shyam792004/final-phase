// src/components/AdvancedSafetyMap.jsx
import React, { useEffect, useRef, useState } from "react";
import { ref, set, push, onValue, remove, query, orderByChild } from "firebase/database";
import { db } from "../firebaseConfig";
import { motion } from "framer-motion";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  CircleMarker,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { X, MessageSquare, Smartphone, Check, UserPlus, Shield } from "lucide-react";
import { toast } from "sonner";
import { ENDPOINTS } from "../lib/api";


/*
  AdvancedSafetyMap
  - Live route sharing (Start/Stop)
  - Voice SOS trigger -> in-app alert + SMS to contacts + broadcast alert to community feed
  - Community safety feed (post alerts, real-time markers)
  - Uses Firebase Realtime Database nodes:
      /routes/{userId}/points -> pushed points {lat,lng,ts}
      /routes/{userId}/meta  -> {lastUpdated}
      /locations/{userId}    -> current location (from ShareLocation or this component)
      /alerts/               -> community alerts (push)
  - Props:
      userId (string) - logged-in user id (required)
      watchFriends (array) - userIds to show routes for (optional)
*/



const EMERGENCY_CONTACTS = [
  "+916380368540",
  "+919384750414",
  "+916374627679",
  "+910112233445",
  "+910556677889",
];

// small icons
const userIcon = L.divIcon({
  html: `<div class="w-4 h-4 rounded-full bg-blue-500 ring-4 ring-blue-300"></div>`,
  className: "",
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const friendIcon = L.divIcon({
  html: `<div class="w-4 h-4 rounded-full bg-indigo-400 ring-2 ring-indigo-200"></div>`,
  className: "",
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

function Recenter({ when }) {
  const map = useMap();
  useEffect(() => {
    if (when) map.setView(when, 14, { animate: true });
  }, [when]);
  return null;
}

export default function AdvancedSafetyMap({ watchFriends = [] }) {
  const userId = localStorage.getItem("currentUserName")?.replace(/\s/g, "_") || 
                 localStorage.getItem("loggedInUser")?.replace(/\s/g, "_") || 
                 "User";

  // map + location
  const [myLocation, setMyLocation] = useState(null);

  const [error, setError] = useState(null);
  const [center, setCenter] = useState([20.5937, 78.9629]);

  // route sharing
  const [sharingRoute, setSharingRoute] = useState(false);
  const routeWatchRef = useRef(null);
  const [myRoutePoints, setMyRoutePoints] = useState([]); // for local visualization

  // firebase live routes (all users)
  const [allRoutes, setAllRoutes] = useState({}); // { userId: [{lat,lng,ts}, ...] }

  // community feed
  const [alertsList, setAlertsList] = useState([]); // array of {id, userId, msg, lat,lng,ts}
  const [newAlertMsg, setNewAlertMsg] = useState("");

  // voice SOS
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const [sosActive, setSosActive] = useState(false);

  // UI states
  const [showPostSuccess, setShowPostSuccess] = useState(false);

  // --- New states for Contact Selection ---
  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [shareModes, setShareModes] = useState({ sms: true, whatsapp: false });
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    const fetchContacts = async () => {
      const storedId = localStorage.getItem("currentUserId");
      const username = localStorage.getItem("currentUserName");

      const userId = (storedId && storedId !== "undefined" && storedId !== "null") ? storedId : null;

      if (!userId && !username) return;

      try {
        const url = userId ? ENDPOINTS.CONTACTS_BY_USER_ID(userId) : ENDPOINTS.CONTACTS(username);
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setContacts(data);
        }
      } catch (err) {
        console.error("AdvancedMap fetch error:", err);
      }
    };
    fetchContacts();
  }, []);

  // === get live location (for centering / optional current location) ===
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation not supported by your browser.");
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setMyLocation([latitude, longitude]);
        setCenter([latitude, longitude]);
        // optionally update 'locations/{userId}' so friends can see current location
        set(ref(db, `locations/${userId}`), {
          lat: latitude,
          lng: longitude,
          timestamp: Date.now(),
        }).catch((e) => console.warn("Failed to write current location:", e));
      },
      (err) => {
        setError(err.message);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [userId]);

  // === subscribe to routes in firebase and build polylines ===
  useEffect(() => {
    const routesRef = ref(db, `routes`);
    // We'll listen to 'routes' tree and reconstruct route arrays for each user
    const unsub = onValue(routesRef, (snap) => {
      const val = snap.val() || {};
      const res = {};
      // val: { user1: { points: { key: {lat,lng,ts}, ... }, meta: {...}}, user2: ... }
      Object.entries(val).forEach(([uid, data]) => {
        const ptsObj = data.points || {};
        const pts = Object.values(ptsObj)
          .sort((a, b) => (a.ts || 0) - (b.ts || 0))
          .map((p) => [p.lat, p.lng]);
        res[uid] = pts;
      });
      setAllRoutes(res);
    });
    return () => unsub();
  }, []);

  // === subscribe to community alerts
  useEffect(() => {
    const alertsRef = query(ref(db, "alerts"), orderByChild("ts"));
    const unsub = onValue(alertsRef, (snap) => {
      const val = snap.val() || {};
      const arr = Object.entries(val).map(([id, o]) => ({ id, ...o }));
      // keep only recent (e.g., last 48 hours) for client
      const cutoff = Date.now() - 48 * 60 * 60 * 1000;
      const recent = arr.filter((a) => (a.ts || 0) >= cutoff);
      setAlertsList(recent);
    });
    return () => unsub();
  }, []);

  // helper to push route point to firebase
  const pushRoutePoint = (coords) => {
    const pointsRef = ref(db, `routes/${userId}/points`);
    const newPointRef = push(pointsRef);
    set(newPointRef, { lat: coords[0], lng: coords[1], ts: Date.now() }).catch((e) =>
      console.warn("route push failed", e)
    );
    // update meta
    set(ref(db, `routes/${userId}/meta`), { lastUpdated: Date.now() }).catch(() => { });
  };

  // start/stop route sharing
  const startSharing = () => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation not supported.");
      return;
    }
    setSharingRoute(true);
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const coords = [latitude, longitude];
        setMyRoutePoints((prev) => [...prev, coords]);
        pushRoutePoint(coords);
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );
    routeWatchRef.current = id;
  };

  const stopSharing = () => {
    setSharingRoute(false);
    if (routeWatchRef.current) {
      navigator.geolocation.clearWatch(routeWatchRef.current);
      routeWatchRef.current = null;
    }
  };

  const toggleRouteSharing = () => {
    if (sharingRoute) {
      stopSharing();
    } else {
      setShowContactModal(true);
    }
  };

  const handleSendAndStart = () => {
    if (selectedContacts.length === 0) {
      toast.error("Please select at least one contact");
      return;
    }

    startSharing();
    setShowContactModal(false);

    // Use current location from state for synchronous window.open (avoids popup blockers)
    const lat = myLocation?.[0] || center[0];
    const lng = myLocation?.[1] || center[1];

    const mapLink = `https://maps.google.com/?q=${lat},${lng}`;
    const name = localStorage.getItem("loggedInUser") || "User";
    const message = `🚨 NIGHTSAFE: ${name} is sharing their live route with you.\nView here: ${mapLink}`;

    const selectedPhoneNumbers = selectedContacts
      .map(id => contacts.find(c => c.id === id)?.phone)
      .filter(Boolean)
      .map(phone => phone.replace(/\D/g, '')); // Sanitize: Keep only digits

    if (shareModes.sms) {
      const smsUri = `sms:${selectedPhoneNumbers.join(",")}?body=${encodeURIComponent(message)}`;
      window.open(smsUri, "_self");
    }

    if (shareModes.whatsapp) {
      selectedPhoneNumbers.forEach((phone, index) => {
        // Add country code if missing (assuming India +91)
        const formattedPhone = phone.length === 10 ? `91${phone}` : phone;
        const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;

        // Open first immediately, others with delay to help bypass blockers
        if (index === 0) {
          window.open(waUrl, "_blank");
        } else {
          setTimeout(() => {
            window.open(waUrl, "_blank");
          }, index * 1000);
        }
      });
    }

    toast.success(`Route shared with ${selectedContacts.length} contacts!`);
  };

  const toggleContact = (id) => {
    setSelectedContacts(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  // === Voice recognition setup for SOS (Web Speech API) ===
  useEffect(() => {
    // feature-detect
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition || null;
    if (!SpeechRecognition) {
      recognitionRef.current = null;
      return;
    }
    const recog = new SpeechRecognition();
    recog.continuous = true;
    recog.interimResults = false;
    recog.lang = "en-US";

    recog.onresult = (event) => {
      try {
        const transcript = Array.from(event.results)
          .slice(event.resultIndex)
          .map((r) => r[0].transcript)
          .join(" ")
          .toLowerCase();
        // voice trigger phrase detection (simple)
        if (transcript.includes("help me") || transcript.includes("helpme") || transcript.includes("i need help")) {
          // trigger SOS once
          triggerSos();
        }
      } catch (e) {
        console.warn("speech parse error", e);
      }
    };

    recog.onstart = () => setListening(true);
    recog.onend = () => setListening(false);
    recog.onerror = (e) => {
      console.warn("Speech error", e);
      setListening(false);
    };

    recognitionRef.current = recog;
    return () => {
      try {
        recog.stop();
      } catch { }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startVoiceListen = () => {
    if (!recognitionRef.current) {
      setError("Speech recognition not supported in this browser.");
      return;
    }
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.warn("start listen error", e);
    }
  };
  const stopVoiceListen = () => {
    try {
      recognitionRef.current?.stop();
    } catch (e) { }
  };

  // === SOS: in-app alert + send SMS to multiple contacts + broadcast to community feed ===
  const triggerSos = async () => {
    setSosActive(true);
    // broadcast to community feed
    if (myLocation) {
      const alertsRef = push(ref(db, "alerts"));
      set(alertsRef, {
        userId,
        type: "SOS",
        msg: `${userId} triggered SOS`,
        lat: myLocation[0],
        lng: myLocation[1],
        ts: Date.now(),
      }).catch((e) => console.warn("alert push failed", e));
    }

    // prepare SMS body
    const body = encodeURIComponent(
      `🚨 SOS from ${userId}!\nMy location: https://maps.google.com/?q=${myLocation?.[0]},${myLocation?.[1]}`
    );

    // create sms link with multiple recipients (comma separated) - behavior may vary across devices but works on many phones
    const smsUri = `sms:${EMERGENCY_CONTACTS.join(",")}?body=${body}`;

    // open SMS app (user must confirm send)
    window.open(smsUri, "_self");

    // show in-app alert visually for 8 seconds
    setTimeout(() => setSosActive(false), 8000);
  };

  // manual "send SMS to all" alternative (button)
  const sendSmsToAll = () => {
    if (!myLocation) {
      setError("Current location not detected yet.");
      return;
    }
    const body = encodeURIComponent(
      `🚨 SOS from ${userId}!\nMy location: https://maps.google.com/?q=${myLocation?.[0]},${myLocation?.[1]}`
    );
    const smsUri = `sms:${EMERGENCY_CONTACTS.join(",")}?body=${body}`;
    window.location.href = smsUri;
  };

  // === Community feed posting ===
  const postAlert = () => {
    if (!newAlertMsg.trim() || !myLocation) return;
    const alertsRef = push(ref(db, "alerts"));
    set(alertsRef, {
      userId,
      msg: newAlertMsg.trim(),
      lat: myLocation[0],
      lng: myLocation[1],
      ts: Date.now(),
    })
      .then(() => {
        setNewAlertMsg("");
        setShowPostSuccess(true);
        setTimeout(() => setShowPostSuccess(false), 2500);
      })
      .catch((e) => console.warn("post alert failed", e));
  };

  // client-side cleanup: remove old alerts older than 48h (optional)
  useEffect(() => {
    // runs once per minute to remove stale alerts (only for demo - server should handle this)
    const interval = setInterval(async () => {
      const cutoff = Date.now() - 48 * 60 * 60 * 1000;
      const alertsRef = ref(db, "alerts");
      // naive: read current alerts and remove aged ones
      onValue(
        alertsRef,
        (snap) => {
          const val = snap.val() || {};
          Object.entries(val).forEach(([key, v]) => {
            if ((v.ts || 0) < cutoff) {
              remove(ref(db, `alerts/${key}`)).catch(() => { });
            }
          });
        },
        { onlyOnce: true }
      );
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // dynamic colors and small UI helpers
  const smallCard = "p-3 rounded-xl bg-gray-800/60 border border-gray-700 shadow-sm";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: controls */}
        <div className="lg:col-span-1 space-y-4">
          <div className={`${smallCard} flex flex-col gap-4`}>
            <h3 className="text-xl font-bold text-indigo-400">Live Route Sharing</h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              Share your route with family. Points are pushed to Firebase and visible to watchers in real-time.
            </p>

            <div className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={toggleRouteSharing}
                className={`flex-[2] py-3 rounded-2xl font-bold text-white shadow-lg transition-all ${sharingRoute
                  ? "bg-red-500 hover:bg-red-600 shadow-red-500/20"
                  : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
                  }`}
              >
                {sharingRoute ? "Stop Route Share" : "Start Route Share"}
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  remove(ref(db, `routes/${userId}`))
                    .then(() => {
                      setMyRoutePoints([]);
                      toast.success("Route history cleared");
                    })
                    .catch(() => { });
                }}
                className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 font-bold text-slate-300 border border-slate-700 transition-all"
              >
                Clear
              </motion.button>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => (window.location.href = "/liverouteview")}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600
                         text-white font-bold text-lg shadow-xl shadow-indigo-500/25
                         hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700
                         transition-all duration-300"
            >
              🚗 Go to Live Route View
            </motion.button>

            <div className="flex justify-between items-center px-1">
              <span className="text-xs text-slate-400">Points shared</span>
              <span className="text-sm font-black text-emerald-400">{myRoutePoints.length}</span>
            </div>
          </div>


          {/* Voice SOS */}
          <div className={`${smallCard} flex flex-col gap-3`}>
            <h3 className="text-lg font-bold text-red-400">Voice SOS</h3>
            <p className="text-sm text-gray-300">
              Say <span className="font-semibold">"Help me"</span> (or press start listening) to trigger SOS - sends SMS and posts an alert.
            </p>
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  listening ? stopVoiceListen() : startVoiceListen();
                }}
                className={`flex-1 py-2 rounded-full font-semibold ${listening ? "bg-yellow-600 hover:bg-yellow-700" : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
              >
                {listening ? "Stop Listening" : "Start Listening"}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={triggerSos}
                className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 font-semibold"
              >
                Emergency SOS
              </motion.button>
            </div>
            {sosActive && (
              <div className="mt-2 px-3 py-2 rounded-md bg-red-700/30 text-red-200 font-bold text-center">
                SOS triggered — SMS app opened & community alerted
              </div>
            )}
          </div>

          {/* Community Feed Post */}
          <div className={`${smallCard} flex flex-col gap-3`}>
            <h3 className="text-lg font-bold text-emerald-400">Community Safety Feed</h3>
            <textarea
              rows="3"
              value={newAlertMsg}
              onChange={(e) => setNewAlertMsg(e.target.value)}
              placeholder="Describe the issue (e.g., 'Broken streetlight near Main St')"
              className="w-full p-2 bg-gray-900 rounded-md text-sm border border-gray-700 focus:outline-none"
            />
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={postAlert}
                className="flex-1 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 font-semibold"
              >
                Post Alert
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  // center to my location
                  if (myLocation) setCenter(myLocation);
                }}
                className="px-4 py-2 rounded-full bg-gray-700/60 hover:bg-gray-700"
              >
                Center
              </motion.button>
            </div>
            {showPostSuccess && (
              <div className="text-sm text-green-300">Posted to community feed ✓</div>
            )}
          </div>


          {/* Alerts list preview (with delete option) */}
          <div className={`${smallCard} space-y-2`}>
            <h4 className="font-semibold text-gray-200">Recent Alerts</h4>
            <div className="max-h-56 overflow-auto rounded-md divide-y divide-gray-800">
              {alertsList.slice().reverse().map((a) => (
                <div
                  key={a.id}
                  className="p-2 flex flex-col hover:bg-gray-800/60 transition-all duration-200"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Reported by - {a.userId}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(a.ts).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-300 mt-1">{a.msg}</div>

                  {/* 🗑️ Delete Button (only for your posts) */}
                  {a.userId === userId && (
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        if (window.confirm("Delete this alert?")) {
                          remove(ref(db, `alerts/${a.id}`))
                            .then(() => console.log("Alert deleted:", a.id))
                            .catch((e) => console.warn("Delete failed:", e));
                        }
                      }}
                      className="self-end mt-2 px-3 py-1 text-xs rounded-md bg-red-600/80 hover:bg-red-700 text-white font-semibold transition-colors"
                    >
                      Delete
                    </motion.button>
                  )}
                </div>
              ))}
              {alertsList.length === 0 && (
                <div className="text-xs text-gray-500 text-center py-2">
                  No recent alerts
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: map area - spans 2 columns on large screens */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl overflow-hidden border border-gray-800 shadow-lg">
            <MapContainer center={center} zoom={13} style={{ height: "72vh", width: "100%" }}>
              <TileLayer
                attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <Recenter when={center} />

              {/* my location marker */}
              {myLocation && (
                <>
                  <Marker position={myLocation} icon={userIcon}>
                    <Popup>
                      <div className="text-xs">
                        <div className="font-semibold">{userId} (You)</div>
                        <div>Live location</div>
                      </div>
                    </Popup>
                  </Marker>
                  <CircleMarker
                    center={myLocation}
                    radius={24}
                    pathOptions={{ color: "rgba(59,130,246,0.4)", fillOpacity: 0.12 }}
                  />
                </>
              )}

              {/* draw all routes (each user's points become a polyline) */}
              {Object.entries(allRoutes).map(([uid, pts]) => {
                if (!pts || pts.length < 2) return null;
                // choose color for polyline: your route is green, others are indigo/orange
                const color = uid === userId ? "#10b981" : "#6366f1";
                return <Polyline key={uid} positions={pts} pathOptions={{ color, weight: 4, opacity: 0.85 }} />;
              })}

              {/* show alerts as markers */}
              {alertsList.map((a) => (
                <Marker
                  key={a.id}
                  position={[a.lat, a.lng]}
                  icon={L.divIcon({
                    html: `<div class="text-xs px-2 py-1 rounded bg-red-600 text-white font-semibold">${a.msg.length > 16 ? a.msg.slice(0, 14) + "…" : a.msg}</div>`,
                    className: "",
                    iconSize: [120, 30],
                  })}
                >
                  <Popup>
                    <div className="text-sm">
                      <div className="font-semibold">{a.userId}</div>
                      <div className="text-xs">{a.msg}</div>
                      <div className="text-xs text-gray-400 mt-1">{new Date(a.ts).toLocaleString()}</div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* small polylines for myRoutePoints (local copy) for immediate visual (optional) */}
              {myRoutePoints.length >= 2 && (
                <Polyline positions={myRoutePoints} pathOptions={{ color: "#10b981", weight: 3, dashArray: "6 6" }} />
              )}
            </MapContainer>
          </div>

          {/* floating sos/send SMS shortcuts */}
          <div className="fixed right-6 bottom-8 z-50 flex flex-col gap-3 items-end">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                // post a calm alert first in community then open SMS to all
                if (myLocation) {
                  const alertsRef = push(ref(db, "alerts"));
                  set(alertsRef, {
                    userId,
                    type: "SOS",
                    msg: `${userId} sent manual SOS`,
                    lat: myLocation[0],
                    lng: myLocation[1],
                    ts: Date.now(),
                  }).catch(() => { });
                }
                sendSmsToAll();
              }}
              className="px-5 py-3 rounded-full bg-gradient-to-r from-red-600 to-pink-600 shadow-2xl text-white font-bold"
            >
              Send SMS to All
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                // nice pulsing SOS button
                setSosActive(true);
                triggerSos();
              }}
              className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-2xl text-white text-lg font-extrabold animate-pulse"
            >
              SOS
            </motion.button>
          </div>
        </div>
      </div>

      {/* small footer */}
      <div className="max-w-7xl mx-auto mt-6 text-xs text-gray-500">
        Live demo: Route sharing, voice SOS, and community feed — Firebase realtime. Make sure to allow location & (for SMS) open on a real phone.
      </div>
      {/* Modal Overlay */}
      {showContactModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-[#111827] border border-white/10 w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Select Contacts</h3>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <p className="text-sm text-gray-400 mb-6 font-medium">
                Choose who you want to share your live route with. They will receive an SMS alert.
              </p>

              <div className="space-y-3 mb-8 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {contacts.length === 0 ? (
                  <div className="text-center py-8 bg-white/5 rounded-3xl border border-dashed border-white/10">
                    <p className="text-gray-500 text-sm">No contacts found.</p>
                    <button
                      onClick={() => window.location.href = "/AddMember"}
                      className="mt-2 text-indigo-400 text-xs font-bold hover:underline"
                    >
                      + Add Members
                    </button>
                  </div>
                ) : (
                  contacts.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => toggleContact(contact.id)}
                      className={`flex items-center gap-4 p-4 rounded-3xl border transition-all cursor-pointer ${selectedContacts.includes(contact.id)
                        ? "bg-indigo-500/10 border-indigo-500/50"
                        : "bg-white/5 border-transparent hover:border-white/10"
                        }`}
                    >
                      <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${selectedContacts.includes(contact.id)
                        ? "bg-white border-white"
                        : "border-gray-600"
                        }`}>
                        {selectedContacts.includes(contact.id) && (
                          <Check size={16} className="text-indigo-600 stroke-[4]" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-white text-base leading-tight">{contact.name}</p>
                        <p className="text-xs text-indigo-400/80 font-medium">
                          {contact.relationship || contact.role} • {contact.phone.slice(-4).padStart(contact.phone.length, '*')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => setShareModes(prev => ({ ...prev, sms: !prev.sms }))}
                  className={`flex items-center justify-center gap-2 py-3 rounded-2xl border transition-all ${shareModes.sms
                    ? "bg-indigo-500/20 border-indigo-500 text-white"
                    : "bg-white/5 border-transparent text-gray-500"
                    }`}
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center ${shareModes.sms ? "bg-white" : "border-2 border-gray-600"}`}>
                    {shareModes.sms && <Check size={14} className="text-indigo-600 stroke-[4]" />}
                  </div>
                  <MessageSquare size={16} />
                  <span className="text-sm font-bold">SMS</span>
                </button>

                <button
                  onClick={() => setShareModes(prev => ({ ...prev, whatsapp: !prev.whatsapp }))}
                  className={`flex items-center justify-center gap-2 py-3 rounded-2xl border transition-all ${shareModes.whatsapp
                    ? "bg-indigo-500/20 border-indigo-500 text-white"
                    : "bg-white/5 border-transparent text-gray-500"
                    }`}
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center ${shareModes.whatsapp ? "bg-white" : "border-2 border-gray-600"}`}>
                    {shareModes.whatsapp && <Check size={14} className="text-indigo-600 stroke-[4]" />}
                  </div>
                  <Smartphone size={16} />
                  <span className="text-sm font-bold">WhatsApp</span>
                </button>
              </div>

              <button
                onClick={handleSendAndStart}
                disabled={selectedContacts.length === 0}
                className="w-full py-4 rounded-2xl bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-lg transition-all shadow-xl"
              >
                Send & Start Tracking ({selectedContacts.length})
              </button>

              <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Shield size={14} className="animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">End-to-End Encrypted</span>
                </div>
                <p className="text-[10px] text-gray-500 text-center leading-relaxed max-w-[200px]">
                  Your live location is shared securely with verified guardians only.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
