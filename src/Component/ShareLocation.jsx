import { useEffect, useRef, useState } from "react";
import {
  EyeOff,
  Radar,
  Activity,
  Timer,
  Camera,
  ShieldAlert,
} from "lucide-react";

export default function ShareLocation() {

  const [active, setActive] = useState(false);
  const [coords, setCoords] = useState(null);
  const [status, setStatus] = useState("Inactive");

  const watchRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [elapsed, setElapsed] = useState(0);
  const lastCoordsRef = useRef(null);

  const [movement, setMovement] = useState("Unknown");
  const [risk, setRisk] = useState("Low");
  const [capturedImage, setCapturedImage] = useState(null);

  const [timeline, setTimeline] = useState([]);
  const emergencySentRef = useRef(false);

  // NEW
  const [flash, setFlash] = useState(false);
  const capturingRef = useRef(false);

  const emergencyNumbers = [
    "6374627679",
    "9384750414",
    "6380368540",
  ];

  const policeWhatsApp = "919999999999"; // replace

  const addTimeline = (msg) => {
    setTimeline((prev) => [
      { id: Date.now(), msg },
      ...prev.slice(0, 20),
    ]);
  };

  /* ================= STATUS COLOR LOADER ================= */
  const getStatusColor = () => {
    if (movement === "Standing" && elapsed > 120)
      return {
        color: "bg-red-500",
        width: "100%",
        label: "High Risk - Standing too long",
      };

    if (movement === "Standing" && elapsed > 40)
      return {
        color: "bg-yellow-400",
        width: "65%",
        label: "Warning - Standing",
      };

    return {
      color: "bg-green-500",
      width: "35%",
      label: "Stable Movement",
    };
  };

  const statusLoader = getStatusColor();

  /* ================= ACTIVATE ================= */
  const activateMode = () => {
    setActive(true);
    setStatus("Monitoring surroundings");
    addTimeline("Monitoring started");

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) =>
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      console.error,
      { enableHighAccuracy: true }
    );
  };

  /* ================= DEACTIVATE ================= */
  const deactivateMode = () => {
    setActive(false);
    setStatus("Inactive");
    setElapsed(0);
    setRisk("Low");
    setTimeline([]);
    setCapturedImage(null);
    emergencySentRef.current = false;

    if (watchRef.current)
      navigator.geolocation.clearWatch(watchRef.current);
  };

  /* ================= TIMER ================= */
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [active]);

  /* ================= GROUP SMS ================= */
  const sendEmergencySMS = () => {
    if (!coords) return;

    const mapLink = `https://maps.google.com/?q=${coords.lat},${coords.lng}`;

    const message = `
⚠️ NIGHTSAFE ALERT

The person is currently in an unsafe location.

Live Tracking:
${mapLink}
    `.trim();

    const recipients = emergencyNumbers.join(",");

    window.open(
      `sms:${recipients}?body=${encodeURIComponent(message)}`
    );
  };

  /* ================= POLICE ALERT ================= */
  const sendPoliceAlert = () => {
    if (!coords) return;

    const mapLink = `https://maps.google.com/?q=${coords.lat},${coords.lng}`;

    const msg = `
🚨 NIGHTSAFE ALERT 🚨

Possible unsafe situation detected.

Live Location:
${mapLink}

Evidence image captured.
    `.trim();

    window.open(
      `https://wa.me/${policeWhatsApp}?text=${encodeURIComponent(msg)}`,
      "_blank"
    );
  };

  /* ================= CAPTURE EVIDENCE ================= */
  const dropEvidence = async (auto = false) => {
    if (capturingRef.current) return;

    try {
      capturingRef.current = true;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });

      const video = videoRef.current;
      video.srcObject = stream;

      await new Promise((res) => {
        video.onloadedmetadata = () => {
          video.play();
          res();
        };
      });

      await new Promise((r) => setTimeout(r, 600));

      // FLASH
      setFlash(true);
      setTimeout(() => setFlash(false), 200);

      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      canvas.getContext("2d").drawImage(video, 0, 0);

      const img = canvas.toDataURL("image/jpeg");
      setCapturedImage(img);

      addTimeline(
        auto
          ? "AUTO emergency evidence captured"
          : "Manual evidence captured"
      );

      sendPoliceAlert();

      stream.getTracks().forEach((t) => t.stop());
    } catch (err) {
      console.error(err);
      addTimeline("Camera capture failed");
    } finally {
      capturingRef.current = false;
    }
  };

  /* ================= MOVEMENT ENGINE ================= */
  useEffect(() => {
    if (!coords || !active) return;

    if (lastCoordsRef.current) {
      const dx = coords.lat - lastCoordsRef.current.lat;
      const dy = coords.lng - lastCoordsRef.current.lng;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 0.00001) {
        if (movement !== "Standing")
          addTimeline("Standing detected");
        setMovement("Standing");
      } else if (dist < 0.00008) {
        if (movement !== "Walking")
          addTimeline("Walking detected");
        setMovement("Walking");
      } else {
        if (movement !== "Erratic")
          addTimeline("Erratic movement detected");
        setMovement("Erratic");
      }
    }

    if (elapsed > 60 && risk === "Low") {
      setRisk("Medium");
      addTimeline("Risk escalated to MEDIUM");
    }

    if (elapsed > 120 && risk !== "High") {
      setRisk("High");
      setStatus("⚠ HIGH RISK DETECTED");
      addTimeline("Risk escalated to HIGH");

      if (!emergencySentRef.current) {
        emergencySentRef.current = true;
        addTimeline("Emergency SMS prepared");
        sendEmergencySMS();
      }

      // AUTO CAPTURE ON HIGH RISK
      dropEvidence(true);
    }

    lastCoordsRef.current = coords;
  }, [coords, elapsed, active]);

  return (
    <div className="w-full min-h-screen bg-black flex justify-center p-6">

      {/* FLASH */}
      {flash && (
        <div className="fixed inset-0 bg-white z-50 animate-pulse pointer-events-none" />
      )}

      <div className="w-full max-w-4xl bg-zinc-950 border border-red-500/30 rounded-3xl p-8 text-white">

        <div className="flex items-center gap-3 mb-5">
          <EyeOff className="text-red-400" />
          <h2 className="text-2xl font-bold">
            NightSafe Smart Monitor
          </h2>
        </div>

        <p className="text-red-400 mb-4">{status}</p>

        {active && (
          <div className="grid md:grid-cols-3 gap-3 mb-5">
            <Info icon={Activity} label={`Movement: ${movement}`} />
            <Info icon={Radar} label={`Risk: ${risk}`} />
            <Info icon={Timer} label={`Time: ${elapsed}s`} />
          </div>
        )}

        <button
          onClick={active ? deactivateMode : activateMode}
          className="w-full py-3 rounded-xl bg-red-600 font-bold mb-4"
        >
          {active ? "Deactivate Safely" : "Activate Silently"}
        </button>

        {active && (
          <div className="mb-5">
            <p className="text-xs mb-2 text-gray-300">
              Movement Status: {statusLoader.label}
            </p>

            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`${statusLoader.color} h-3 rounded-full transition-all duration-700`}
                style={{ width: statusLoader.width }}
              />
            </div>
          </div>
        )}

        {active && (
          <div className="mb-5">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-red-400" />
              Live Safety Timeline
            </h3>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {timeline.map((t) => (
                <div key={t.id} className="bg-white/5 p-2 rounded text-sm">
                  • {t.msg}
                </div>
              ))}
            </div>
          </div>
        )}

        {active && !capturedImage && (
          <button
            onClick={() => dropEvidence(false)}
            className="w-full py-3 rounded-xl bg-white/10 flex justify-center gap-2"
          >
            <Camera className="h-4 w-4" />
            Capture Evidence
          </button>
        )}

        {capturedImage && (
          <img
            src={capturedImage}
            className="rounded-xl border border-red-500/40 mt-4"
            alt="Evidence"
          />
        )}
      </div>

      <video ref={videoRef} className="hidden" />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

function Info({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5">
      <Icon className="h-4 w-4 text-red-400" />
      <span>{label}</span>
    </div>
  );
}