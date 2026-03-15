import React, { useEffect, useState, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  CircleMarker,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function FindCabs() {

  const [myLoc, setMyLoc] = useState(null);
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);

  // ================= LOCATION =================
  useEffect(() => {
    const id = navigator.geolocation.watchPosition(
      (p) => setMyLoc([p.coords.latitude, p.coords.longitude]),
      console.warn,
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // ================= CALL TAXI LIST =================
  const callTaxis = [
    { name: "Fastrack Cab", phone: "04222888999" },
    { name: "Red Taxi", phone: "04224567890" },
    { name: "Friends Call Taxi", phone: "08883323333" },
    { name: "Jee Jee Cabs", phone: "09443155403" },
  ];

  // ================= PROVIDERS =================
  const providerConfig = [
    {
      name: "Uber",
      base: 70,
      perKm: 14,
      speed: 35,
      url: "https://m.uber.com",
    },
    {
      name: "Ola",
      base: 65,
      perKm: 13,
      speed: 33,
      url: "https://book.olacabs.com",
    },
    {
      name: "Rapido",
      base: 40,
      perKm: 9,
      speed: 42,
      url: "https://www.rapido.bike",
    },
  ];

  // ================= DISTANCE =================
  const distanceKm = (a, b) => {
    const R = 6371;
    const dLat = (b[0] - a[0]) * Math.PI / 180;
    const dLng = (b[1] - a[1]) * Math.PI / 180;

    const x =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(a[0] * Math.PI / 180) *
      Math.cos(b[0] * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  };

  // ================= DRIVER GENERATION =================
  const generateDriver = (center) => {
    const radius = 1.5 + Math.random() * 2.5;
    const angle = Math.random() * 2 * Math.PI;

    const latOffset = (radius / 111) * Math.cos(angle);
    const lngOffset =
      (radius / (111 * Math.cos(center[0] * Math.PI / 180))) *
      Math.sin(angle);

    return [center[0] + latOffset, center[1] + lngOffset];
  };

  // ================= FIND RIDES =================
  const compareRides = () => {
    if (!myLoc) return;

    const list = providerConfig.map((p, i) => {
      const driver = generateDriver(myLoc);
      const dist = distanceKm(myLoc, driver);

      return {
        ...p,
        id: i,
        driver,
        distance: dist,
        eta: Math.ceil((dist / p.speed) * 60),
        fare: Math.round(p.base + p.perKm * 5),
      };
    });

    setProviders(list);
  };

  const bestProvider = useMemo(() => {
    if (!providers.length) return null;
    return [...providers].sort((a, b) => a.eta - b.eta)[0];
  }, [providers]);

  // ================= LIVE TRACKING =================
  useEffect(() => {
    if (!selectedProvider || !myLoc) return;

    const interval = setInterval(() => {
      setSelectedProvider((prev) => {
        if (!prev) return prev;

        const latDiff = myLoc[0] - prev.driver[0];
        const lngDiff = myLoc[1] - prev.driver[1];
        const dist = Math.sqrt(latDiff ** 2 + lngDiff ** 2);

        if (dist < 0.00025) return prev;

        const step = Math.max(0.0002, Math.min(0.001, prev.distance / 200));

        const newDriver = [
          prev.driver[0] + (latDiff / dist) * step,
          prev.driver[1] + (lngDiff / dist) * step,
        ];

        const d = distanceKm(myLoc, newDriver);

        return {
          ...prev,
          driver: newDriver,
          distance: d,
          eta: Math.ceil((d / prev.speed) * 60),
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedProvider, myLoc]);

  // ================= ICONS =================
  const cabIcon = new L.Icon({
    iconUrl: "taxi.png",
    iconSize: [34, 34],
  });

  const userIcon = new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/149/149060.png",
    iconSize: [30, 30],
  });

  return (
    <div className="min-h-screen bg-black flex justify-center p-4">

      <div className="w-full max-w-6xl bg-gray-950 rounded-3xl overflow-hidden border border-gray-800 shadow-2xl">

        {/* HEADER */}
        <div className="p-4 bg-black border-b border-gray-800">
          <h1 className="text-xl font-bold text-yellow-400">
            NightSafe PRO MAX
          </h1>
        </div>

        {/* MAP CARD */}
        <div className="h-[55vh] relative">
          {myLoc && (
            <MapContainer center={myLoc} zoom={14} style={{ height: "100%", width: "100%" }}>
              <TileLayer
                attribution="&copy; OpenStreetMap"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <Marker position={myLoc} icon={userIcon}>
                <Popup>You</Popup>
              </Marker>

              {selectedProvider && (
                <>
                  <Marker position={selectedProvider.driver} icon={cabIcon} />
                  <Polyline
                    positions={[selectedProvider.driver, myLoc]}
                    pathOptions={{ color: "yellow" }}
                  />
                </>
              )}

              <CircleMarker
                center={myLoc}
                radius={25}
                pathOptions={{ color: "#22c55e", fillOpacity: 0.2 }}
              />
            </MapContainer>
          )}

          {/* FLOATING DRIVER CARD */}
          {selectedProvider && (
            <div className="absolute top-3 left-3 bg-black/80 backdrop-blur p-3 rounded-xl border border-gray-700">
              🚕 {selectedProvider.name} Driver<br />
              {selectedProvider.distance.toFixed(2)} km • ETA {selectedProvider.eta} min
            </div>
          )}
        </div>

        {/* BOTTOM PANEL */}
        <div className="p-4 bg-black space-y-3">

          <button
            onClick={compareRides}
            className="w-full bg-yellow-500 text-black py-3 rounded-xl font-bold"
          >
            Find Nearby Rides
          </button>

          {/* RIDE CARDS */}
          <div className="grid md:grid-cols-3 gap-2">
            {providers.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedProvider(p)}
                className={`p-3 rounded-xl border cursor-pointer ${
                  selectedProvider?.id === p.id
                    ? "border-yellow-400 bg-yellow-500/10"
                    : "border-gray-700 bg-gray-900"
                }`}
              >
                <h3 className="font-bold">
                  {p.name}
                  {bestProvider?.id === p.id && (
                    <span className="text-green-400 text-xs ml-2">★ Fastest</span>
                  )}
                </h3>
                <p className="text-xs text-gray-400">
                  ETA {p.eta} min • ₹{p.fare}
                </p>

                {/* OFFICIAL BOOK BUTTON */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(p.url, "_blank");
                  }}
                  className="mt-2 w-full bg-blue-600 hover:bg-blue-700 py-1 rounded text-sm font-bold"
                >
                  Book Official
                </button>
              </div>
            ))}
          </div>

          {/* CALL TAXIS */}
          <div className="grid grid-cols-2 gap-2">
            {callTaxis.map((c) => (
              <button
                key={c.name}
                onClick={() => window.open(`tel:${c.phone}`)}
                className="bg-green-600 hover:bg-green-700 py-2 rounded-lg text-sm font-bold"
              >
                📞 {c.name}
              </button>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}