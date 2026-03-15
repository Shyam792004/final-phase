import {
  Shield,
  Navigation,
  ChevronDown,
  LogOut,
  Car,
  House,
  Circle,
  RadioTower,
  Speech,
  PhoneCall,
  Mail,
  MapPin,
  Github,
  Linkedin,
} from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { ENDPOINTS } from "../lib/api";

export default function AppHeader() {
  const [, setLocation] = useLocation();
  const [userName, setUserName] = useState("");
  const [loggedInName, setLoggedInName] = useState("");
  const [currentCity, setCurrentCity] = useState("");

  useEffect(() => {
    const storedName = localStorage.getItem("currentUserName");
    if (storedName) {
      setUserName(storedName);
    }
  }, []);

  useEffect(() => {
    const name = localStorage.getItem("loggedInUser");
    if (name) setLoggedInName(name);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const name = localStorage.getItem("loggedInUser");
      if (name !== loggedInName) setLoggedInName(name);
    }, 1000);
    return () => clearInterval(interval);
  }, [loggedInName]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          try {
            const res = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const data = await res.json();
            if (data.city) setCurrentCity(data.city);
            else if (data.locality) setCurrentCity(data.locality);
            else setCurrentCity("Unknown City");
          } catch (err) {
            console.error("Location fetch failed", err);
            setCurrentCity("Location unavailable");
          }
        },
        () => setCurrentCity("Location permission denied")
      );
    } else {
      setCurrentCity("Geolocation not supported");
    }
  }, []);

  const [contacts, setContacts] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchContacts = async () => {
      const storedId = localStorage.getItem("currentUserId");
      const username = localStorage.getItem("currentUserName");

      // Defensive check for "undefined" or "null" strings from previous buggy storage
      const userId = (storedId && storedId !== "undefined" && storedId !== "null") ? storedId : null;

      console.log("AppHeader: Syncing contacts. Found ID:", userId, "Username:", username);

      if (!userId && !username) {
        console.log("AppHeader: No valid identifier found. Skipping fetch.");
        return;
      }

      try {
        const url = userId ? ENDPOINTS.CONTACTS_BY_USER_ID(userId) : ENDPOINTS.CONTACTS(username);
        console.log("AppHeader: Fetch URL ->", url);

        const response = await fetch(url);

        if (response.ok) {
          const data = await response.json();
          console.log("AppHeader: Successfully fetched contacts:", data);
          setContacts(data);
        } else {
          console.error("AppHeader: Fetch failed with status:", response.status);
        }
      } catch (err) {
        console.error("AppHeader: Connection error fetching contacts:", err);
      }
    };
    fetchContacts();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("currentUserName");
    localStorage.removeItem("currentUserId");
    localStorage.removeItem("userRole");
    setLoggedInName("");
    window.location.href = "/FamilyLogin";
  };

  const iconBtn =
    "p-3 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 border border-indigo-500/30 text-indigo-200 rounded-2xl hover:from-indigo-600 hover:to-purple-600 hover:text-white hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-indigo-500/40";

  return (
    <header className="sticky top-0 z-50 backdrop-blur-2xl bg-gradient-to-r from-slate-950/90 via-indigo-950/80 to-slate-950/90 border-b border-indigo-500/20 shadow-[0_8px_30px_rgba(0,0,0,0.6)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3">

          {/* LEFT SECTION */}
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 p-3 rounded-2xl shadow-xl shadow-indigo-500/40">
              <Shield className="text-white w-7 h-7" />
            </div>

            <div>
              <h1 className="text-2xl font-extrabold tracking-wide text-white bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                NightSafe
              </h1>
              <p className="text-xs tracking-widest text-slate-400 uppercase">
                Night Travel Safety System
              </p>

              {loggedInName && (
                <p className="mt-2 text-xs font-semibold text-yellow-900 bg-gradient-to-r from-yellow-300 to-amber-300 px-3 py-1 rounded-full inline-flex items-center gap-1 shadow-md">
                  👤 Welcome {loggedInName}
                </p>
              )}
            </div>

            <button onClick={() => setLocation("/home")} className={iconBtn}>
              <House size={20} />
            </button>
          </div>

          {/* RIGHT SECTION */}
          <div className="flex items-center space-x-3">

            <div className="hidden md:flex flex-col items-start">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-emerald-400 rounded-full shadow-[0_0_14px_rgba(16,185,129,1)] animate-pulse"></div>
                <span className="text-sm font-bold text-slate-300">
                  👤 Welcome {loggedInName}
                </span>
              </div>
            </div>

            <button onClick={() => setLocation("/map")} className={iconBtn}>
              <Navigation size={20} />
            </button>

            <button
              onClick={() => setLocation("/mapdashboard")}
              className={iconBtn}
            >
              <Shield size={20} />
            </button>

            <button
              onClick={() => (window.location.href = "/safecab")}
              className={iconBtn}
            >
              <RadioTower size={20} />
            </button>

            <button
              onClick={() => (window.location.href = "/real")}
              className={iconBtn}
            >
              <Speech size={20} />
            </button>

            <button
              onClick={() => (window.location.href = "/flow")}
              className={iconBtn}
            >
              <Circle size={20} />
            </button>

            {/* PROFILE DROPDOWN */}
            <div className="relative">
              <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 border border-indigo-500/40 text-white hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-indigo-500/40"
              >
                <span className="text-sm font-semibold">
                  Manage Contacts
                </span>

                <img
                  src="usergrp.png"
                  alt="User Profile"
                  className="w-9 h-9 rounded-full border-2 border-indigo-400 shadow-md"
                />

                <ChevronDown
                  className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""
                    }`}
                />
              </button>

              {open && (
                <div className="absolute right-0 mt-3 w-52 bg-slate-950/95 backdrop-blur-xl border border-indigo-500/30 rounded-2xl shadow-2xl shadow-black/60 z-20 overflow-hidden animate-in fade-in zoom-in duration-200">
                  <div className="px-4 py-2 bg-indigo-600/20 border-b border-indigo-500/20">
                    <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">My Network</p>
                  </div>
                  {contacts.length > 0 ? (
                    contacts.map((member, index) => (
                      <div
                        key={index}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-300 border-b border-white/5"
                      >
                        <p className="font-bold text-white">{member.name}</p>
                        <p className="text-[10px] text-indigo-400">{member.relationship} • {member.phone}</p>
                      </div>
                    ))
                  ) : (
                    <p className="px-4 py-4 text-xs text-gray-500 italic">No contacts added.</p>
                  )}

                  <button
                    onClick={() => setLocation("/AddMember")}
                    className="w-full text-left px-4 py-3 text-xs font-bold text-indigo-300 hover:bg-slate-800 transition-colors flex items-center gap-2"
                  >
                    Manage Contacts
                  </button>

                  <div className="border-t border-slate-700"></div>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-600 hover:text-white transition flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              )}
            </div>

            {currentCity && (
              <span className="text-xs font-semibold text-amber-900 bg-gradient-to-r from-amber-300 to-yellow-300 px-3 py-1 rounded-full shadow-md border border-amber-200">
                📍 {currentCity}
              </span>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300 text-xs font-bold"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}