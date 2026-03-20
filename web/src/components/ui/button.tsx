import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
 "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 select-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
 {
 variants: {
 variant: {
 default:
 "bg-gradient-to-br from-primary to-primary-dark text-white shadow-glow hover:shadow-glow-lg hover:scale-[1.02] active:scale-100 active:shadow-none",
 destructive:
 "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20",
 outline:
 "border border-border bg-background hover:bg-secondary hover:border-primary/20",
 secondary:
 "bg-secondary text-secondary-foreground hover:bg-secondary/80",
 ghost:
 "hover:bg-secondary hover:text-foreground",
 link:
 "text-primary underline-offset-4 hover:underline",
 },
 size: {
 default: "h-10 px-5 py-2",
 sm: "h-8 gap-1.5 rounded-md px-4 text-xs",
 lg: "h-12 rounded-lg px-8 text-base",
 icon: "size-10",
 },
 },
 defaultVariants: {
 variant: "default",
 size: "default",
 },
 }
)

function Button({
 className,
 variant,
 size,
 asChild = false,
 ...props
}: React.ComponentProps<"button"> &
 VariantProps<typeof buttonVariants> & {
 asChild?: boolean
 }) {
 const Comp = asChild ? Slot.Root : "button"

 return (
 <Comp
 data-slot="button"
 className={cn(buttonVariants({ variant, size, className }))}
 {...props}
 />
 )
}

export { Button, buttonVariants }
