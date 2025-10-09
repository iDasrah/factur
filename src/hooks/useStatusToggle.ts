import type { InvoiceStatus, QuoteStatus } from "@prisma/client";
import { useRouter } from "@tanstack/react-router";

interface QuoteSearchParams {
    quoteSearch?: string;
    quoteStatus?: QuoteStatus[];
    invoiceSearch?: string;
    invoiceStatus?: InvoiceStatus[];
}

export function useQuoteStatusToggle(
    currentStatuses: QuoteStatus[],
    searchParams: QuoteSearchParams
) {
    const router = useRouter();

    return (status: QuoteStatus) => {
        const newStatus = currentStatuses.includes(status)
            ? currentStatuses.filter(s => s !== status)
            : [...currentStatuses, status];

        router.navigate({
            to: '/documents',
            search: {
                ...searchParams,
                quoteStatus: newStatus
            }
        });
    };
}

export function useInvoiceStatusToggle(
    currentStatuses: InvoiceStatus[],
    searchParams: QuoteSearchParams
) {
    const router = useRouter();

    return (status: InvoiceStatus) => {
        const newStatus = currentStatuses.includes(status)
            ? currentStatuses.filter(s => s !== status)
            : [...currentStatuses, status];

        router.navigate({
            to: '/documents',
            search: {
                ...searchParams,
                invoiceStatus: newStatus
            }
        });
    };
}
