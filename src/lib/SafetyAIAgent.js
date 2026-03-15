// src/lib/SafetyAIAgent.js
import { SafetyAI } from './safetyAI';
import { toast } from 'sonner';

/**
 * SafetyAIAgent
 * Autonomous agent that monitors user safety and takes proactive actions.
 */
class SafetyAIAgent {
  constructor() {
    this.isMonitoring = false;
    this.lastLocation = null;
    this.lastAlertTime = 0;
    this.config = {
      alertThreshold: 40, // Score below this triggers auto-alert
      checkInterval: 30000, // Check every 30 seconds
    };
  }

  startMonitoring(onAction) {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    console.log("🤖 AI Agent: Monitoring started.");
    
    this.intervalId = setInterval(() => {
      this.checkSafety(onAction);
    }, this.config.checkInterval);
  }

  stopMonitoring() {
    this.isMonitoring = false;
    clearInterval(this.intervalId);
    console.log("🤖 AI Agent: Monitoring stopped.");
  }

  async checkSafety(onAction) {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      const score = SafetyAI.getSafetyScore(latitude, longitude);
      
      console.log(`🤖 AI Agent: Current Safety Score: ${score}`);

      if (score < this.config.alertThreshold && (Date.now() - this.lastAlertTime > 300000)) {
        // Trigger alert if score is low and we haven't alerted in 5 minutes
        this.lastAlertTime = Date.now();
        this.proactiveEscalation(score, onAction);
      }
    });
  }

  proactiveEscalation(score, onAction) {
    const message = `AI Alert: Your safety score has dropped to ${score}. I recommend sharing your live route and staying in well-lit areas.`;
    toast.error(message, {
      duration: 10000,
      action: {
        label: "Auto-Share",
        onClick: () => onAction('auto-share')
      }
    });

    // Speech feedback
    if ('speechSynthesis' in window) {
      const msg = new SpeechSynthesisUtterance("Caution. Safety levels are low in this area. AI Agent recommends activating live tracking.");
      window.speechSynthesis.speak(msg);
    }
  }

  /**
   * Automatically prepares and initiates the messaging flow
   */
  async triggerAutoMessaging(contacts, location) {
    if (!contacts || contacts.length === 0) return;

    const lat = location?.lat || 0;
    const lng = location?.lng || 0;
    const mapLink = `https://maps.google.com/?q=${lat},${lng}`;
    const message = `🚨 AI AGENT ALERT: High risk detected for ${localStorage.getItem("currentUserName") || 'User'}.\nLocation: ${mapLink}\nStatus: Emergency Protocol Activated.`;

    // Initiate SMS flow (Agent prepares the data, browser initiates UI)
    const phoneNumbers = contacts.map(c => c.phone).join(',');
    const smsUri = `sms:${phoneNumbers}?body=${encodeURIComponent(message)}`;
    
    toast.warning("AI Agent is initiating emergency messages to your contacts...");
    
    setTimeout(() => {
      window.open(smsUri, "_self");
    }, 2000);
  }
}

export const aiAgent = new SafetyAIAgent();
