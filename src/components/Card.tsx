import type { ReactNode } from "react";

interface CardProps {
    children: ReactNode;
    className?: string;
    variant?: "section" | "document" | "stat" | "base";
    asChild?: boolean;
    hover?: boolean;
}

const Card = ({ 
    children, 
    className = "", 
    variant = "base",
    hover = false 
}: CardProps) => {
    const baseClasses = "bg-white rounded-lg border";
    
    const variantClasses = {
        base: "border-gray-100 p-4",
        section: "border-gray-100 p-4",
        document: "border-gray-200 bg-gray-50 p-4 block",
        stat: "border-gray-100 p-4"
    };

    const hoverClasses = hover 
        ? "hover:shadow-md hover:border-blue-300 transition-all" 
        : "";

    const documentHoverClasses = variant === "document" 
        ? "hover:bg-gray-100 transition-colors" 
        : "";

    const classes = `${baseClasses} ${variantClasses[variant]} ${hoverClasses} ${documentHoverClasses} ${className}`;

    return (
        <div className={classes}>
            {children}
        </div>
    );
};

export default Card;
