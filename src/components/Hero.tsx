import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface HeroProps {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function Hero({
  eyebrow = "Onchain on Monad",
  title = "A sealed record for who's allowed in.",
  subtitle = "Applicants submit onchain. Their data stays encrypted until you open it.",
  children,
}: HeroProps) {
  return (
    <section className="flex flex-col items-center gap-6 py-24 text-center">
      {/* Brand logo */}
      <div className="mb-2">
        <Image
          src="/logo.png"
          alt="MonForm"
          width={72}
          height={72}
          className="rounded-2xl shadow-lg shadow-black/30"
          priority
        />
      </div>

      <Badge variant="seal">
        <ShieldCheck className="h-3 w-3" />
        {eyebrow}
      </Badge>
      <h1 className="max-w-2xl font-display text-4xl font-medium sm:text-5xl">{title}</h1>
      <p className="max-w-md text-base text-muted-foreground">{subtitle}</p>
      {children}
    </section>
  );
}
