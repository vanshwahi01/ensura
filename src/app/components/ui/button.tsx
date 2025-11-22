import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    
    const variantStyles = {
      default: "bg-coral text-white shadow-lg hover:bg-coral-dark hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200",
      outline: "border-2 border-teal bg-transparent text-teal hover:bg-teal hover:text-white",
    }
    
    const sizeStyles = {
      default: "h-10 px-4 py-2 text-sm",
      sm: "h-9 rounded-md px-3 text-sm",
      lg: "h-14 rounded-md px-8 text-base",
      icon: "h-10 w-10",
    }

    return (
      <button
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
