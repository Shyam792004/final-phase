// src/Component/AIChatAdvisor.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Shield, Zap, AlertTriangle, ChevronRight } from 'lucide-react';
import { SafetyAI } from '../lib/safetyAI';
import { aiAgent } from '../lib/SafetyAIAgent';
import { ENDPOINTS } from '../lib/api';

const AIChatAdvisor = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hello! I am your NightSafe AI Advisor. How can I help you stay safe tonight?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [safetyScore, setSafetyScore] = useState(100);
  const scrollRef = useRef(null);

  useEffect(() => {
    const updateScore = () => {
      navigator.geolocation.getCurrentPosition((pos) => {
        const score = SafetyAI.getSafetyScore(pos.coords.latitude, pos.coords.longitude);
        setSafetyScore(score);
      });
    };

    updateScore();
    const interval = setInterval(updateScore, 30000);
    
    // Event listeners for external control
    const handleToggle = () => setIsOpen(prev => !prev);
    const handleOpen = () => setIsOpen(true);
    
    window.addEventListener('toggle-ai-chat', handleToggle);
    window.addEventListener('open-ai-chat', handleOpen);

    // Auto-start AI Agent Monitoring
    aiAgent.startMonitoring(async (action) => {
      if (action === 'auto-share') {
        // Trigger the same logic as the "Start Route Share" in AdvancedSafetyMap
        // For simplicity in this demo, we'll try to fetch contacts and trigger agent messaging
        const username = localStorage.getItem("currentUserName");
        if (username) {
          try {
            const res = await fetch(ENDPOINTS.CONTACTS(username));
            if (res.ok) {
              const contacts = await res.json();
              navigator.geolocation.getCurrentPosition((pos) => {
                aiAgent.triggerAutoMessaging(contacts, { lat: pos.coords.latitude, lng: pos.coords.longitude });
              });
            }
          } catch (e) {
             console.error("AI Agent failed to fetch contacts for auto-messaging", e);
          }
        }
      }
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener('toggle-ai-chat', handleToggle);
      window.removeEventListener('open-ai-chat', handleOpen);
      aiAgent.stopMonitoring();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking
    setTimeout(async () => {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const response = await SafetyAI.getResponse(userMsg, {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setMessages(prev => [...prev, { role: 'ai', text: response }]);
        setIsTyping(false);
      });
    }, 1000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-80 md:w-96 bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[500px]"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                  <Shield size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">NightSafe AI Advisor</h3>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px] text-white/70 uppercase font-bold tracking-widest">Active Sentinel</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} className="text-white" />
              </button>
            </div>

            {/* Quick Stats */}
            <div className="px-4 py-3 bg-white/5 border-b border-white/5 flex justify-between items-center text-[10px] font-bold uppercase tracking-tighter">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-yellow-400" />
                <span className="text-slate-400">Current Safety Score:</span>
                <span className={`${safetyScore > 70 ? 'text-green-400' : 'text-red-400'}`}>{safetyScore}/100</span>
              </div>
              <div className="flex gap-1">
                 {[1,2,3].map(i => (
                   <div key={i} className={`w-3 h-1 rounded-full ${safetyScore > (i*30) ? 'bg-green-500' : 'bg-slate-700'}`} />
                 ))}
              </div>
            </div>

            {/* Chat Body */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth custom-scrollbar"
            >
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: msg.role === 'ai' ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-white/10 text-slate-200 rounded-tl-none border border-white/5'
                  }`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/10 p-3 rounded-2xl rounded-tl-none border border-white/5">
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Suggestions */}
            <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar border-t border-white/5">
              {['Is it safe here?', 'Emergency help', 'Safety tips'].map(tip => (
                <button
                  key={tip}
                  onClick={() => setInput(tip)}
                  className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-400 hover:bg-white/10 transition-colors"
                >
                  {tip}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 bg-slate-900 border-t border-white/5 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask anything..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                onClick={handleSend}
                className="p-2 bg-indigo-600 rounded-xl text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20"
              >
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
          isOpen ? 'bg-slate-800' : 'bg-gradient-to-r from-indigo-600 to-purple-600'
        }`}
      >
        {isOpen ? (
          <X size={24} className="text-white" />
        ) : (
          <div className="relative">
            <MessageSquare size={24} className="text-white" />
            <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-900 ${
              safetyScore < 50 ? 'bg-red-500 animate-ping' : 'bg-green-500'
            }`} />
          </div>
        )}
      </motion.button>
    </div>
  );
};

export default AIChatAdvisor;
