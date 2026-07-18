"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Lock, LockOpen } from "lucide-react";

interface SealAnimationProps {
  /** true = intact seal, false = broken open. Controlled by UnsealButton. */
  sealed: boolean;
  size?: number;
  className?: string;
}

/**
 * The product's one deliberate piece of motion, reserved for the moment a
 * form owner decrypts a submission. A brass wax seal splits along its
 * center and swings open — doors on a hinge — with wax-crack fracture lines
 * radiating outward, and an amber glow pulse at the moment of release.
 *
 * Everything else in MonForm stays still by design. This is the payoff.
 *
 * Respects prefers-reduced-motion via framer-motion's automatic handling
 * of the transform/opacity properties used here.
 */
export function SealAnimation({ sealed, size = 96, className }: SealAnimationProps) {
  const half = size / 2;
  const r = half - 2;

  return (
    <div
      className={className}
      style={{ width: size, height: size, perspective: 600 }}
      role="img"
      aria-label={sealed ? "Sealed, not yet decrypted" : "Unsealed and decrypted"}
    >
      <div className="relative h-full w-full">
        {/* ------------------------------------------------------------------ */}
        {/* Amber release pulse — a single radial bloom at the moment of crack. */}
        {/* ------------------------------------------------------------------ */}
        <AnimatePresence>
          {!sealed && (
            <>
              <motion.div
                key="pulse-outer"
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, rgba(201,162,75,0.55) 0%, rgba(201,162,75,0) 70%)",
                }}
                initial={{ opacity: 0.9, scale: 0.5 }}
                animate={{ opacity: 0, scale: 2.4 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
              />
              <motion.div
                key="pulse-inner"
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, rgba(255,235,180,0.7) 0%, rgba(201,162,75,0.0) 55%)",
                }}
                initial={{ opacity: 1, scale: 0.3 }}
                animate={{ opacity: 0, scale: 1.2 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
              />
            </>
          )}
        </AnimatePresence>

        {/* ------------------------------------------------------------------ */}
        {/* Crack SVG — fracture lines that appear as the seal breaks.          */}
        {/* ------------------------------------------------------------------ */}
        <AnimatePresence>
          {!sealed && (
            <motion.svg
              key="cracks"
              className="pointer-events-none absolute inset-0"
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.08, duration: 0.2 }}
            >
              {/* Vertical center split */}
              <motion.line
                x1={half} y1={2}
                x2={half} y2={size - 2}
                stroke="rgba(242,239,233,0.55)"
                strokeWidth={1.5}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
              {/* Upper-left crack */}
              <motion.line
                x1={half} y1={half * 0.7}
                x2={half * 0.45} y2={half * 0.3}
                stroke="rgba(242,239,233,0.35)"
                strokeWidth={1}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.25, delay: 0.1, ease: "easeOut" }}
              />
              {/* Lower-right crack */}
              <motion.line
                x1={half} y1={half * 1.35}
                x2={half * 1.6} y2={size - half * 0.35}
                stroke="rgba(242,239,233,0.3)"
                strokeWidth={1}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.25, delay: 0.15, ease: "easeOut" }}
              />
              {/* Upper-right shard */}
              <motion.line
                x1={half} y1={half * 0.55}
                x2={half * 1.5} y2={half * 0.2}
                stroke="rgba(242,239,233,0.25)"
                strokeWidth={0.75}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.2, delay: 0.18, ease: "easeOut" }}
              />
            </motion.svg>
          )}
        </AnimatePresence>

        {/* ------------------------------------------------------------------ */}
        {/* Left half of the wax seal — swings open to the left.               */}
        {/* ------------------------------------------------------------------ */}
        <motion.div
          className="absolute inset-0 overflow-hidden rounded-full"
          style={{
            clipPath: "inset(0 50% 0 0)",
            transformOrigin: "left center",
            background: sealed
              ? "radial-gradient(circle at 38% 38%, #D9B876 0%, #C9A24B 45%, #8A6E33 100%)"
              : "radial-gradient(circle at 38% 38%, #C9A24B 0%, #8A6E33 60%, #5A4820 100%)",
            boxShadow: sealed
              ? "inset 0 1px 0 rgba(255,235,180,0.3), 0 4px 16px -4px rgba(0,0,0,0.6)"
              : "none",
          }}
          animate={
            sealed
              ? { rotateY: 0, x: 0, opacity: 1, z: 0 }
              : { rotateY: -125, x: -half * 0.4, opacity: 0.8, z: -20 }
          }
          transition={{ type: "spring", stiffness: 110, damping: 16, mass: 1.1 }}
        >
          {/* Embossed ring texture on left half */}
          <svg
            className="absolute inset-0 opacity-20"
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
          >
            <circle cx={half} cy={half} r={r * 0.78} fill="none" stroke="rgba(255,235,180,0.8)" strokeWidth={1} />
            <circle cx={half} cy={half} r={r * 0.55} fill="none" stroke="rgba(255,235,180,0.5)" strokeWidth={0.75} />
          </svg>
        </motion.div>

        {/* ------------------------------------------------------------------ */}
        {/* Right half of the wax seal — swings open to the right.             */}
        {/* ------------------------------------------------------------------ */}
        <motion.div
          className="absolute inset-0 overflow-hidden rounded-full"
          style={{
            clipPath: "inset(0 0 0 50%)",
            transformOrigin: "right center",
            background: sealed
              ? "radial-gradient(circle at 62% 38%, #D9B876 0%, #C9A24B 45%, #8A6E33 100%)"
              : "radial-gradient(circle at 62% 38%, #C9A24B 0%, #8A6E33 60%, #5A4820 100%)",
            boxShadow: sealed
              ? "inset 0 1px 0 rgba(255,235,180,0.3), 0 4px 16px -4px rgba(0,0,0,0.6)"
              : "none",
          }}
          animate={
            sealed
              ? { rotateY: 0, x: 0, opacity: 1, z: 0 }
              : { rotateY: 125, x: half * 0.4, opacity: 0.8, z: -20 }
          }
          transition={{ type: "spring", stiffness: 110, damping: 16, mass: 1.1 }}
        >
          {/* Embossed ring texture on right half */}
          <svg
            className="absolute inset-0 opacity-20"
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
          >
            <circle cx={half} cy={half} r={r * 0.78} fill="none" stroke="rgba(255,235,180,0.8)" strokeWidth={1} />
            <circle cx={half} cy={half} r={r * 0.55} fill="none" stroke="rgba(255,235,180,0.5)" strokeWidth={0.75} />
          </svg>
        </motion.div>

        {/* ------------------------------------------------------------------ */}
        {/* Center glyph — lock icon crossfades as seal opens.                 */}
        {/* ------------------------------------------------------------------ */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={false}
          animate={{
            scale: sealed ? 1 : 1.1,
            opacity: sealed ? 1 : 0.95,
          }}
          transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
        >
          <AnimatePresence mode="wait">
            {sealed ? (
              <motion.div
                key="locked"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.2 }}
              >
                <Lock className="text-ink drop-shadow-sm" style={{ width: size * 0.25, height: size * 0.25 }} strokeWidth={2} />
              </motion.div>
            ) : (
              <motion.div
                key="unlocked"
                initial={{ opacity: 0, scale: 0.7, rotate: -15 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <LockOpen className="text-parchment drop-shadow" style={{ width: size * 0.28, height: size * 0.28 }} strokeWidth={2} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
