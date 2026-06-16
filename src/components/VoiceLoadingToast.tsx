"use client";

import { motion, AnimatePresence } from "framer-motion";

interface VoiceLoadingToastProps {
  visible: boolean;
}

export function VoiceLoadingToast({ visible }: VoiceLoadingToastProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full border border-violet-300 bg-violet-50 px-4 py-2 font-mono text-[10px] text-violet-800 shadow-md dark:border-violet-700 dark:bg-violet-950/90 dark:text-violet-200"
        >
          Loading neural voice model…
        </motion.div>
      )}
    </AnimatePresence>
  );
}
