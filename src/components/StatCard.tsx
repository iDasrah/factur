import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import Card from "./Card";

interface StatCardProps {
    title: string;
    icon: LucideIcon;
    value: number | string;
    valueColor?: string;
    action?: ReactNode;
}

const StatCard = ({ 
    title, 
    icon: Icon, 
    value, 
    valueColor = "text-blue-500",
    action 
}: StatCardProps) => {
    return (
        <Card variant="stat" className="flex-1">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Icon 
                        size={32} 
                        strokeWidth={1} 
                        className="text-blue-600 rounded-lg bg-blue-100 p-1" 
                    />
                    <h3 className="text-lg font-semibold">{title}</h3>
                </div>
                {action && (
                    <div className="active:bg-gray-100 p-1 rounded-full transition-colors duration-150">
                        {action}
                    </div>
                )}
            </div>
            <p className={`text-3xl mt-6 ${valueColor}`}>{value}</p>
        </Card>
    );
};

export default StatCard;
