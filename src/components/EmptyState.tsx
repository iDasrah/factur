import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
    icon: LucideIcon;
    message: string | ReactNode;
    className?: string;
    iconSize?: number;
}

const EmptyState = ({ icon: Icon, message, className = "", iconSize = 48 }: EmptyStateProps) => {
    return (
        <div className={`text-center py-12 ${className}`}>
            <Icon className="mx-auto text-gray-300 mb-3" size={iconSize} />
            <p className="text-gray-400">{message}</p>
        </div>
    );
};

export default EmptyState;
