type ActivityType = 'CUSTOMER' | 'QUOTE' | 'INVOICE';

interface Activity {
    type: string;
    customerId?: string | null;
    quoteId?: string | null;
    invoiceId?: string | null;
}

interface ActivityLink {
    to: '/customers/$customerId' | '/quotes/$quoteId' | '/invoices/$invoiceId';
    params: { customerId: string } | { quoteId: string } | { invoiceId: string };
}

export function getActivityLink(activity: Activity): ActivityLink | null {
    const activityType = activity.type.split('_')[0] as ActivityType;

    switch (activityType) {
        case 'CUSTOMER':
            return activity.customerId ? {
                to: '/customers/$customerId' as const,
                params: { customerId: activity.customerId }
            } : null;
        
        case 'QUOTE':
            return activity.quoteId ? {
                to: '/quotes/$quoteId' as const,
                params: { quoteId: activity.quoteId }
            } : null;
        
        case 'INVOICE':
            return activity.invoiceId ? {
                to: '/invoices/$invoiceId' as const,
                params: { invoiceId: activity.invoiceId }
            } : null;
        
        default:
            return null;
    }
}

export function getActivityIdentifier(activity: Activity & {
    quote?: { num: string } | null;
    invoice?: { num: string } | null;
    customer?: { name: string; id: string } | null;
}): string {
    return activity.quote?.num 
        || activity.invoice?.num 
        || activity.customer?.name 
        || activity.customer?.id 
        || '';
}
