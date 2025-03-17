
import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "success" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  glow?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = "primary", 
    size = "md", 
    isLoading = false, 
    disabled, 
    children, 
    leftIcon, 
    rightIcon, 
    glow = false,
    ...props 
  }, ref) => {
    const baseClasses = "relative inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variantClasses = {
      primary: "bg-gaming-accent-blue hover:bg-gaming-accent-blue-hover text-white focus:ring-blue-500",
      secondary: "bg-gaming-bg-card hover:bg-opacity-80 text-white border border-gaming-border focus:ring-blue-500",
      outline: "bg-transparent text-white border border-gaming-border hover:bg-gaming-bg-card focus:ring-gray-500",
      ghost: "bg-transparent hover:bg-gaming-bg-card text-gaming-text-secondary hover:text-white focus:ring-gray-500",
      success: "bg-gaming-success hover:bg-opacity-90 text-white focus:ring-green-500",
      danger: "bg-gaming-danger hover:bg-opacity-90 text-white focus:ring-red-500"
    };
    
    const sizeClasses = {
      sm: "text-xs px-3 py-1.5",
      md: "text-sm px-4 py-2",
      lg: "text-base px-6 py-3"
    };
    
    const glowClasses = {
      primary: glow ? "shadow-blue-glow" : "",
      secondary: "",
      outline: "",
      ghost: "",
      success: glow ? "shadow-green-glow" : "",
      danger: glow ? "shadow-[0_0_15px_rgba(239,68,68,0.5)]" : ""
    };
    
    return (
      <button
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          glowClasses[variant],
          "transform active:scale-95 transition-transform",
          className
        )}
        disabled={isLoading || disabled}
        ref={ref}
        {...props}
      >
        {isLoading && (
          <svg 
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            ></circle>
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        
        {!isLoading && leftIcon && (
          <span className="mr-2">{leftIcon}</span>
        )}
        
        {children}
        
        {!isLoading && rightIcon && (
          <span className="ml-2">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
