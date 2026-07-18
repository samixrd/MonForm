"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ConfirmationCard } from "@/components/ConfirmationCard";
import { EncryptingSeal } from "@/components/EncryptingSeal";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { getSubmitters, submitForm } from "@/lib/api";
import { encryptFormValues, type EncryptedPayload } from "@/lib/encryption";
import { monadTestnet } from "@/lib/wagmi";
import { wait } from "@/lib/utils";
import type { Form, Submission } from "@/lib/types";
import { uploadToStorage } from "@/lib/storage";

interface SubmissionFormProps {
  form: Form;
  onSubmitted?: () => void;
}

/** Floor for the encrypting micro-interaction — brief, never longer. */
const ENCRYPT_DURATION_MS = 1300;

function explorerTxUrl(txHash: string): string {
  return `${monadTestnet.blockExplorers.default.url}/tx/${txHash}`;
}

/**
 * Applicant-facing form. Fields stay visible but locked until a wallet is
 * connected; once connected, checks whether this wallet already has a
 * submission on record before allowing edits. Submitting encrypts values
 * client-side to the owner's public key — plaintext never leaves this
 * component.
 */
export function SubmissionForm({ form, onSubmitted }: SubmissionFormProps) {
  const { address, isConnected } = useAccount();

  const [values, setValues] = useState<Record<string, string>>({});
  const [checkState, setCheckState] = useState<"idle" | "checking" | "checked">("idle");
  const [existingSubmission, setExistingSubmission] = useState<Submission | null>(null);
  const [submitState, setSubmitState] = useState<"idle" | "encrypting" | "submitted">("idle");
  const [newSubmission, setNewSubmission] = useState<Submission | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected || !address) {
      setCheckState("idle");
      setExistingSubmission(null);
      return;
    }

    let cancelled = false;
    setCheckState("checking");

    getSubmitters(form.id).then((submissions) => {
      if (cancelled) return;
      const match = submissions.find(
        (s) => s.submitterAddress.toLowerCase() === address.toLowerCase(),
      );
      setExistingSubmission(match ?? null);
      setCheckState("checked");
    });

    return () => {
      cancelled = true;
    };
  }, [isConnected, address, form.id]);

  const locked = !isConnected || checkState === "checking" || submitState === "encrypting";
  const isValid = form.fields.every(
    (field) => !field.required || (values[field.id] ?? "").trim().length > 0,
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!address || !isValid) return;

    setErrorMessage(null);
    setSubmitState("encrypting");
    try {
      const [submission] = await Promise.all([
        (async () => {
          const encrypted = encryptFormValues(form.ownerPubKey, values);
          const encryptedCID = await uploadToStorage(encrypted);
          return submitForm({ formId: form.id, submitterAddress: address, encryptedCID });
        })(),
        wait(ENCRYPT_DURATION_MS),
      ]);
      setNewSubmission(submission);
      setSubmitState("submitted");
      onSubmitted?.();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Couldn't submit. Try again.");
      setSubmitState("idle");
    }
  }

  if (submitState === "submitted" && newSubmission) {
    return (
      <ConfirmationCard
        title="Response sealed"
        description="Your answers are encrypted onchain, readable only by the form owner's wallet."
        details={[
          {
            label: "Transaction",
            value: newSubmission.txHash,
            href: explorerTxUrl(newSubmission.txHash),
          },
        ]}
      />
    );
  }

  if (checkState === "checked" && existingSubmission) {
    return (
      <ConfirmationCard
        title="Already sealed"
        description="You've already sealed a response for this form."
        details={[
          {
            label: "Transaction",
            value: existingSubmission.txHash,
            href: explorerTxUrl(existingSubmission.txHash),
          },
        ]}
      />
    );
  }

  return (
    <Card>
      <CardContent className="space-y-5 pt-6">
        {!isConnected && (
          <div className="flex flex-col items-center gap-3 rounded-lg bg-ink/40 px-4 py-5 text-center hairline">
            <p className="text-sm text-muted-foreground">Connect your wallet to fill this out.</p>
            <WalletConnectButton />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <fieldset disabled={locked} className="space-y-5 disabled:opacity-60">
            {form.fields.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id}>
                  {field.label}
                  {field.required && <span className="text-brass"> *</span>}
                </Label>
                <Input
                  id={field.id}
                  type={field.type === "email" ? "email" : field.type === "url" ? "url" : "text"}
                  required={field.required}
                  value={values[field.id] ?? ""}
                  onChange={(event) =>
                    setValues((prev) => ({ ...prev, [field.id]: event.target.value }))
                  }
                />
              </div>
            ))}
          </fieldset>

          {submitState === "encrypting" ? (
            <EncryptingSeal />
          ) : (
            <div className="space-y-2">
              <Button variant="seal" type="submit" className="w-full" disabled={locked || !isValid}>
                Encrypt &amp; submit onchain
              </Button>
              {errorMessage && (
                <p className="text-center text-xs text-destructive/90">{errorMessage}</p>
              )}
            </div>
          )}
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Encrypted in your browser to the form owner's wallet. Only they can read it.
        </p>
      </CardContent>
    </Card>
  );
}
