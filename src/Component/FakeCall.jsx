import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, User, MessageCircle, Mic } from "lucide-react";

export default function FakeCall({ onEnd }) {
    const [status, setStatus] = useState("incoming"); // incoming, active
    const [timer, setTimer] = useState(0);

    useEffect(() => {
        let interval;
        let recognition;
        
        const scriptStages = [
            "Hey, I see you walking. Are you almost here?",
            "Okay, take your time. Just keep heading straight.",
            "I'm waving at you now, can you see me?",
            "Alright, just keep walking towards me."
        ];
        
        let currentStage = 0;

        if (status === "active") {
            interval = setInterval(() => setTimer((t) => t + 1), 1000);

            // Function to make the AI speak
            const speakNext = (text) => {
                if (status !== "active") return;
                
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 0.9;
                utterance.pitch = 1.1;
                
                utterance.onend = () => {
                    // Start listening for the user's reply after the AI finishes speaking
                    if (recognition && status === "active" && currentStage < scriptStages.length) {
                        try {
                            recognition.start();
                        } catch(e) {}
                    }
                };
                
                window.speechSynthesis.speak(utterance);
            };

            // Initialize Speech Recognition
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognition = new SpeechRecognition();
                recognition.continuous = false; // Stop listening after one phrase
                recognition.interimResults = false;
                recognition.lang = 'en-US';

                recognition.onresult = (event) => {
                    // Extract silence/response logic
                    const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
                    console.log("User said:", transcript);
                    
                    currentStage++;
                    if (currentStage < scriptStages.length) {
                        // Small delay to simulate human reaction time
                        setTimeout(() => speakNext(scriptStages[currentStage]), 1500);
                    }
                };

                // If user doesn't say anything, push the conversation forward anyway
                recognition.onspeechend = () => {
                   recognition.stop();
                };
                
                recognition.onerror = (event) => {
                   if (event.error === 'no-speech') {
                       currentStage++;
                       if (currentStage < scriptStages.length) {
                           setTimeout(() => speakNext(scriptStages[currentStage]), 2000);
                       }
                   }
                };
            }

            // Start the conversation 1 second after answering
            setTimeout(() => {
                speakNext(scriptStages[0]);
            }, 1000);
        }
        
        return () => {
            clearInterval(interval);
            window.speechSynthesis.cancel();
            if (recognition) {
                try { recognition.stop(); } catch(e) {}
            }
        };
    }, [status]);

    const formatTime = (s) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="fixed inset-0 z-[2000] bg-slate-950 flex flex-col items-center justify-between py-24 px-8 text-white">
            {/* Caller Info */}
            <div className="flex flex-col items-center gap-4 mt-8">
                <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center border border-white/10 shadow-2xl">
                    <User size={48} className="text-slate-400" />
                </div>
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight">Dad (Home)</h2>
                    <p className="text-indigo-400 font-medium mt-1">
                        {status === "incoming" ? "WhatsApp Voice Call..." : "Calling..."}
                    </p>
                </div>
                {status === "active" && (
                    <p className="text-xl font-mono mt-2 tabular-nums">{formatTime(timer)}</p>
                )}
            </div>

            {/* Vibration Effect for Incoming */}
            {status === "incoming" && (
                <motion.div
                    animate={{ x: [-2, 2, -2, 2, 0] }}
                    transition={{ repeat: Infinity, duration: 0.2 }}
                    className="hidden"
                />
            )}

            {/* Control Actions */}
            <div className="w-full max-w-sm flex flex-col gap-12">
                {status === "incoming" ? (
                    <div className="flex justify-between items-center w-full px-8">
                        <div className="flex flex-col items-center gap-2">
                            <button
                                onClick={onEnd}
                                className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-xl shadow-red-500/20 active:scale-90 transition-transform"
                            >
                                <PhoneOff size={28} />
                            </button>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Decline</span>
                        </div>

                        <div className="flex flex-col items-center gap-2">
                            <button
                                onClick={() => setStatus("active")}
                                className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-xl shadow-green-500/20 active:scale-90 transition-transform"
                            >
                                <Phone size={28} />
                            </button>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Accept</span>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-3 gap-8">
                            <ControlBtn icon={<Mic size={24} />} label="Mute" />
                            <ControlBtn icon={<User size={24} />} label="Add Call" />
                            <ControlBtn icon={<MessageCircle size={24} />} label="Video" />
                        </div>
                        <div className="flex justify-center">
                            <button
                                onClick={onEnd}
                                className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center shadow-2xl shadow-red-500/40 active:scale-95 transition-transform"
                            >
                                <PhoneOff size={32} />
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Hint for Travelers */}
            <div className="absolute bottom-8 text-slate-600 text-[10px] font-bold uppercase tracking-[0.3em] text-center w-full">
                Deterrence Simulation Mode Active
            </div>
        </div>
    );
}

function ControlBtn({ icon, label }) {
    return (
        <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer">
                {icon}
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase">{label}</span>
        </div>
    )
}
