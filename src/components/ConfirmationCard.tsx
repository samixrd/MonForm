import { Stamp, Copy, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, truncateHex } from "@/lib/utils";

interface ConfirmationDetail {
  label: string;
  value: string;
  /** Renders in the mono "data face" and truncates like an address/hash. Defaults to true. */
  isData?: boolean;
  /** Set false to show the full value instead of a leading…trailing truncation (e.g. a link). Only relevant when isData is true. Defaults to true. */
  truncate?: boolean;
  /** If set, the displayed value is itself a link (e.g. a tx hash to the explorer), shown alongside the copy button. */
  href?: string;
}

interface ConfirmationCardProps {
  title: string;
  description: string;
  details: ConfirmationDetail[];
  actionLabel?: string;
  actionHref?: string;
  className?: string;
}

/**
 * The card a person sees once something has been committed onchain —
 * a submission recorded, a key confirmed. It's the product's one moment
 * to feel ceremonial rather than merely successful, so it's the only other
 * place (besides the unseal animation itself) that reaches for the full
 * brass treatment.
 */
export function ConfirmationCard({
  title,
  description,
  details,
  actionLabel,
  actionHref,
  className,
}: ConfirmationCardProps) {
  return (
    <Card className={cn("animate-fade-up overflow-hidden", className)}>
      <div className="bg-brass-hairline h-px w-full" />
      <CardContent className="flex flex-col items-center gap-5 pt-10 text-center">
        <div className="seal-glow flex h-14 w-14 items-center justify-center rounded-full bg-brass/12">
          <Stamp className="h-6 w-6 text-brass" strokeWidth={1.75} />
        </div>

        <div className="space-y-1.5">
          <h3 className="font-display text-2xl font-medium">{title}</h3>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>

        <dl className="w-full space-y-2.5 rounded-lg bg-ink/40 px-4 py-4 text-left hairline">
          {details.map((detail) => (
            <div key={detail.label} className="flex items-center justify-between gap-4">
              <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                {detail.label}
              </dt>
              <dd
                className={cn(
                  "flex items-center gap-1.5 text-sm text-foreground/90",
                  detail.isData !== false && "font-data",
                )}
              >
                {(() => {
                  const text =
                    detail.isData !== false
                      ? detail.truncate === false
                        ? detail.value
                        : truncateHex(detail.value, 6, 6)
                      : detail.value;
                  return detail.href ? (
                    <a
                      href={detail.href}
                      target="_blank"
                      rel="noreferrer"
                      className="underline-offset-2 hover:text-brass hover:underline"
                    >
                      {text}
                    </a>
                  ) : (
                    text
                  );
                })()}
                {detail.isData !== false && (
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(detail.value)}
                    className="text-muted-foreground/70 transition-colors hover:text-brass"
                    aria-label={`Copy ${detail.label}`}
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                )}
              </dd>
            </div>
          ))}
        </dl>

        {actionLabel && actionHref && (
          <Button variant="outline" size="sm" asChild>
            <a href={actionHref} target="_blank" rel="noreferrer">
              {actionLabel}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
