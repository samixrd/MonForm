"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Secondary hero CTA. Starts as a plain button; on click it swaps for an
 * inline field so a returning applicant can drop in a form ID (or paste a
 * full /form/[id] link) and jump straight there — no separate page, no
 * modal, just an inline reveal.
 */
export function FormLinkEntry() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function extractId(raw: string): string {
    const trimmed = raw.trim();
    const match = trimmed.match(/\/form\/([^/?#]+)/);
    return match?.[1] || trimmed;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const id = extractId(value);
    if (!id) return;
    router.push(`/form/${id}`);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      setValue("");
    }
  }

  if (!open) {
    return (
      <Button variant="outline" size="lg" onClick={() => setOpen(true)}>
        I have a form link
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      aria-label="Go to a form by ID or link"
      className="flex w-full max-w-xs animate-fade-up items-center gap-2 sm:w-auto"
    >
      <Input
        ref={inputRef}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Form ID or link"
        aria-label="Form ID or link"
        className="h-12"
      />
      <Button type="submit" size="lg" variant="outline" aria-label="Go to form" disabled={!value.trim()}>
        <ArrowRight className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="lg"
        variant="ghost"
        aria-label="Cancel"
        onClick={() => {
          setOpen(false);
          setValue("");
        }}
      >
        <X className="h-4 w-4" />
      </Button>
    </form>
  );
}
