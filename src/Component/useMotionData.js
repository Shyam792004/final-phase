import { useEffect, useState } from "react";

export default function useMotionData() {
  const [motion, setMotion] = useState(false);

  useEffect(() => {
    window.addEventListener("devicemotion", (e) => {
      const acc = e.accelerationIncludingGravity;
      if (Math.abs(acc.x) > 15 || Math.abs(acc.y) > 15) {
        setMotion(true);
      }
    });
  }, []);

  return motion;
}
