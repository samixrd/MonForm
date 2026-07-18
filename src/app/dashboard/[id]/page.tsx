"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import {
  ArrowLeft,
  Users,
  Shield,
  Lock,
  Loader2,
  FileText,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { SubmitterRow } from "@/components/SubmitterRow";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { getForm, getSubmitters, getSubmission } from "@/lib/api";
import { decryptFormValues } from "@/lib/encryption";
import { formatTimestamp, truncateHex } from "@/lib/utils";
import type { Form, Submission, DecryptedResponse } from "@/lib/types";

/**
 * Individual form view — the payoff screen for the MonForm demo.
 *
 * Shows a form header with submission count + "public allowlist" badge, then
 * a table of SubmitterRows where each one can be individually unsealed by the
 * form owner's wallet. The unseal triggers SealAnimation's crack-and-bloom —
 * the one place in the product where real animation budget is spent.
 *
 * The onchain transparency note reminds the owner (and any observers of the
 * demo) that the address list is public while the payload stays sealed.
 */
export default function FormDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const formId = Number(id);
  const { address, isConnected } = useAccount();

  const [form, setForm] = useState<Form | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [decrypted, setDecrypted] = useState<Record<string, DecryptedResponse>>({});
  const [loadingForm, setLoadingForm] = useState(true);
  const [decryptError, setDecryptError] = useState<string | null>(null);

  useEffect(() => {
    setLoadingForm(true);
    Promise.all([getForm(formId), getSubmitters(formId)]).then(([f, subs]) => {
      setForm(f);
      setSubmissions(subs);
      setLoadingForm(false);
    });
  }, [formId]);

  async function handleDecrypt(submitterAddress: string) {
    if (!address) return;
    setDecryptError(null);
    const submission = await getSubmission(formId, submitterAddress);
    if (!submission) {
      setDecryptError("Submission data not found on Irys.");
      return;
    }
    try {
      const values = await decryptFormValues(address, submission.ciphertext as any);
      setDecrypted((prev) => ({
        ...prev,
        [submitterAddress]: {
          submitterAddress,
          values,
          decryptedAt: Math.floor(Date.now() / 1000),
        },
      }));
    } catch (err) {
      setDecryptError(
        err instanceof Error ? err.message : "Decryption failed. Make sure you're using the owner wallet.",
      );
    }
  }

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loadingForm) {
    return (
      <div className="container max-w-3xl py-24 flex flex-col items-center gap-4">
        <Loader2 className="h-6 w-6 text-brass animate-spin" />
        <p className="text-sm text-muted-foreground">Loading form…</p>
      </div>
    );
  }

  // ── Not found ──────────────────────────────────────────────────────────────
  if (!form) {
    return (
      <div className="container max-w-3xl py-16">
        <EmptyState
          icon={FileText}
          title="Form not found"
          description="This form doesn't exist or you don't have access to it."
          action={
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard">← Back to dashboard</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const unsealedCount = Object.keys(decrypted).length;

  return (
    <div className="container max-w-3xl py-12">
      {/* ── Back nav ──────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Dashboard
        </Link>
      </motion.div>

      {/* ── Form header ─────────────────────────────────────────────────────── */}
      <motion.div
        className="mb-10 space-y-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brass/10 seal-glow">
            <Lock className="h-5 w-5 text-brass" strokeWidth={1.75} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-3xl font-medium leading-tight">{form.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Created {formatTimestamp(form.createdAt)}
            </p>
          </div>
        </div>

        {/* Stat badges row */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="default" className="gap-1.5 text-sm px-3 py-1.5">
            <Users className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{submissions.length}</span>
            <span className="text-muted-foreground">
              submission{submissions.length === 1 ? "" : "s"}
            </span>
          </Badge>

          <Badge variant="seal" className="gap-1.5 text-sm px-3 py-1.5">
            <Shield className="h-3.5 w-3.5" />
            Public allowlist
          </Badge>

          <Badge variant="default" className="gap-1.5 text-sm px-3 py-1.5">
            <FileText className="h-3.5 w-3.5" />
            {form.fields.length} field{form.fields.length === 1 ? "" : "s"}
          </Badge>

          {unsealedCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Badge variant="success" className="gap-1.5 text-sm px-3 py-1.5">
                ✦ {unsealedCount} unsealed
              </Badge>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* ── Onchain transparency note ─────────────────────────────────────────── */}
      <motion.div
        className="mb-8 flex items-start gap-3 rounded-xl border border-brass/20 bg-brass/5 px-4 py-3.5"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Shield className="h-4 w-4 text-brass shrink-0 mt-0.5" strokeWidth={1.75} />
        <p className="text-sm text-foreground/75 leading-relaxed">
          <span className="text-brass font-medium">This address list is public and onchain-verifiable.</span>
          {" "}Personal data stays sealed until you open it — nobody else can.
          Each payload is encrypted to your wallet's public key and stored on IPFS;
          the ciphertext is what lives onchain.
        </p>
      </motion.div>

      {/* ── Not connected warning ────────────────────────────────────────────── */}
      {!isConnected && submissions.length > 0 && (
        <motion.div
          className="mb-6 flex flex-col items-start gap-3 rounded-xl border border-secondary/30 bg-secondary/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <p className="text-sm text-muted-foreground">
            Connect the owner wallet to unseal submissions.
          </p>
          <WalletConnectButton />
        </motion.div>
      )}

      {/* ── Decrypt error banner ─────────────────────────────────────────────── */}
      {decryptError && (
        <motion.div
          className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-sm text-destructive leading-snug">
            <span className="font-medium">Decryption failed — </span>
            {decryptError}
          </p>
        </motion.div>
      )}

      {/* ── Submissions table ─────────────────────────────────────────────────── */}
      {submissions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <EmptyState
            icon={Users}
            title="No submissions yet"
            description="Share your form link — submissions appear here as they come in onchain."
          />
        </motion.div>
      ) : (
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {/* Table column headers */}
          <div className="grid grid-cols-[1fr_auto] px-5 mb-1">
            <div className="flex items-center gap-6">
              <span className="text-xs text-muted-foreground/60 uppercase tracking-wider font-medium">
                Submitter
              </span>
            </div>
            <span className="text-xs text-muted-foreground/60 uppercase tracking-wider font-medium pr-1">
              Reveal
            </span>
          </div>

          {submissions.map((submission, i) => (
            <motion.div
              key={submission.submitterAddress}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            >
              <SubmitterRow
                submission={submission}
                onDecrypt={handleDecrypt}
                decrypted={decrypted[submission.submitterAddress] ?? null}
                fields={form.fields}
              />
            </motion.div>
          ))}

          {/* Submission count footer */}
          <motion.div
            className="flex items-center justify-between pt-2 pb-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-xs text-muted-foreground/50">
              {submissions.length} address{submissions.length === 1 ? "" : "es"} on record ·{" "}
              <span className="font-data">
                {truncateHex(form.ownerAddress)}
              </span>{" "}
              is the owner
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/50">
              <Clock className="h-3 w-3" />
              Live on Monad Testnet
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
