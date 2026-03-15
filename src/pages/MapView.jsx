import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import { db } from "../firebaseConfig";
import { ref, onValue } from "firebase/database";

// Custom Popup Styles - Forced Bright Mode
const popupStyles = `
  .clean-popup .leaflet-popup-content-wrapper {
    background: #ffffff !important;
    color: #0f172a !important;
    border-radius: 12px !important;
    padding: 0 !important;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
    border: 1px solid rgba(0,0,0,0.05) !important;
  }
  .clean-popup .leaflet-popup-content {
    margin: 0 !important;
    width: auto !important;
  }
  .clean-popup .leaflet-popup-tip {
    background: #ffffff !important;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1) !important;
  }
  .clean-popup .leaflet-popup-close-button {
    color: #64748b !important;
    padding: 8px !important;
  }
`;

// Fix for default Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const threatIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const historyIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [20, 32],
  iconAnchor: [10, 32],
  popupAnchor: [0, -28],
  shadowSize: [32, 32]
});

const LOCATIONS = {
  gandhipuram: [11.0168, 76.9674],
  "rs puram": [11.0085, 76.9560],
  "saibaba colony": [11.0283, 76.9516],
  "police station": [11.0168, 76.9674],
};

function Route({ from, to }) {
  const map = useMap();
  const ref = useRef(null);

  useEffect(() => {
    if (!from || !to) return;
    ref.current?.remove();
    ref.current = L.Routing.control({
      waypoints: [L.latLng(from), L.latLng(to)],
      addWaypoints: false,
      draggableWaypoints: false,
      show: false,
      createMarker: () => null,
    }).addTo(map);
    return () => ref.current?.remove();
  }, [from, to, map]);

  return null;
}

export function MapView({ destination }) {
  const [position, setPosition] = useState(null);
  const [threats, setThreats] = useState({});
  const [history, setHistory] = useState({});

  useEffect(() => {
    const id = navigator.geolocation.watchPosition(
      (pos) =>
        setPosition([
          pos.coords.latitude,
          pos.coords.longitude,
        ]),
      console.error,
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  useEffect(() => {
    const trackingRef = ref(db, "live_tracking");
    const historyRef = ref(db, "threat_history");

    const unsubLive = onValue(trackingRef, (snap) => {
      const data = snap.val() || {};
      const activeThreats = {};
      Object.entries(data).forEach(([name, meta]) => {
        if (meta.threatActive) activeThreats[name] = meta;
      });
      setThreats(activeThreats);
    });

    const unsubHistory = onValue(historyRef, (snap) => {
      setHistory(snap.val() || {});
    });

    return () => {
      unsubLive();
      unsubHistory();
    };
  }, []);

  if (!position) {
    return (
      <div className="h-[600px] flex items-center justify-center text-white bg-slate-900 border border-white/10 rounded-2xl">
        Locating you…
      </div>
    );
  }

  const key = destination?.toLowerCase();
  const destCoords = key ? LOCATIONS[key] : null;

  return (
    <div className="h-full w-full rounded-2xl overflow-hidden border border-white/10 relative">
      <style>{popupStyles}</style>
      <MapContainer
        center={position}
        zoom={15}
        className="h-full w-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <Marker position={position}>
          <Popup>You are here</Popup>
        </Marker>

        {/* Live Threats */}
        {Object.entries(threats).map(([name, meta]) => (
          <Marker
            key={name}
            position={[meta.latitude, meta.longitude]}
            icon={threatIcon}
            eventHandlers={{
              mouseover: (e) => e.target.openPopup(),
              mouseout: (e) => e.target.closePopup()
            }}
          >
            <Popup className="clean-popup">
              <div className="p-3 bg-white rounded-lg shadow-xl border-l-4 border-red-500 min-w-[150px]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Live Threat</span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-900 leading-none">{meta.username || name}</p>
                  <p className="text-[11px] font-medium text-slate-500">
                    {meta.currentDate} <span className="opacity-30 mx-1">|</span> {meta.currentTime}
                  </p>
                  <div className="pt-2 mt-2 border-t border-slate-100">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Loc: {meta.latitude.toFixed(4)}, {meta.longitude.toFixed(4)}</p>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Historical Situation Points */}
        {Object.entries(history).map(([user, points]) => (
          Object.entries(points).map(([timestamp, p]) => (
            <Marker
              key={`${user}-${timestamp}`}
              position={[p.latitude, p.longitude]}
              icon={historyIcon}
              opacity={0.8}
              eventHandlers={{
                mouseover: (e) => e.target.openPopup(),
                mouseout: (e) => e.target.closePopup()
              }}
            >
              <Popup className="clean-popup">
                <div className="p-3 bg-white rounded-lg shadow-xl border-l-4 border-orange-400 min-w-[150px]">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-3 h-3 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Situation Mark</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-900 leading-none">{p.username}</p>
                    <p className="text-[11px] font-medium text-slate-500">
                      {p.date} <span className="opacity-30 mx-1">|</span> {p.time}
                    </p>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))
        ))}

        {destCoords && (
          <Route from={position} to={destCoords} />
        )}
      </MapContainer>
    </div>
  );
}
