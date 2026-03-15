import { PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SOSButton() {
  return (
    <Button
      className="h-14 px-6 bg-red-600 hover:bg-red-700 rounded-2xl font-bold"
      onClick={() => alert("🚨 SOS Triggered")}
    >
      <PhoneCall className="mr-2 h-5 w-5" />
      SOS
    </Button>
  );
}
