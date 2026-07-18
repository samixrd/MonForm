"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import {
  FolderLock,
  Plus,
  FileText,
  Users,
  Clock,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { getForms, getSubmitters } from "@/lib/api";
import { formatTimestamp, truncateHex } from "@/lib/utils";
import type { Form } from "@/lib/types";

interface FormWithMeta extends Form {
  submissionCount: number;
}

/**
 * Owner dashboard — grid of all forms owned by the connected wallet.
 * Each card shows: form name, field count, submission count, created date,
 * and navigates to the individual form view on click.
 */
export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [forms, setForms] = useState<FormWithMeta[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanProgress, setScanProgress] = useState<{ scanned: number; total: number } | null>(null);

  useEffect(() => {
    if (!address) {
      setForms(null);
      return;
    }
    setLoading(true);
    setScanProgress(null);
    getForms(address, (scanned, total) => setScanProgress({ scanned, total })).then(async (rawForms) => {
      // Fetch submission counts in parallel.
      const withCounts = await Promise.all(
        rawForms.map(async (form) => {
          const subs = await getSubmitters(form.id);
          return { ...form, submissionCount: subs.length };
        }),
      );
      setForms(withCounts);
      setLoading(false);
      setScanProgress(null);
    });
  }, [address]);

  // ── Not connected ──────────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="container max-w-lg py-24 flex flex-col items-center gap-8">
        <div className="text-center space-y-3">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brass/10 seal-glow">
            <FolderLock className="h-7 w-7 text-brass" strokeWidth={1.5} />
          </div>
          <h1 className="font-display text-3xl font-medium">Your dashboard</h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
            Connect your wallet to see the forms you own and manage your
            sealed submissions.
          </p>
        </div>
        <WalletConnectButton />
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading || forms === null) {
    return (
      <div className="container max-w-3xl py-24 flex flex-col items-center gap-4">
        <Loader2 className="h-6 w-6 text-brass animate-spin" />
        {scanProgress ? (
          <>
            <p className="text-sm text-muted-foreground">
              Scanning blocks{" "}
              <span className="font-data text-foreground/70">
                {scanProgress.scanned}
              </span>
              {" of "}
              <span className="font-data text-foreground/70">
                {scanProgress.total}
              </span>
              …
            </p>
            <div className="w-48 h-1 rounded-full bg-secondary/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-brass/60 transition-all duration-150"
                style={{ width: `${Math.round((scanProgress.scanned / scanProgress.total) * 100)}%` }}
              />
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Loading your forms…</p>
        )}
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-16">
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="mb-10 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium">Your forms</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-data text-foreground/70">{truncateHex(address!)}</span>
            {" · "}
            {forms.length === 0
              ? "No forms yet"
              : `${forms.length} form${forms.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <Button variant="seal" size="sm" asChild>
          <Link href="/create">
            <Plus className="h-3.5 w-3.5" />
            New form
          </Link>
        </Button>
      </div>

      {/* ── Empty state ─────────────────────────────────────────────────────── */}
      {forms.length === 0 && (
        <EmptyState
          icon={FolderLock}
          title="No forms yet"
          description="Create your first allowlist form to start collecting sealed onchain submissions."
          action={
            <Button variant="seal" size="sm" asChild>
              <Link href="/create">
                <Plus className="h-3.5 w-3.5" />
                Create a form
              </Link>
            </Button>
          }
        />
      )}

      {/* ── Form card grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {forms.map((form, i) => (
          <motion.div
            key={form.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link href={`/dashboard/${form.id}`} className="group block">
              <div
                className="relative h-full rounded-xl hairline bg-ink-lifted/60 hover:bg-ink-lifted
                            transition-all duration-250 overflow-hidden
                            hover:seal-glow"
              >
                {/* Top accent stripe */}
                <div
                  className="h-0.5 w-full"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent 0%, rgba(201,162,75,0.7) 40%, rgba(201,162,75,0.3) 100%)",
                    opacity: form.submissionCount > 0 ? 1 : 0.35,
                  }}
                />

                <div className="p-5 space-y-4">
                  {/* Card header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brass/10 shrink-0">
                        <FileText className="h-4 w-4 text-brass" strokeWidth={1.75} />
                      </div>
                      <h2 className="font-display text-base font-medium leading-tight text-foreground group-hover:text-parchment transition-colors line-clamp-2">
                        {form.name}
                      </h2>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5 group-hover:text-brass group-hover:translate-x-0.5 transition-all duration-200" />
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                      <span className="text-sm tabular-nums">
                        <span className="font-medium text-foreground/90">{form.submissionCount}</span>
                        <span className="text-muted-foreground ml-1">
                          submission{form.submissionCount === 1 ? "" : "s"}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                      <span className="text-sm text-muted-foreground">
                        {form.fields.length} field{form.fields.length === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-1 border-t border-secondary/15">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                      <Clock className="h-3 w-3" strokeWidth={1.75} />
                      {formatTimestamp(form.createdAt)}
                    </div>
                    {form.submissionCount > 0 ? (
                      <Badge variant="seal" className="text-[10px] px-2 py-0.5">
                        {form.submissionCount} sealed
                      </Badge>
                    ) : (
                      <Badge variant="default" className="text-[10px] px-2 py-0.5 opacity-60">
                        No submissions
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* ── Subtle footer note ───────────────────────────────────────────────── */}
      {forms.length > 0 && (
        <motion.p
          className="mt-10 text-center text-xs text-muted-foreground/50 leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          All submissions are stored onchain on Monad Testnet.
          Personal data is sealed until you open it — nobody else can.
        </motion.p>
      )}
    </div>
  );
}
