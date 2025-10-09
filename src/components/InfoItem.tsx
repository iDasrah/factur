import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface InfoItemProps {
    icon: LucideIcon;
    children: ReactNode;
    iconSize?: number;
    className?: string;
}

const InfoItem = ({ icon: Icon, children, iconSize = 16, className = "" }: InfoItemProps) => {
    return (
        <div className={`flex items-start gap-2 text-gray-600 ${className}`}>
            <Icon size={iconSize} className="mt-0.5 flex-shrink-0" />
            <div className="flex-1">{children}</div>
        </div>
    );
};

export default InfoItem;
