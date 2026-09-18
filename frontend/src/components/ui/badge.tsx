import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

/**
 * Variants map onto the theme tokens declared in src/index.css (@theme), so the
 * status-* variants stay in sync with --color-status-*. Tailwind v4 derives
 * `bg-status-new`, `text-accent` etc. directly from those custom properties.
 */
const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-badge border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-accent focus-visible:ring-[3px] focus-visible:ring-accent/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-status-lost aria-invalid:ring-status-lost/20 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-accent-subtle text-accent [a]:hover:bg-accent-subtle/80",
        secondary:
          "bg-surface-hover text-text-primary [a]:hover:bg-surface-hover/80",
        destructive:
          "bg-status-lost/10 text-status-lost focus-visible:ring-status-lost/20 [a]:hover:bg-status-lost/20",
        outline:
          "border-border text-text-primary [a]:hover:bg-surface-hover [a]:hover:text-text-secondary",
        ghost:
          "hover:bg-surface-hover hover:text-text-secondary",
        link: "text-accent underline-offset-4 hover:underline",
        new: "bg-status-new/10 text-status-new",
        in_progress: "bg-status-in-progress/10 text-status-in-progress",
        won: "bg-status-won/10 text-status-won",
        lost: "bg-status-lost/10 text-status-lost",
        todo: "bg-status-todo/10 text-status-todo",
        done: "bg-status-done/10 text-status-done",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }