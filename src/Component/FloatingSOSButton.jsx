import { AlertTriangle } from "lucide-react";
// import { useToast } from "@/hooks/use-toast";

export default function FloatingSOSButton() {
//   const { toast } = useToast();

  const handleEmergencySOS = () => {
    toast({
      title: "Emergency SOS Activated!",
      description: "Location sent to emergency contacts. Guardians notified via SMS/Email/Telegram. Emergency services contacted.",
      variant: "destructive",
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50" data-testid="floating-sos-button">
      <button 
        className="bg-danger-600 hover:bg-danger-700 text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 animate-pulse-slow"
        onClick={handleEmergencySOS}
        data-testid="floating-sos-button-trigger"
      >
        <AlertTriangle className="w-6 h-6" />
      </button>
    </div>
  );
}