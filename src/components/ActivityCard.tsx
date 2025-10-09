import { Link } from "@tanstack/react-router";
import { getActivityIdentifier, getActivityLink } from "@/lib/activityHelpers";
import { activityIcons, activityText } from "@/lib/constants";
import { formatRelativeDate } from "@/lib/utils";

interface ActivityCardProps {
    activity: {
        id: string;
        type: string;
        createdAt: Date | string;
        customerId?: string | null;
        quoteId?: string | null;
        invoiceId?: string | null;
        quote?: { num: string } | null;
        invoice?: { num: string } | null;
        customer?: { name: string; id: string } | null;
    };
}

export const ActivityCard = ({ activity }: ActivityCardProps) => {
    const linkConfig = getActivityLink(activity);
    
    if (!linkConfig) return null;

    const ActivityIcon = activityIcons[activity.type as keyof typeof activityIcons].icon;
    const iconClassName = activityIcons[activity.type as keyof typeof activityIcons].className;
    const identifier = getActivityIdentifier(activity);

    return (
        <Link 
            to={linkConfig.to} 
            params={linkConfig.params} 
            key={activity.id}
            className="list-item-card flex items-center gap-3"
        >
            <ActivityIcon className={iconClassName} size={20} />
            <div className="flex-1">
                <p className="text-value">
                    {activityText[activity.type as keyof typeof activityText](identifier)}
                </p>
                <p className="text-muted"></p>
            </div>
            <span className="text-xs text-gray-400">
                {formatRelativeDate(new Date(activity.createdAt))}
            </span>
        </Link>
    );
}
