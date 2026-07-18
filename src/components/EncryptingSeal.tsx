"use client";

import { useEffect, useState } from "react";
import { SealAnimation } from "@/components/SealAnimation";

/**
 * The applicant-side counterpart to SealAnimation's unseal moment: instead
 * of a seal breaking open, this shows it swinging shut around the answers
 * that were just encrypted. Starts open, closes almost immediately on
 * mount, and is gone within a couple seconds — a brief acknowledgement,
 * not a loading screen.
 */
export function EncryptingSeal() {
  const [sealed, setSealed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSealed(true), 60);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center gap-3 py-2" role="status" aria-live="polite">
      <SealAnimation sealed={sealed} size={56} />
      <p className="text-xs uppercase tracking-widest text-muted-foreground">Encrypting…</p>
    </div>
  );
}
