import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Button variants map directly to MonForm's color vocabulary:
 *  - `seal` (brass) is reserved for the product's ceremonial actions —
 *    connect wallet, decrypt/unseal, confirm a key. Don't reach for it
 *    as a general-purpose primary button; that dilutes the signal.
 *  - `default` is the everyday action button — quiet, still confident.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium tracking-wide transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-secondary/50 text-foreground hover:bg-secondary/70 hairline",
        seal: "bg-brass text-ink hover:bg-brass-soft shadow-seal font-medium",
        outline: "border border-secondary/40 text-foreground hover:bg-secondary/15 bg-transparent",
        ghost: "text-muted-foreground hover:text-foreground hover:bg-secondary/15",
        link: "text-brass underline-offset-4 hover:underline",
        destructive: "bg-destructive/15 text-destructive hover:bg-destructive/25 hairline",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-md px-3.5 text-xs",
        lg: "h-12 rounded-lg px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
