import {createFileRoute, Link, notFound} from '@tanstack/react-router'
import {createServerFn} from "@tanstack/react-start";
import {formatDate} from "date-fns";
import {fr as frLocale} from "date-fns/locale/fr";
import {Calendar, FileText, Receipt, User} from "lucide-react";
import BackLink from "@/components/BackLink";
import Card from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import StatusBadge from "@/components/StatusBadge";
import { useDocumentMutation } from "@/hooks/useDocumentMutation";
import prisma from "@/lib/db.ts";
import { calculateTotal } from "@/lib/utils";

const getData = createServerFn()
    .inputValidator((data: { invoiceId: string }) => data)
    .handler(async ({data}) => {
        const invoice = await prisma.invoice.findUnique({
            where: {
                id: data.invoiceId
            },
            include: {
                customer: true,
                quote: true,
                lines: true
            }
        });

        if (!invoice) {
            throw notFound();
        }

        return {invoice};
    });

const setInvoiceStatus = createServerFn()
    .inputValidator((data: { invoiceId: string, status: "PAID" | "CANCELLED" }) => data)
    .handler(async ({data}) => {
        await prisma.invoice.update({
            where: {
                id: data.invoiceId
            },
            data: {
                status: data.status
            }
        });

        await prisma.activity.create({
            data: {
                type: `INVOICE_${data.status}`,
                quote: {
                    connect: {
                        id: data.invoiceId
                    }
                }
            }
        });

        return {op: data.status.toLowerCase(), quote: data.invoiceId}
    });

export const Route = createFileRoute('/invoices/$invoiceId')({
    component: RouteComponent,
    loader: ({params}) => getData({data: {invoiceId: params.invoiceId}})
})

function RouteComponent() {
    const {invoice} = Route.useLoaderData();

    const payInvoiceMut = useDocumentMutation({
        documentId: invoice.id,
        documentType: 'invoice',
        action: 'pay',
        mutationFn: (data: { invoiceId: string, status: "PAID" }) => setInvoiceStatus({data})
    });

    const cancelInvoiceMut = useDocumentMutation({
        documentId: invoice.id,
        documentType: 'invoice',
        action: 'cancel',
        mutationFn: (data: { invoiceId: string, status: "CANCELLED" }) => setInvoiceStatus({data})
    });

    const onPay = () => {
        payInvoiceMut.mutate({invoiceId: invoice.id, status: "PAID"});
    }

    const onCancel = () => {
        cancelInvoiceMut.mutate({invoiceId: invoice.id, status: "CANCELLED"});
    }

    return (
        <div className="content">
            <BackLink to="/documents" label="Documents" />
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h2 className="page-title mb-2">Facture n°{invoice.num}</h2>
                    {invoice.title && (
                        <p className="text-gray-600 text-lg">{invoice.title}</p>
                    )}
                </div>
                <StatusBadge status={invoice.status} />
            </div>

            <div className="grid-3-cols">
                <Card variant="section">
                    <div className="card-section-header">
                        <User size={20} className="card-section-icon" />
                        <h3 className="section-card-title">Client</h3>
                    </div>
                    <Link
                        to="/customers/$customerId"
                        params={{ customerId: invoice.customer.id }}
                        className="block hover:text-blue-600"
                    >
                        <p className="font-semibold text-gray-900 mb-1">{invoice.customer.name}</p>
                        <p className="text-muted">{invoice.customer.address}</p>
                        {invoice.customer.email && (
                            <p className="text-muted mt-1">{invoice.customer.email}</p>
                        )}
                        {invoice.customer.phone && (
                            <p className="text-muted">{invoice.customer.phone}</p>
                        )}
                    </Link>
                </Card>

                <Card variant="section">
                    <div className="card-section-header">
                        <Calendar size={20} className="card-section-icon" />
                        <h3 className="section-card-title">Dates</h3>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <p className="text-label">Date d'émission</p>
                            <p className="text-value">
                                {formatDate(new Date(invoice.emitDate), 'd MMMM yyyy', {locale: frLocale})}
                            </p>
                        </div>
                        <div>
                            <p className="text-label">Date d'échéance</p>
                            <p className="text-value">
                                {formatDate(new Date(invoice.dueDate), 'd MMMM yyyy', {locale: frLocale})}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card variant="section">
                    <div className="card-section-header">
                        <FileText size={20} className="card-section-icon" />
                        <h3 className="section-card-title">Devis lié</h3>
                    </div>
                    {invoice.quote ? (
                        <Link
                            to="/quotes/$quoteId"
                            params={{ quoteId: invoice.quote.id }}
                            className="list-item-card"
                        >
                            <div className="list-item-header">
                                <span className="text-link">
                                    Devis n°{invoice.quote.num}
                                </span>
                                <StatusBadge status={invoice.quote.status} />
                            </div>
                            {invoice.quote.title && (
                                <p className="text-xs text-gray-600">{invoice.quote.title}</p>
                            )}
                            <p className="text-xs text-gray-600 mt-1">{invoice.quote.totalAmount ? invoice.quote.totalAmount.toFixed(2) : calculateTotal(invoice.lines).toFixed(2)}€</p>
                        </Link>
                    ) : (
                        <EmptyState 
                            icon={FileText}
                            iconSize={32}
                            message="Aucun devis lié"
                        />
                    )}
                </Card>
            </div>

            <Card variant="section">
                <div className="card-section-header">
                    <Receipt size={20} className="card-section-icon" />
                    <h3 className="section-card-title">Détail de la facture</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead className="table-header">
                        <tr>
                            <th className="table-header-cell text-left">Description</th>
                            <th className="table-header-cell text-right">Prix unitaire</th>
                            <th className="table-header-cell text-right">Quantité</th>
                            <th className="table-header-cell text-right">Prix total</th>
                        </tr>
                        </thead>
                        <tbody className="table-body">
                        {invoice.lines.map((line) => {
                            const lineTotal = line.unitPrice * line.quantity;

                            return (
                                <tr key={line.id} className="table-row">
                                    <td className="table-cell text-gray-900">{line.description}</td>
                                    <td className="table-cell text-right text-gray-700">{line.unitPrice.toFixed(2)}€</td>
                                    <td className="table-cell text-right text-gray-700">{line.quantity}</td>
                                    <td className="table-cell text-right font-semibold text-gray-900">
                                        {lineTotal.toFixed(2)}€
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                        <tfoot className="table-footer">
                        <tr>
                            <td colSpan={3} className="table-cell text-right font-semibold text-gray-700">Total HT</td>
                            <td className="table-cell text-right font-bold text-blue-600 text-lg">
                                {calculateTotal(invoice.lines).toFixed(2)}€
                            </td>
                        </tr>
                        </tfoot>
                    </table>
                </div>

                <div className="info-box">
                    <p className="text-muted">
                        TVA non applicable, art. 293 B du CGI
                    </p>
                </div>
            </Card>
            <button
                type="button"
                onClick={onPay}
                className="action-btn-success">
                Accepter
            </button>
            <button
                type="button"
                onClick={onCancel}
                className="action-btn-danger">
                Refuser
            </button>
        </div>
    );
}