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
 "bg-amber-500 text-white font-semibold shadow-md hover:bg-amber-600 hover:shadow-lg active:scale-[0.98]",
 destructive:
 "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20",
 outline:
 "border-2 border-stone-300 bg-white text-stone-800 font-semibold hover:border-stone-400 hover:bg-stone-50",
 secondary:
 "bg-stone-800 text-white font-semibold hover:bg-stone-700",
 ghost:
 "text-stone-700 hover:bg-stone-100 hover:text-stone-900",
 link:
 "text-amber-600 underline-offset-4 hover:underline font-semibold",
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
