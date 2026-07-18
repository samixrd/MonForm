"use client";

import { motion } from "framer-motion";
import { WaxSealMark } from "@/components/WaxSealMark";

/**
 * The publish-time counterpart to SealAnimation — a stamp settling into
 * place rather than a seal breaking open. Deliberately smaller and quieter
 * than the unseal moment: a brief press-and-settle with a soft brass
 * pulse, gone in well under a second. Not the main event.
 */
export function SealingIndicator() {
  return (
    <div className="flex flex-col items-center gap-2.5 py-1" role="status" aria-live="polite">
      <div className="relative flex h-10 w-10 items-center justify-center">
        <motion.div
          className="absolute inset-0 rounded-full bg-brass/30"
          initial={{ opacity: 0.5, scale: 0.7 }}
          animate={{ opacity: 0, scale: 1.7 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <WaxSealMark className="h-9 w-9" />
        </motion.div>
      </div>
      <p className="text-xs uppercase tracking-widest text-muted-foreground">Sealing onchain…</p>
    </div>
  );
}
