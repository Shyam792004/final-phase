import { motion, AnimatePresence } from "framer-motion";
import { MapPin } from "lucide-react";
import { useDestination } from "../pages/DestinationContext"

export function DestinationCard() {
  const { setDestination, askDestination, setAskDestination } =
    useDestination();

  return (
    <AnimatePresence>
      {askDestination && (
        <>
          {/* 🔹 Soft dark backdrop (NO BLUR) */}
          <motion.div
            className="fixed inset-0 bg-black/60 z-[1100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* 🔹 Centered Card */}
          <motion.div
            className="fixed inset-0 z-[1200] flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <motion.div
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              transition={{ type: "spring", stiffness: 120 }}
              className="w-[520px] max-w-[90%] rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-black
                         border border-white/10 shadow-[0_0_60px_rgba(0,255,120,0.15)]
                         p-8"
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">
                    Enter Destination
                  </h2>
                  <p className="text-xs text-gray-400">
                    Where should we guide you?
                  </p>
                </div>
              </div>

              {/* Input */}
              <input
                autoFocus
                type="text"
                placeholder="Gandhipuram, RS Puram, Saibaba Colony…"
                className="w-full px-5 py-4 text-base rounded-2xl
                           bg-black/40 border border-white/10
                           text-white outline-none
                           focus:border-green-500 focus:ring-2 focus:ring-green-500/20
                           transition"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.target.value.trim()) {
                    setDestination(e.target.value.toLowerCase());
                    setAskDestination(false);
                  }
                }}
              />

              {/* Helper text */}
              <p className="mt-4 text-center text-xs text-gray-400">
                Press <span className="text-green-400 font-bold">Enter</span> to
                start navigation
              </p>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
