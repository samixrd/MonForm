"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { ListPlus, Plus, Wallet } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FieldEditor } from "@/components/FieldEditor";
import { FormPreview } from "@/components/FormPreview";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmationCard } from "@/components/ConfirmationCard";
import { SealingIndicator } from "@/components/SealingIndicator";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { getWalletEncryptionPublicKey } from "@/lib/encryption";
import { createForm } from "@/lib/api";
import { wait } from "@/lib/utils";
import type { Form, FormField } from "@/lib/types";

/** Minimum time the sealing micro-interaction stays on screen, so it never
 * flashes past even if the wallet + contract resolve instantly. */
const SEAL_DURATION_MS = 650;

function defaultFields(): FormField[] {
  return [
    { id: crypto.randomUUID(), label: "Name", type: "text", required: true },
    { id: crypto.randomUUID(), label: "Email", type: "email", required: true },
    { id: crypto.randomUUID(), label: "X / Twitter handle", type: "text", required: false },
  ];
}

export function FormBuilder() {
  const { address, isConnected } = useAccount();

  const [name, setName] = useState("");
  const [fields, setFields] = useState<FormField[]>(defaultFields);
  const [publishState, setPublishState] = useState<"idle" | "sealing" | "done">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [publishedForm, setPublishedForm] = useState<Form | null>(null);

  function updateField(updated: FormField) {
    setFields((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
  }

  function removeField(id: string) {
    setFields((prev) => prev.filter((f) => f.id !== id));
  }

  function addField() {
    setFields((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: "New field", type: "text", required: false },
    ]);
  }

  const isValid = name.trim().length > 0 && fields.length > 0 && fields.every((f) => f.label.trim().length > 0);

  async function handlePublish() {
    if (!address || !isValid) return;
    setErrorMessage(null);
    setPublishState("sealing");
    try {
      const [ownerPubKey] = await Promise.all([
        getWalletEncryptionPublicKey(address),
        wait(SEAL_DURATION_MS),
      ]);
      const form = await createForm({
        name: name.trim(),
        ownerAddress: address,
        ownerPubKey,
        fields,
      });
      setPublishedForm(form);
      setPublishState("done");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Couldn't publish. Try again.");
      setPublishState("idle");
    }
  }

  if (!isConnected) {
    return (
      <EmptyState
        icon={Wallet}
        title="Connect your wallet"
        description="MonForm ties every form to the wallet that creates it — connect yours to start building. Applicants will encrypt their answers straight to it."
        action={<WalletConnectButton />}
      />
    );
  }

  if (publishState === "done" && publishedForm) {
    const shareLink = `${typeof window !== "undefined" ? window.location.origin : ""}/form/${publishedForm.id}`;
    return (
      <ConfirmationCard
        title="Form sealed"
        description="Your allowlist is live onchain. Share the link below — every submission encrypts straight to your wallet."
        details={[
          { label: "Shareable link", value: shareLink, truncate: false },
          { label: "Owner wallet", value: publishedForm.ownerAddress },
        ]}
        actionLabel="View form"
        actionHref={`/form/${publishedForm.id}`}
      />
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
      <Card>
        <CardHeader>
          <CardTitle>New allowlist form</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <fieldset disabled={publishState === "sealing"} className="space-y-6 disabled:opacity-60">
            <div className="space-y-2">
              <Label htmlFor="form-name">Form name</Label>
              <Input
                id="form-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Genesis Allowlist"
              />
            </div>

            <div className="space-y-2">
              <Label>Fields</Label>
              {fields.length === 0 ? (
                <EmptyState
                  icon={ListPlus}
                  title="No fields yet"
                  description="Add at least one field so applicants know what to submit."
                  action={
                    <Button variant="outline" size="sm" onClick={addField}>
                      <Plus className="h-3.5 w-3.5" />
                      Add field
                    </Button>
                  }
                  className="py-10"
                />
              ) : (
                <>
                  <div className="space-y-2">
                    {fields.map((field) => (
                      <FieldEditor
                        key={field.id}
                        field={field}
                        onChange={updateField}
                        onRemove={() => removeField(field.id)}
                      />
                    ))}
                  </div>
                  <Button variant="ghost" size="sm" onClick={addField}>
                    <Plus className="h-3.5 w-3.5" />
                    Add field
                  </Button>
                </>
              )}
            </div>
          </fieldset>

          {publishState === "sealing" ? (
            <SealingIndicator />
          ) : (
            <div className="space-y-2">
              <Button variant="seal" className="w-full" disabled={!isValid} onClick={handlePublish}>
                Publish Form
              </Button>
              {errorMessage && <p className="text-center text-xs text-destructive/90">{errorMessage}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="lg:sticky lg:top-24">
        <FormPreview name={name} fields={fields} />
      </div>
    </div>
  );
}
