"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { UnsealButton } from "@/components/UnsealButton";
import { truncateHex, formatTimestamp } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Submission, DecryptedResponse, FormField } from "@/lib/types";

interface SubmitterRowProps {
  submission: Submission;
  /** Called once when the user triggers decryption. */
  onDecrypt: (submitterAddress: string) => Promise<void> | void;
  /** Populated only after the owner has decrypted — null while sealed. */
  decrypted?: DecryptedResponse | null;
  /** The form's field definitions, for labelling decrypted values. */
  fields: FormField[];
}

/**
 * One row in the form-owner's submissions table.
 *
 * Sealed state: address (monospace + copy), timestamp, IPFS CID badge, UnsealButton.
 * Unsealed state: same header, then an animated slide-down reveal panel with
 * the plaintext fields laid out in parchment colour on the ink backdrop,
 * plus a "sealed by [wallet]" caption.
 *
 * The transition between states is the ONE place in MonForm where we spend
 * real animation budget — SealAnimation's crack-and-bloom happens here.
 */
export function SubmitterRow({ submission, onDecrypt, decrypted, fields }: SubmitterRowProps) {
  const [copied, setCopied] = useState(false);
  const isUnsealed = !!decrypted;

  async function handleCopy() {
    await navigator.clipboard.writeText(submission.submitterAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <motion.div
      layout
      className={cn(
        "rounded-xl hairline overflow-hidden transition-colors duration-300",
        isUnsealed
          ? "bg-gradient-to-b from-ink-lifted to-ink/60 seal-glow"
          : "bg-ink/40 hover:bg-ink-lifted/60",
      )}
      transition={{ layout: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } }}
    >
      {/* -------------------------------------------------------------------- */}
      {/* Header row: address + meta on left, UnsealButton on right.           */}
      {/* -------------------------------------------------------------------- */}
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        {/* Left: wallet info */}
        <div className="min-w-0 space-y-2">
          {/* Address + copy */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-data text-sm text-foreground/90 truncate">
              {truncateHex(submission.submitterAddress)}
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="Copy wallet address"
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.span
                    key="check"
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Check className="h-3 w-3 text-sage" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="copy"
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Copy className="h-3 w-3" />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>

          {/* Timestamp + CID badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs text-muted-foreground">{formatTimestamp(submission.timestamp)}</p>
            <a
              href={`https://gateway.irys.xyz/${submission.ipfsCID}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex"
            >
              <Badge variant="default" className="hover:bg-secondary/50 transition-colors cursor-pointer">
                <ExternalLink className="h-2.5 w-2.5" />
                <span className="font-data">{truncateHex(submission.ipfsCID, 4, 4)}</span>
              </Badge>
            </a>
          </div>
        </div>

        {/* Right: unseal control */}
        <div className="shrink-0">
          <UnsealButton onUnseal={() => onDecrypt(submission.submitterAddress)} />
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Revealed panel — slides in beneath the header after decryption.      */}
      {/* -------------------------------------------------------------------- */}
      <AnimatePresence>
        {isUnsealed && decrypted && (
          <motion.div
            key="revealed"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: "hidden" }}
          >
            {/* Brass hairline separator */}
            <div
              className="mx-5 h-px"
              style={{ background: "linear-gradient(90deg, transparent, rgba(201,162,75,0.5), transparent)" }}
            />

            <motion.div
              className="px-5 py-5 space-y-4"
              initial={{ y: 8 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Field-by-field parchment reveal */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {fields.map((field, i) => {
                  const value = decrypted.values[field.id] ?? decrypted.values[field.label] ?? "—";
                  return (
                    <motion.div
                      key={field.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.15 + i * 0.07 }}
                      className="space-y-0.5"
                    >
                      <p className="text-xs text-muted-foreground tracking-wide uppercase font-medium">
                        {field.label}
                      </p>
                      <p
                        className={cn(
                          "text-sm text-parchment leading-snug break-all",
                          field.type === "email" || field.type === "url" ? "font-data" : "font-sans",
                        )}
                      >
                        {field.type === "url" && value !== "—" ? (
                          <a
                            href={value.startsWith("http") ? value : `https://${value}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-brass hover:text-brass-soft underline underline-offset-2 transition-colors"
                          >
                            {value}
                          </a>
                        ) : (
                          value
                        )}
                      </p>
                    </motion.div>
                  );
                })}
              </div>

              {/* "Sealed by" caption */}
              <motion.p
                className="text-xs text-muted-foreground/60 pt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.5 }}
              >
                Unsealed by{" "}
                <span className="font-data text-muted-foreground/80">
                  {truncateHex(submission.submitterAddress)}
                </span>
                {" "}· {formatTimestamp(decrypted.decryptedAt)}
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
