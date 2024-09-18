import { cn } from "@/src/lib/utils";
import { cva, VariantProps } from "class-variance-authority";
import React from "react";

const containerVariants = cva(
  "mx-auto px-4",
  {
    variants: {
      size: {
        default: "",
        sm: "max-w-screen-sm",
        md: "max-w-screen-md",
        lg: "max-w-screen-lg",
        xl: "max-w-screen-xl",
      }
    },
    defaultVariants: {},
  }
);

export interface ContainerProps
  extends React.ButtonHTMLAttributes<HTMLDivElement>,
  VariantProps<typeof containerVariants> {
  asChild?: boolean
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size, asChild = false, ...props }, ref) => {
    const Comp = "div"
    return (
      <Comp
        className={cn(containerVariants({ size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Container.displayName = "Container"

export { Container, containerVariants };
