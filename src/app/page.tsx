import { Fingerprint, FileLock2, Zap, Wallet, RadioTower } from "lucide-react";
import Link from "next/link";
import { Hero } from "@/components/Hero";
import { FeatureCard } from "@/components/FeatureCard";
import { FormLinkEntry } from "@/components/FormLinkEntry";
import { AmbientTexture } from "@/components/AmbientTexture";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="relative">
      <AmbientTexture />

      <div className="container relative">
        <Hero
          title="The Allowlist That Can't Leak"
          subtitle="Every submission lives onchain on Monad. Every identity stays sealed until you choose to open it."
        >
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Button variant="seal" size="lg" asChild>
              <Link href="/create">Create a Form</Link>
            </Button>
            <FormLinkEntry />
          </div>

          {/* Warning pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-400 font-medium">
              <Wallet className="h-3 w-3 shrink-0" />
              Connect your wallet before creating a form
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs text-purple-400 font-medium">
              <RadioTower className="h-3 w-3 shrink-0" />
              Live on Monad Testnet only
            </span>
          </div>
        </Hero>

        <section className="grid gap-4 pb-24 sm:grid-cols-3">
          <FeatureCard
            icon={Fingerprint}
            title="Onchain &amp; Sybil-Proof"
            description="One wallet, one submission. The full allowlist is public and verifiable on Monad — no spreadsheet, no edits after the fact."
          />
          <FeatureCard
            icon={FileLock2}
            title="Sealed by Default"
            description="Names, emails, and socials are encrypted in the applicant's browser before they ever leave the device. Only you can open them."
          />
          <FeatureCard
            icon={Zap}
            title="Built for Monad"
            description="Every submission is an independent onchain write — exactly the kind of parallel, high-throughput workload Monad is built for."
          />
        </section>
      </div>
    </div>
  );
}
