import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-lg border-2 border-teal/20 bg-white/90 backdrop-blur-sm px-5 py-3 text-base text-gray-900 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

