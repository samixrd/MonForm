import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Truncates a hex address or hash to the "0x1a2b…9f3c" form used everywhere
 * MonForm shows onchain data. Kept in one place so the display convention
 * (4 leading / 4 trailing chars) never drifts between components.
 */
export function truncateHex(value: string, lead = 4, trail = 4): string {
  if (!value) return "";
  if (value.length <= lead + trail + 2) return value;
  return `${value.slice(0, lead + 2)}…${value.slice(-trail)}`;
}

/** Resolves after `ms` — used to floor a UI state's visible duration so a
 * fast wallet response never flashes past a deliberate animation. */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatTimestamp(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
