import { AlertTriangle, CheckCircle, Bell, Share, Settings } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { useState } from "react";
import {Phone,MessageCircle,MapPin} from "lucide-react"
// import { useToast } from "@/hooks/use-toast";

export default function SafetyAlerts() {
//   const { toast } = useToast();

const [guardians, setGuardians] = useState([
    {
      id: 1,
      name: "Mom",
      role: "Primary Guardian",
      status: "Online",
      notified: true,
      locationShared: false,
      image: "female.png",
    },
    {
      id: 2,
      name: "Dad",
      role: "Secondary Guardian",
      status: "Offline",
      notified: false,
      locationShared: false,
      image: "son.png",
    },
    {
      id: 3,
      name: "Son",
      role: "User",
      status: "Online",
      notified: false,
      locationShared: true,
      image: "son.png",
    },
  ]);

  // Toggle notification or location sharing
  const toggleGuardianStatus = (id, key) => {
    setGuardians((prev) =>
      prev.map((g) =>
        g.id === id ? { ...g, [key]: !g[key] } : g
      )
    );
  };

  const getStatusColor = (status) =>
    status === "Online" ? "bg-green-500" : "bg-red-500";

const handleNotifyGuardians = () => {
  toast.info("All active guardians have been notified of your current status and location.", {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  });
};

const handleShareLocation = () => {
  navigator.clipboard.writeText(`Current Location: Downtown Transit Hub\nSafety Status: Normal\nTracking Link: https://safetravel.ai/track/abc123`);
  toast.success("Location details copied to clipboard!", {
    position: "top-right",
    autoClose: 3000,
  });
};

const handleEmergencySOS = () => {
  toast.error("Emergency SOS Activated! Location sent to contacts and emergency services.", {
    position: "top-right",
    autoClose: 4000,
  });
};


  return (
    <div className="space-y-6" data-testid="safety-alerts">
      {/* Real-time Alerts */}
    



      <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="colored"  // gives attractive colored toast
    />
    </div>
  );
}