"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import Link from "next/link";
import { Wallet, Copy, ExternalLink, LogOut, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { monadTestnet } from "@/lib/wagmi";
import { cn, truncateHex } from "@/lib/utils";

/**
 * Connect / disconnect entry point for a wallet. This is the first "seal"
 * moment a visitor meets — the button that turns identity into something
 * verifiable — so it uses the brass accent, but stays quiet otherwise.
 */
export function WalletConnectButton({ className }: { className?: string }) {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();

  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function handleCopy() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-5">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Dashboard
        </Link>
        <div className={cn("relative", className)} ref={menuRef}>
        <Button
          variant="outline"
          onClick={() => setMenuOpen((v) => !v)}
          className="font-data"
          aria-expanded={menuOpen}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
          {truncateHex(address)}
        </Button>

        <div
          className={cn(
            "absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-lg bg-popover p-1.5 hairline shadow-seal",
            "transition-all duration-150",
            menuOpen
              ? "opacity-100 scale-100 pointer-events-auto"
              : "opacity-0 scale-95 pointer-events-none",
          )}
        >
          <button
            onClick={handleCopy}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-foreground/90 hover:bg-secondary/20"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-success" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            {copied ? "Copied" : "Copy address"}
          </button>
          <a
            href={`${monadTestnet.blockExplorers.default.url}/address/${address}`}
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-foreground/90 hover:bg-secondary/20"
          >
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            View on explorer
          </a>
          <div className="my-1 h-px bg-secondary/25" />
          <button
            onClick={() => {
              disconnect();
              setMenuOpen(false);
            }}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-3.5 w-3.5" />
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
}

  return (
    <div className={cn("flex flex-col items-end gap-1.5", className)}>
      <Button
        variant="seal"
        onClick={() => { if (connectors[0]) connect({ connector: connectors[0], chainId: monadTestnet.id }) }}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Wallet className="h-4 w-4" />
        )}
        {isPending ? "Confirm in wallet…" : "Connect wallet"}
      </Button>
      {error && (
        <p className="text-xs text-destructive/90">
          {error.message.includes("rejected") ? "Connection request declined." : "Couldn't connect. Try again."}
        </p>
      )}
    </div>
  );
}
