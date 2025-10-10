import { calculateTotal } from "./utils";

export function calculateRevenues(
    invoices: {
        status: string;
        lines: { unitPrice: number; quantity: number }[];
    }[]
) {
    let total = 0;
    let invoiced = 0;
    let pending = 0;

    invoices.forEach(invoice => {
        if (invoice.status !== 'CANCELLED') {
            const invoiceTotal = calculateTotal(invoice.lines);
            total += invoiceTotal;

            if (invoice.status === 'PAID') {
                invoiced += invoiceTotal;
            } else if (invoice.status === 'UNPAID') {
                pending += invoiceTotal;
            }
        }
    });

    return {
        total,
        invoiced,
        pending
    };
}

export function calculateTotalRevenue(
    invoices: {
        lines: { unitPrice: number; quantity: number }[];
    }[]
): number {
    return invoices.reduce((sum, invoice) => {
        return sum + calculateTotal(invoice.lines);
    }, 0);
}
