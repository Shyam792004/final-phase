import { AlertTriangle, Phone } from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Feather } from 'lucide-react';

export default function EmergencySOSBar() {
  const handleSOS = () => {
    toast.error("🚨 Calling emergency control room...", {
      position: "bottom-right",
      autoClose: 3000,
    });
  };

  return (
    <div className="bg-red-600 py-2" data-testid="emergency-sos-bar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="text-white w-4 h-4" />
            <span className="text-sm font-medium text-white">
              Emergency SOS Always Available
            </span>
          </div>

          {/* Wrap button with tel: link */}
          <a href="tel:112" onClick={handleSOS} data-testid="sos-button-header">
            <button
              className="bg-white text-red-600 px-4 py-1 rounded-full text-sm font-semibold hover:bg-slate-100 transition-colors"
            >
              <Feather className="w-3 h-5 mr-1 inline" />
              New Update
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}
