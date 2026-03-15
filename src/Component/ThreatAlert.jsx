import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, CheckCircle, AlertTriangle } from "lucide-react";

export default function ThreatAlert({ onSafe, onEmergency }) {
    const [countdown, setCountdown] = useState(30);

    useEffect(() => {
        if (countdown <= 0) {
            onEmergency();
            return;
        }
        const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
        return () => clearInterval(timer);
    }, [countdown, onEmergency]);

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-900 border-2 border-red-500/50 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center"
            >
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-red-500/20 rounded-full animate-pulse">
                        <ShieldAlert size={48} className="text-red-500" />
                    </div>
                </div>

                <h2 className="text-3xl font-black text-white mb-2">ARE YOU SAFE?</h2>
                <p className="text-slate-400 mb-8">
                    Potential threat detected. Please confirm your safety.
                </p>

                <div className="relative w-32 h-32 mx-auto mb-8">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="64"
                            cy="64"
                            r="60"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            className="text-slate-800"
                        />
                        <motion.circle
                            cx="64"
                            cy="64"
                            r="60"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray="377"
                            animate={{ strokeDashoffset: 377 - (377 * countdown) / 30 }}
                            className="text-red-500"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl font-bold text-white">{countdown}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={onSafe}
                        className="flex items-center justify-center gap-2 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all hover:scale-105"
                    >
                        <CheckCircle size={20} /> I'M SAFE
                    </button>
                    <button
                        onClick={onEmergency}
                        className="flex items-center justify-center gap-2 py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl transition-all hover:scale-105"
                    >
                        <AlertTriangle size={20} /> EMERGENCY
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
