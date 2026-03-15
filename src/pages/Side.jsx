import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Activity,
  UserCheck,
  Zap,
  MapPin,
  Eye,
  Phone,
  Globe,
  Mic,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useDestination } from "./DestinationContext";
import ThreatAlert from "../Component/ThreatAlert";
import FakeCall from "../Component/FakeCall";
import { ref, update, set, push } from "firebase/database"; // Added set, push
import { toast } from "sonner";
import { ENDPOINTS } from "../lib/api";
import { db } from "../firebaseConfig";

/* ================= SAFE DESTINATIONS ================= */
const SAFE_PLACES = {
  gandhipuram: true,
  "police station": true,
  "rs puram": true,
  "saibaba colony": true,
};

/* ================= USER EMERGENCY PROFILE ================= */
// Now handled via session storage or fetched from DB
const USER_PROFILE = {
  name: "User",
  age: 22,
  phone: "XXXXXXXXXX",
};

/* ================= TN POLICE WHATSAPP ================= */
// ⚠️ Replace ONLY if official number is provided
const TN_POLICE_WHATSAPP = "919994444444";

export function Side({ isOpen, onClose }) {
  /* ---------------- STATES ---------------- */
  const [buddyActive, setBuddyActive] = useState(false);
  const [acousticThreat, setAcousticThreat] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [soundLevel, setSoundLevel] = useState(0);
  const [threatDetected, setThreatDetected] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [showFakeCall, setShowFakeCall] = useState(false);
  const [heartbeatTime, setHeartbeatTime] = useState(30); // 30 seconds
  const [alertTimeout, setAlertTimeout] = useState(null); // Timer for 30s response
  const [batteryLevel, setBatteryLevel] = useState(100);

  /* ---------------- CONTEXT ---------------- */
  const { setAskDestination } = useDestination();

  /* ---------------- REFS ---------------- */
  const audioCtx = useRef(null);
  const analyser = useRef(null);
  const micStream = useRef(null);

  /* ---------------- TIMER ---------------- */
  useEffect(() => {
    if (!buddyActive) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);

    // Metadata Sync (Location/Status/Time)
    const syncMetadata = async () => {
      try {
        const battery = await navigator.getBattery?.();
        const level = battery ? Math.round(battery.level * 100) : 100;
        setBatteryLevel(level);

        const name = localStorage.getItem("currentUserName") || "Traveler";
        const username = name.replace(/\s/g, "_");

        navigator.geolocation.getCurrentPosition(async (pos) => { // Added async here
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const now = new Date();
          const timeStr = now.toLocaleTimeString();
          const dateStr = now.toLocaleDateString();

          const trackingData = {
            latitude: lat,
            longitude: lng,
            battery: level,
            lastActive: Date.now(),
            currentTime: timeStr,
            currentDate: dateStr,
            status: threatDetected ? "‼️ EMERGENCY THREAT ‼️" : "Active Tracking",
            soundSens: soundLevel > 30 ? "High Noise" : "Normal",
            threatActive: threatDetected
          };

          // 1. Sync to Firebase (Real-time)
          await set(ref(db, `live_tracking/${username}`), trackingData);

          // 2. Sync to Spring Boot (Persistence)
          try {
            await fetch(ENDPOINTS.TRACKING.SYNC(username), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                latitude: lat,
                longitude: lng,
                status: threatDetected ? "EMERGENCY" : "LIVE" // Adjusted status for backend
              })
            });
          } catch (e) {
            console.error("Backend sync failed", e);
            toast.error("Failed to sync live tracking to backend.");
          }
        });
      } catch (e) { console.error("Sync Error:", e); }
    };

    // 15s History Sync (only during threat)
    const syncHistory = () => {
      if (!threatDetected) return;

      navigator.geolocation.getCurrentPosition(async (pos) => {
        const name = localStorage.getItem("currentUserName") || "Traveler";
        const username = name.replace(/\s/g, "_");
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const now = new Date();

        const historyPoint = {
          latitude: lat,
          longitude: lng,
          time: now.toLocaleTimeString(),
          date: now.toLocaleDateString(),
          username: name
        };

        // 1. Sync to Firebase
        await push(ref(db, `threat_history/${username}`), historyPoint);

        // 2. Sync to Spring Boot
        try {
          await fetch(ENDPOINTS.TRACKING.SYNC(username), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              latitude: lat,
              longitude: lng,
              status: "HISTORY"
            })
          });
        } catch (e) {
          console.error("History backend sync failed", e);
        }
      });
    };

    const syncInterval = setInterval(syncMetadata, 10000); // 10s Tracking
    const historyInterval = setInterval(syncHistory, 15000); // 15s Path Marking

    syncMetadata();

    return () => {
      clearInterval(t);
      clearInterval(syncInterval);
      clearInterval(historyInterval);
    };
  }, [buddyActive, soundLevel, threatDetected, db]);

  /* ---------------- FOCUS HEARTBEAT ---------------- */
  useEffect(() => {
    if (!focusMode) {
      setHeartbeatTime(120);
      return;
    }

    const h = setInterval(() => {
      setHeartbeatTime((prev) => {
        if (prev <= 0) {
          setShowAlert(true); // Escalate to threat if heartbeat missed
          return 120;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(h);
  }, [focusMode]);

  /* ---------------- SPEAK (TAMIL + ENGLISH) ---------------- */
  const speak = useCallback((msgTa, msgEn) => {
    if (!audioUnlocked) return;

    const voices = window.speechSynthesis.getVoices();
    const tamilVoice = voices.find((v) => v.lang === "ta-IN");
    const englishVoice = voices.find((v) => v.lang === "en-IN");

    const tamilMsg = new SpeechSynthesisUtterance(msgTa);
    tamilMsg.lang = "ta-IN";
    tamilMsg.voice = tamilVoice || null;
    tamilMsg.rate = 0.9;

    const englishMsg = new SpeechSynthesisUtterance(msgEn);
    englishMsg.lang = "en-IN";
    englishMsg.voice = englishVoice || null;
    englishMsg.rate = 0.95;

    window.speechSynthesis.speak(tamilMsg);
    window.speechSynthesis.speak(englishMsg);
  }, [audioUnlocked]);

  /* ---------------- AUDIO UNLOCK ---------------- */
  const unlockAudio = () => {
    speak("குரல் இயக்கப்பட்டது", "Voice enabled");
    setAudioUnlocked(true);
  };

  /* ---------------- STOP MIC ---------------- */
  const stopMic = () => {
    audioCtx.current?.close();
    micStream.current?.getTracks().forEach((t) => t.stop());
  };

  /* ---------------- DESTINATION FLOW ---------------- */
  const askForDestination = () => {
    speak(
      "தயவுசெய்து உங்கள் இலக்கை கூறுங்கள்",
      "Please state your destination"
    );
    setAskDestination(true);
  };

  /* ================= EMERGENCY WHATSAPP SHARE ================= */
  const shareWithTamilNaduPolice = async () => {
    const name = localStorage.getItem("currentUserName") || "User";
    const username = localStorage.getItem("currentUserName");

    let savedContacts = [];
    if (username) {
      try {
        const res = await fetch(ENDPOINTS.CONTACTS(username));
        if (res.ok) savedContacts = await res.json();
      } catch (e) { console.error("Contact fetch failed", e); }
    }

    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      const locationLink = `https://maps.google.com/?q=${latitude},${longitude}`;

      const message = `
🚨 EMERGENCY ALERT 🚨

👤 Name: ${name}
📍 Live Location:
${locationLink}

⚠️ Threat detected. Immediate help required.
      `.trim();

      // Notify Police
      const policeUrl = `https://wa.me/${TN_POLICE_WHATSAPP}?text=${encodeURIComponent(message)}`;
      window.open(policeUrl, "_blank");

      // Notify Guardians
      savedContacts.forEach((contact) => {
        const guardianUrl = `sms:${contact.phone}?body=${encodeURIComponent(message)}`;
        setTimeout(() => window.open(guardianUrl, "_blank"), 1000);
      });
    });
  };

  /* ---------------- ACOUSTIC MONITOR ---------------- */
  useEffect(() => {
    if (!acousticThreat || !audioUnlocked) return;

    const startMic = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      micStream.current = stream;

      audioCtx.current = new AudioContext();
      analyser.current = audioCtx.current.createAnalyser();
      analyser.current.fftSize = 256;

      const src =
        audioCtx.current.createMediaStreamSource(stream);
      src.connect(analyser.current);

      const data = new Uint8Array(
        analyser.current.frequencyBinCount
      );

      const monitor = () => {
        analyser.current.getByteFrequencyData(data);
        const avg =
          data.reduce((a, b) => a + b, 0) / data.length;

        setSoundLevel(Math.round(avg));

        if (avg > 50 && !threatDetected && !showAlert) {
          setShowAlert(true);
          stopMic();

          speak(
            "ஆபத்து கண்டறியப்பட்டது. தயவுசெய்து உங்கள் பாதுகாப்பை உறுதிப்படுத்தவும்",
            "Potential threat detected. Please confirm your safety."
          );

          // 30-second auto-escalation timer
          const timer = setTimeout(() => {
            handleEmergency();
            toast.error("AI Agent: No response detected. Escalating to emergency contacts.");
          }, 30000);
          setAlertTimeout(timer);
          return;
        }

        requestAnimationFrame(monitor);
      };

      monitor();
    };

    startMic();
    return stopMic;
  }, [acousticThreat, audioUnlocked, threatDetected, showAlert, speak]);


  useEffect(() => {
    if (threatDetected) {
      shareWithTamilNaduPolice();
    }
  }, [threatDetected]);

  const handleSafe = useCallback(() => {
    setShowAlert(false);
    setAcousticThreat(false);
    if (alertTimeout) clearTimeout(alertTimeout);
    setAlertTimeout(null);
    speak("நீங்கள் பாதுகாப்பாக இருந்ததற்கு மகிழ்ச்சி", "Glad to hear you are safe. Stay alert.");
  }, [speak, alertTimeout]);

  const handleEmergency = useCallback(() => {
    setShowAlert(false);
    setThreatDetected(true);
    setBuddyActive(true);
    if (alertTimeout) clearTimeout(alertTimeout);
    setAlertTimeout(null);
    speak(
      "உறவினர்களுக்கு தகவல் அனுப்பப்படுகிறது",
      "Emergency protocol activated. Notifying your guardians."
    );
  }, [speak, alertTimeout]);

  /* ---------------- UI ---------------- */
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed left-0 top-20 bottom-0 w-80 bg-gradient-to-b from-slate-900 to-black
             z-[700] p-6 border-r border-white/10 overflow-y-auto
             rounded-tr-2xl rounded-br-2xl"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
          >
            {showAlert && (
              <ThreatAlert
                onSafe={handleSafe}
                onEmergency={handleEmergency}
              />
            )}

            {!audioUnlocked && (
              <button
                onClick={unlockAudio}
                className="w-full mb-4 py-2 bg-green-600 rounded-xl text-white font-bold"
              >
                Enable Voice
              </button>
            )}

            <div className="flex items-center gap-3 mb-6">
              <Shield className="h-7 w-7 text-green-400" />
              <div>
                <h2 className="text-xl font-black text-white">
                  GUARD CENTRAL
                </h2>
                <p className="text-xs text-gray-400">
                  Session {seconds}s active
                </p>
              </div>
            </div>

            <Section title="Virtual Companion">
              <Item
                icon={<UserCheck size={20} />}
                label="Launch Smart Fake Call"
                active={buddyActive}
                onToggle={() => {
                  setBuddyActive(!buddyActive);
                  if (!buddyActive) setShowFakeCall(true);
                }}
              />
            </Section>

            <Section title="AI Sentinel">
              <Feature
                icon={Activity}
                title={`Acoustic Monitor (${soundLevel})`}
                active={acousticThreat}
                onClick={() => setAcousticThreat((v) => !v)}
              />
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                   window.dispatchEvent(new CustomEvent('open-ai-chat'));
                }}
                className="w-full mt-3 p-3 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 flex items-center justify-between group hover:bg-indigo-500/20 transition-all"
              >
                 <div className="flex items-center gap-3">
                   <Shield className="text-indigo-400 group-hover:scale-110 transition-transform" size={20} />
                   <span className="text-sm font-bold text-white">Consult Safety AI</span>
                 </div>
                 <Zap className="text-yellow-400 animate-pulse" size={16} />
              </motion.button>
            </Section>

            <Section title="FOCUS">
              <Item
                icon={<Eye size={20} />}
                label="Focus Mode"
                active={focusMode}
                onToggle={() => setFocusMode(!focusMode)}
              />
              {focusMode && (
                <div className="mt-3 p-3 bg-red-500/5 border border-red-500/20 rounded-2xl">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-tighter">Heartbeat check-in</span>
                    <span className="text-[10px] font-mono text-white bg-red-500 px-1.5 rounded">{heartbeatTime}s</span>
                  </div>
                  <button
                    onClick={() => setHeartbeatTime(30)}
                    className="w-full py-1.5 bg-red-500/20 hover:bg-red-500/30 text-white text-[10px] font-bold rounded-lg transition-colors"
                  >
                    TAP TO ACKNOWLEDGE SAFETY
                  </button>
                </div>
              )}
            </Section>


            <Section title="Quick Safe Routes">
              {Object.keys(SAFE_PLACES).map((place) => (
                <button
                  key={place}
                  onClick={askForDestination}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm"
                >
                  <MapPin className="h-4 w-4 text-green-400" />
                  {place}
                </button>
              ))}
            </Section>

            {threatDetected && (
              <div className="mt-4 p-4 rounded-2xl bg-red-500/10 border border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                <div className="flex items-center gap-2 text-red-500 mb-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-widest">Threat Detected</span>
                </div>
                <p className="text-[10px] text-white/80 font-bold leading-tight uppercase">
                  Emergency shared with contacts <br />
                  <span className="text-red-400 mt-1 block">
                    {new Date().toLocaleDateString()} — {new Date().toLocaleTimeString()}
                  </span>
                </p>
              </div>
            )}
          </motion.div>

          {/* STEALTH UI OVERLAY (FOCUS MODE) */}
          <AnimatePresence>
            {focusMode && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-red-950 pointer-events-none z-[600]"
              />
            )}
          </AnimatePresence>

          {/* FAKE CALL SYSTEM */}
          <AnimatePresence>
            {showFakeCall && (
              <FakeCall onEnd={() => setShowFakeCall(false)} />
            )}
          </AnimatePresence>

        </>
      )}
    </AnimatePresence >
  );
}

/* ---------------- HELPERS ---------------- */

function Section({ title, children }) {
  return (
    <div className="space-y-3 mb-5">
      <div className="flex justify-between">
        <h3 className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">{title}</h3>
        <Badge variant="outline" className="text-[8px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">LIVE</Badge>
      </div>
      {children}
    </div>
  );
}

function Item({ icon, label, active, onToggle }) {
  return (
    <div
      onClick={onToggle}
      className={`flex justify-between items-center p-3 rounded-2xl border transition-all cursor-pointer ${active ? "bg-white/5 border-white/20 shadow-lg" : "border-white/5 hover:bg-white/5"
        }`}
    >
      <div className="flex gap-3 items-center pointer-events-none">
        <div className={`${active ? "text-white" : "text-slate-500"}`}>
          {icon}
        </div>
        <span className={`text-sm font-bold ${active ? "text-white" : "text-slate-400"}`}>
          {label}
        </span>
      </div>
      <Switch checked={active} onCheckedChange={onToggle} className="pointer-events-none" />
    </div>
  );
}

function Feature({ icon: Icon, title, active, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer flex justify-between items-center p-3 rounded-2xl border transition-all ${active ? "bg-green-500/10 border-green-500/50 shadow-lg shadow-green-500/10" : "border-white/5 hover:bg-white/5"
        }`}
    >
      <div className="flex gap-3 items-center pointer-events-none">
        <Icon className={active ? "text-green-400" : "text-slate-500"} size={20} />
        <span className={`text-sm font-bold ${active ? "text-white" : "text-slate-400"}`}>
          {title}
        </span>
      </div>
      <Zap className={active ? "text-green-500 animate-pulse" : "opacity-20 text-slate-500"} size={18} />
    </div>
  );
}
