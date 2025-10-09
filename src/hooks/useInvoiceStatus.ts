import { useMemo } from "react";

interface InvoiceWithDueDate {
    dueDate: Date | string;
}

interface InvoiceStatusResult {
    isLate: boolean;
    daysLate: number;
    statusColor: 'red' | 'orange';
    borderColor: string;
    bgColor: string;
    hoverBgColor: string;
    textColor: string;
}

export function useInvoiceStatus(invoice: InvoiceWithDueDate): InvoiceStatusResult {
    return useMemo(() => {
        const now = new Date();
        const dueDate = new Date(invoice.dueDate);
        const diffTime = now.getTime() - dueDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isLate = diffDays > 0;
        const statusColor = isLate ? 'red' : 'orange';

        return {
            isLate,
            daysLate: diffDays,
            statusColor,
            borderColor: isLate ? 'border-red-500' : 'border-orange-500',
            bgColor: isLate ? 'bg-red-50' : 'bg-orange-50',
            hoverBgColor: isLate ? 'hover:bg-red-50/75' : 'hover:bg-orange-50/75',
            textColor: isLate ? 'text-red-600' : 'text-orange-600'
        };
    }, [invoice.dueDate]);
}
