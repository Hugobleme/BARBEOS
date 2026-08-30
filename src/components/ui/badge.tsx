import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-medium tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-white hover:text-black",
        secondary: "border-transparent bg-secondary/80 text-secondary-foreground hover:bg-secondary",
        destructive: "border-transparent bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20",
        outline: "text-foreground border-border/50 bg-background/50 backdrop-blur-sm",
        premium: "border-accent/20 bg-accent/10 text-accent hover:bg-accent/20 uppercase tracking-widest text-[10px]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
