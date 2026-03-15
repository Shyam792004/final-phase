import React from "react";
import SafetyAlerts from "./SafetyAlerts";
import SafetyAnalytics from "./SafetyAnalytics";
import TechnicalSpecs from "./AdvancedSafetyMap";
import TravelStatusOverview from "./TravelStatusOverview";
import FloatingSOSButton from "./FloatingSOSButton";
import { useState } from "react";
import AppHeader from "./AppHeader";
import EmergencySOSBar from "./EmergencySOSBar";
import { Side } from "../pages/Side";
import { Shield, PhoneCall, Mail, MapPin, Github, Linkedin, ChevronRight, ChevronLeft } from "lucide-react";

const Home = () => {
  const [selectedCity, setSelectedCity] = useState("");
  const [showSide, setShowSide] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 overflow-hidden">
      <AppHeader />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Safety Side Panel */}
        <Side isOpen={showSide} onClose={() => setShowSide(false)} />

        {/* Main Content Area */}
        <div className={`flex-1 overflow-y-auto transition-all duration-300 ${showSide ? "ml-80" : "ml-0"}`}>

          {/* Toggle Button for Side Panel */}
          <button
            onClick={() => setShowSide(!showSide)}
            className={`fixed left-2 top-24 z-[800] p-2 bg-indigo-600 rounded-full shadow-lg hover:bg-indigo-500 transition-all ${showSide ? "left-[310px]" : "left-2"}`}
            title={showSide ? "Close Safety Panel" : "Open Safety Panel"}
          >
            {showSide ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>

          <FloatingSOSButton />
          <EmergencySOSBar />
          <br></br>
          <div className="px-6">
            <TravelStatusOverview onSelect={setSelectedCity} />
            <SafetyAnalytics selectedCity={selectedCity} />
            <TechnicalSpecs />
            <br></br>
            <SafetyAlerts />
          </div>


          <footer className="bg-gradient-to-r from-indigo-800 via-indigo-900 to-purple-900 text-gray-200 py-8 px-6 shadow-inner border-t border-white/10">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-start">

              {/* Brand Section */}
              <div className="flex flex-col items-start space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/10 p-2 rounded-full border border-white/20">
                    <Shield size={26} className="text-yellow-300" />
                  </div>
                  <h2 className="text-xl font-semibold text-white tracking-wide">NightSafe</h2>
                </div>
                <p className="text-sm text-gray-400">
                  Empowering communities with safety insights and live location alerts.
                  Stay safe, stay informed.
                </p>
              </div>

              {/* Quick Links */}
              <div className="flex flex-col space-y-2">
                <h3 className="text-lg font-semibold text-yellow-300 mb-2">Quick Links</h3>
                <a href="/" className="hover:text-yellow-400 transition-colors duration-200">Home</a>
                <a href="/FamilyLogin" className="hover:text-yellow-400 transition-colors duration-200">Member Login</a>
                <a href="/famsign" className="hover:text-yellow-400 transition-colors duration-200">Create Account</a>
                <a href="/NightSafeMap" className="hover:text-yellow-400 transition-colors duration-200">Map</a>
              </div>

              {/* Contact & Socials */}
              <div className="flex flex-col space-y-3">
                <h3 className="text-lg font-semibold text-yellow-300 mb-2">Contact Us</h3>
                <div className="flex items-center gap-2">
                  <PhoneCall size={18} />
                  <span className="text-sm">+91 94981 11191</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={18} />
                  <span className="text-sm">support@nightsafe.in</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={18} />
                  <span className="text-sm">Coimbatore, Tamil Nadu</span>
                </div>

                {/* Social Icons */}
                <div className="flex items-center space-x-4 pt-2">
                  <a href="https://github.com" target="_blank" className="hover:text-yellow-400 transition-transform transform hover:scale-110">
                    <Github size={22} />
                  </a>
                  <a href="https://linkedin.com" target="_blank" className="hover:text-yellow-400 transition-transform transform hover:scale-110">
                    <Linkedin size={22} />
                  </a>
                </div>
              </div>
            </div>

            {/* Footer Bottom */}
            <div className="border-t border-white/10 mt-8 pt-4 text-center text-sm text-gray-400">
              © {new Date().getFullYear()} <span className="text-yellow-300 font-semibold">NightSafe</span> — All Rights Reserved.
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Home;
