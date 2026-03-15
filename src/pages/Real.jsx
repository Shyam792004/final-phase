import React from "react";
import AppHeader from "../Component/AppHeader";
import { Side } from "./Side";
import { MapView } from "./MapView";
import { useDestination } from "./DestinationContext";

export default function Real() {
  const { destination } = useDestination();

  return (
    <div className="flex flex-col h-screen bg-slate-950 overflow-hidden">
      {/* Top Navigation */}
      <AppHeader />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Guard Central Sidebar */}
        <Side isOpen={true} onClose={() => { }} />

        {/* Main Content Area */}
        <main className="flex-1 ml-80 relative overflow-hidden">
          {/* Full Screen Interactive Map */}
          <div className="h-full w-full">
            <MapView destination={destination} />
          </div>

          {/* Minimal Floating Info (Optional but adds premium feel) */}
          <div className="absolute top-6 left-6 z-10 pointer-events-none">
            <div className="bg-slate-950/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl">
              <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                REAL-TIME <span className="text-indigo-500">MONITOR</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                Active Precinct Tracking
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
