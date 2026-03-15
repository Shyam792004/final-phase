import { motion } from "framer-motion";

export default function SafetyPrompt({ onConfirm }) {
  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-8 right-8 bg-black/90 text-white p-6 rounded-xl shadow-2xl backdrop-blur-lg"
    >
      <h3 className="text-lg font-semibold">Are you safe?</h3>
      <button
        onClick={onConfirm}
        className="mt-4 px-6 py-2 bg-green-500 rounded-lg hover:scale-105 transition"
      >
        I’m Safe
      </button>
    </motion.div>
  );
}
