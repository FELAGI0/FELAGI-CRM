import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-control border border-border bg-surface px-2.5 py-1 text-base text-text-primary transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-text-primary placeholder:text-text-secondary hover:border-text-secondary/40 focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-accent/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-status-lost aria-invalid:ring-3 aria-invalid:ring-status-lost/20 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }