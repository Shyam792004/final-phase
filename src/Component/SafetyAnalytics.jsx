import { Route, Clock, AlertTriangle, Shield, Activity } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function SafetyAnalytics({ selectedCity }) {
  const [analytics, setAnalytics] = useState({
    totalDistance: "—",
    travelTime: "—",
    dangerZones: 1,
    safetyIncidents: 0,
    riskEvents: [],
    riskScore: 20,
  });

  // ===== INITIAL DATA =====
  useEffect(() => {
    if (!selectedCity) return;

    setAnalytics({
      totalDistance: `${(Math.random() * 10 + 3).toFixed(1)} km`,
      travelTime: `${Math.floor(Math.random() * 30 + 5)} MIN`,
      dangerZones: Math.floor(Math.random() * 4) + 1,
      safetyIncidents: Math.floor(Math.random() * 2),
      riskEvents: [
        {
          description: "AI system initialized",
          time: new Date().toLocaleTimeString(),
          risk: "Monitoring Started",
          color: "green",
        },
      ],
      riskScore: 25,
    });
  }, [selectedCity]);

  // ===== REALTIME ENGINE =====
  useEffect(() => {
    if (!selectedCity) return;

    const interval = setInterval(() => {
      setAnalytics((prev) => {
        const danger = Math.max(
          0,
          prev.dangerZones + Math.floor(Math.random() * 3 - 1)
        );

        const incidents = Math.max(
          0,
          prev.safetyIncidents + Math.floor(Math.random() * 2 - 1)
        );

        // AI-style risk calculation
        const riskScore = Math.min(
          100,
          Math.max(
            0,
            danger * 15 +
              incidents * 20 +
              Math.floor(Math.random() * 20)
          )
        );

        const riskLevel =
          riskScore > 70
            ? { label: "High Risk", color: "red" }
            : riskScore > 40
            ? { label: "Medium Risk", color: "yellow" }
            : { label: "Safe Zone", color: "green" };

        const newEvent = {
          description: "AI detected environmental variation",
          time: new Date().toLocaleTimeString(),
          risk: riskLevel.label,
          color: riskLevel.color,
        };

        return {
          ...prev,
          dangerZones: danger,
          safetyIncidents: incidents,
          riskScore,
          riskEvents: [newEvent, ...prev.riskEvents.slice(0, 5)],
        };
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [selectedCity]);

  const riskColor = useMemo(() => {
    if (analytics.riskScore > 70) return "bg-red-500";
    if (analytics.riskScore > 40) return "bg-yellow-500";
    return "bg-green-500";
  }, [analytics.riskScore]);

  const getRiskDot = (color) => {
    if (color === "green") return "bg-green-500";
    if (color === "yellow") return "bg-yellow-500";
    if (color === "red") return "bg-red-500";
    return "bg-slate-400";
  };

  return (
    <div className="mt-8">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">

        {/* HEADER */}
        <h3 className="text-xl font-bold text-white mb-6">
          Live Safety Analytics Dashboard
        </h3>

        {/* TOP METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              icon: <Route className="text-green-400 w-7 h-7" />,
              label: "Distance",
              value: analytics.totalDistance,
            },
            {
              icon: <Clock className="text-blue-400 w-7 h-7" />,
              label: "Travel Time",
              value: analytics.travelTime,
            },
            {
              icon: <AlertTriangle className="text-yellow-400 w-7 h-7" />,
              label: "Danger Zones",
              value: analytics.dangerZones,
            },
            {
              icon: <Shield className="text-emerald-400 w-7 h-7" />,
              label: "Incidents",
              value: analytics.safetyIncidents,
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-slate-800 rounded-xl p-4 text-center hover:scale-105 transition"
            >
              <div className="mb-3 flex justify-center">{item.icon}</div>
              <p className="text-2xl font-bold text-white">{item.value}</p>
              <p className="text-sm text-slate-400">{item.label}</p>
            </div>
          ))}
        </div>

        {/* RISK METER */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <p className="text-white font-medium flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              AI Risk Score
            </p>
            <span className="text-sm text-slate-300">
              {analytics.riskScore}%
            </span>
          </div>

          <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
            <div
              className={`${riskColor} h-3 transition-all duration-700`}
              style={{ width: `${analytics.riskScore}%` }}
            />
          </div>
        </div>

        {/* LIVE EVENT STREAM */}
        <div className="bg-slate-800 rounded-xl p-4">
          <h4 className="text-white font-semibold mb-4">
            Live AI Risk Timeline —{" "}
            <span className="text-indigo-400">
              {selectedCity || "Select Area"}
            </span>
          </h4>

          <div className="space-y-3 max-h-72 overflow-y-auto">
            {analytics.riskEvents.map((event, index) => (
              <div
                key={index}
                className="flex items-center gap-3 border-b border-slate-700 pb-2"
              >
                <div
                  className={`w-3 h-3 rounded-full ${getRiskDot(
                    event.color
                  )}`}
                />
                <div className="flex-1">
                  <p className="text-sm text-slate-200">
                    {event.description}
                  </p>
                  <p className="text-xs text-slate-400">{event.risk}</p>
                </div>
                <span className="text-xs text-slate-500">
                  {event.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}