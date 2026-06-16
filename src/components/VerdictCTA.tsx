"use client";

import { motion } from "framer-motion";

interface VerdictCTAProps {
  onClick: () => void;
}

export function VerdictCTA({ onClick }: VerdictCTAProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-center px-4 pb-2"
    >
      <button
        onClick={onClick}
        className="w-full max-w-xs rounded-full border border-violet-300 bg-violet-50 px-6 py-3 font-inter text-sm font-medium text-violet-900 shadow-sm transition-all hover:bg-violet-100 dark:border-violet-700 dark:bg-violet-950/50 dark:text-violet-200 dark:hover:bg-violet-900/50"
      >
        Go to final verdict
      </button>
    </motion.div>
  );
}
