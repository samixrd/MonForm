import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

/** SHELL — presentational only, ready to drop into a landing feature grid. */
export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/20">
          <Icon className="h-5 w-5 text-brass" strokeWidth={1.75} />
        </div>
        <h3 className="font-display text-lg font-medium">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
