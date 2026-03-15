import { useEffect, useMemo, useState } from "react";
import AppHeader from "../Component/AppHeader";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

/* =====================================
   FLOW OMEGA — ELITE SAFETY INTELLIGENCE
   Ultra Advanced Single File Dashboard
===================================== */

const CENTER = [12.9352, 80.2295];
const POINTS = 90;

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function generatePoints(prev = []) {
  return Array.from({ length: POINTS }).map((_, i) => {
    const old = prev[i];

    const lat = old
      ? old.position[0] + rand(-0.002, 0.002)
      : CENTER[0] + rand(-0.02, 0.02);

    const lng = old
      ? old.position[1] + rand(-0.002, 0.002)
      : CENTER[1] + rand(-0.02, 0.02);

    const intensity = Math.random();
    const speed = rand(0.5, 3.5);
    const direction = rand(0, 360);

    return {
      position: [lat, lng],
      prevPosition: old?.position || [lat, lng],
      intensity,
      speed,
      direction,
    };
  });
}

export default function Flow() {
  const [points, setPoints] = useState([]);
  const [riskZones, setRiskZones] = useState(0);
  const [velocity, setVelocity] = useState("MEDIUM");
  const [threat, setThreat] = useState("STABLE");
  const [uptime, setUptime] = useState(0);

  /* ===== REALTIME ENGINE ===== */
  useEffect(() => {
    const tick = () => {
      setPoints((prev) => {
        const next = generatePoints(prev);

        const risk = next.filter((p) => p.intensity > 0.75).length;
        setRiskZones(risk);

        const avg =
          next.reduce((a, b) => a + b.speed, 0) / next.length;

        if (avg > 2.2) {
          setVelocity("HIGH");
          setThreat("ELEVATED");
        } else if (avg > 1.3) {
          setVelocity("MEDIUM");
          setThreat("STABLE");
        } else {
          setVelocity("LOW");
          setThreat("CALM");
        }

        return next;
      });

      setUptime((u) => u + 1);
    };

    tick();
    const id = setInterval(tick, 1100);
    return () => clearInterval(id);
  }, []);

  /* ===== METRICS ===== */
  const activeMovement = useMemo(
    () => points.length * 12 + Math.floor(Math.random() * 100),
    [points]
  );

  const isolationAlerts = useMemo(
    () => Math.floor(riskZones / 6),
    [riskZones]
  );

  const anomalyScore = useMemo(
    () => Math.min(100, Math.floor((riskZones / POINTS) * 120)),
    [riskZones]
  );

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden relative">
      <AppHeader />

      <div className="flex-1 relative z-10 p-6 overflow-y-auto">

        {/* DASHBOARD CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            ["Movement", activeMovement, "text-cyan-400"],
            ["Risk Zones", riskZones, "text-red-400"],
            ["Isolation", isolationAlerts, "text-orange-400"],
            ["Velocity", velocity, "text-green-400"],
            ["Threat", threat, "text-pink-400"],
          ].map((m, i) => (
            <div
              key={i}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl hover:scale-105 transition"
            >
              <p className="text-slate-400 text-sm">{m[0]}</p>
              <h2 className={`text-2xl font-bold ${m[2]}`}>{m[1]}</h2>
            </div>
          ))}
        </div>

        {/* AI STATUS BAR */}
        <div className="mb-4 bg-white/5 border border-white/10 rounded-xl p-3">
          <div className="flex justify-between text-sm text-slate-300 mb-1">
            <span>AI Anomaly Detection</span>
            <span>{anomalyScore}%</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-red-500 transition-all duration-700"
              style={{ width: `${anomalyScore}%` }}
            />
          </div>
        </div>

        {/* MAP */}
        <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
          <MapContainer center={CENTER} zoom={14} className="h-[75vh] w-full">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {points.map((p, i) => {
              const angle = (p.direction * Math.PI) / 180;

              const flowEnd = [
                p.position[0] + Math.sin(angle) * 0.003,
                p.position[1] + Math.cos(angle) * 0.003,
              ];

              const color =
                p.intensity > 0.75
                  ? "#ff3b30"
                  : p.intensity > 0.45
                    ? "#ff9f0a"
                    : "#32d74b";

              return (
                <div key={i}>
                  {/* TRAIL MEMORY */}
                  <Polyline
                    positions={[p.prevPosition, p.position]}
                    pathOptions={{
                      color: "#60a5fa",
                      weight: 1,
                      opacity: 0.25,
                    }}
                  />

                  {/* FLOW VECTOR */}
                  <Polyline
                    positions={[p.position, flowEnd]}
                    pathOptions={{
                      color: "#38bdf8",
                      weight: 1 + p.speed,
                      opacity: 0.9,
                    }}
                  />

                  {/* RISK BUBBLE */}
                  <CircleMarker
                    center={p.position}
                    radius={6 + p.intensity * 14}
                    pathOptions={{
                      color,
                      fillColor: color,
                      fillOpacity: 0.65,
                      weight: 2,
                    }}
                  />
                </div>
              );
            })}
          </MapContainer>
        </div>

        {/* FOOTER */}
        <div className="mt-4 text-sm text-slate-400 flex justify-between">
          <span>FLOW OMEGA • Vector Intelligence Engine</span>
          <span>System Uptime: {uptime}s</span>
        </div>
      </div>
    </div>
  );
}