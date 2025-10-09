import { Link } from "@tanstack/react-router";
import { useInvoiceStatus } from "@/hooks";
import { calculateTotal, formatRelativeDate } from "@/lib/utils";

interface UnpaidInvoiceCardProps {
    invoice: {
        id: string;
        num: string;
        dueDate: Date | string;
        customer: {
            name: string;
        };
        lines: Array<{
            quantity: number;
            unitPrice: number;
        }>;
    };
}

export const UnpaidInvoiceCard = ({ invoice }: UnpaidInvoiceCardProps) => {
    const { isLate, borderColor, bgColor, hoverBgColor, textColor } = useInvoiceStatus(invoice);
    const dueDate = new Date(invoice.dueDate);

    return (
        <Link 
            to="/invoices/$invoiceId" 
            params={{ invoiceId: invoice.id }}
            key={invoice.num}
            className={`flex items-center justify-between p-3 border-l-4 ${borderColor} ${bgColor} ${hoverBgColor} rounded`}
        >
            <div>
                <p className="text-value">Facture #{invoice.num}</p>
                <p className="text-muted">{invoice.customer.name}</p>
            </div>
            <div className="text-right">
                <p className="font-semibold text-gray-800">
                    {calculateTotal(invoice.lines).toFixed(2)}€
                </p>
                <p className={`text-xs ${textColor}`}>
                    {isLate
                        ? `Retard: ${formatRelativeDate(dueDate, false)}`
                        : `Échéance: ${formatRelativeDate(dueDate)}`
                    }
                </p>
            </div>
        </Link>
    );
}
