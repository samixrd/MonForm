"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SealAnimation } from "@/components/SealAnimation";

interface UnsealButtonProps {
  /** Called once when the user clicks Unseal. Should resolve after decryption. */
  onUnseal: () => Promise<void> | void;
}

/**
 * Wires SealAnimation to a click event with a wallet-confirm pending state.
 * This is the ceremonial trigger for MonForm's one deliberate animation —
 * the seal crack. Used exclusively in the dashboard's SubmitterRow.
 *
 * The actual decryption happens in the caller's onUnseal callback (via
 * lib/encryption.ts `decryptFormValues`), keeping this component pure UI.
 */
export function UnsealButton({ onUnseal }: UnsealButtonProps) {
  const [sealed, setSealed] = useState(true);
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (!sealed || pending) return;
    setPending(true);
    try {
      await onUnseal();
      setSealed(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* The seal — clickable while still sealed */}
      <button
        onClick={handleClick}
        disabled={!sealed || pending}
        className="group relative disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-full"
        aria-label={sealed ? "Click to unseal this submission" : "Submission unsealed"}
      >
        {/* Subtle hover glow ring */}
        {sealed && !pending && (
          <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{ boxShadow: "0 0 0 3px rgba(201,162,75,0.35), 0 0 20px 0px rgba(201,162,75,0.2)" }}
          />
        )}
        <SealAnimation sealed={sealed} size={72} />
      </button>

      {/* Label below the seal */}
      <AnimatePresence mode="wait">
        {sealed ? (
          <motion.div
            key="unseal-btn"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              variant="seal"
              size="sm"
              onClick={handleClick}
              disabled={pending}
              className="min-w-[100px]"
            >
              {pending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Confirm in wallet…
                </>
              ) : (
                "Unseal"
              )}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="unsealed-label"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <span className="text-xs font-medium text-brass tracking-wide">
              Unsealed ✦
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
