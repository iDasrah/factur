import {useMutation} from "@tanstack/react-query";
import {createFileRoute, Link, notFound, useRouter} from '@tanstack/react-router'
import {createServerFn} from "@tanstack/react-start";
import {formatDate} from "date-fns";
import {fr as frLocale} from "date-fns/locale/fr";
import {ArrowLeft, Calendar, FileText, Receipt, User} from "lucide-react";
import {statusColors, statusLabels} from "@/lib/constants.ts";
import prisma from "@/lib/db.ts";

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
    const total = invoice.lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
    const router = useRouter();

    const payInvoiceMut = useMutation({
        mutationKey: ['pay', invoice.id],
        mutationFn: (data: { invoiceId: string, status: "PAID" | "CANCELLED" }) => setInvoiceStatus({data}),
        onSuccess: () => {
            router.invalidate();
        }
    });

    const onPay = () => {
        payInvoiceMut.mutate({invoiceId: invoice.id, status: "PAID"});
    }

    const onCancel = () => {
        payInvoiceMut.mutate({invoiceId: invoice.id, status: "CANCELLED"});
    }

    return (
        <div className="content">
            <Link to="/documents" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
                <ArrowLeft size={20} />
                Retour aux documents
            </Link>

            <div className="flex items-start justify-between mb-6">
                <div>
                    <h2 className="page-title mb-2">Facture n°{invoice.num}</h2>
                    {invoice.title && (
                        <p className="text-gray-600 text-lg">{invoice.title}</p>
                    )}
                </div>
                <span className={`document-status ${statusColors[invoice.status]}`}>
                    {statusLabels[invoice.status]}
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="section-card">
                    <div className="flex items-center gap-2 mb-4">
                        <User size={20} className="text-gray-400" />
                        <h3 className="section-card-title">Client</h3>
                    </div>
                    <Link
                        to="/customers/$customerId"
                        params={{ customerId: invoice.customer.id }}
                        className="block hover:text-blue-600"
                    >
                        <p className="font-semibold text-gray-900 mb-1">{invoice.customer.name}</p>
                        <p className="text-sm text-gray-600">{invoice.customer.address}</p>
                        {invoice.customer.email && (
                            <p className="text-sm text-gray-600 mt-1">{invoice.customer.email}</p>
                        )}
                        {invoice.customer.phone && (
                            <p className="text-sm text-gray-600">{invoice.customer.phone}</p>
                        )}
                    </Link>
                </div>

                <div className="section-card">
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar size={20} className="text-gray-400" />
                        <h3 className="section-card-title">Dates</h3>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <p className="text-sm text-gray-500">Date d'émission</p>
                            <p className="font-medium text-gray-900">
                                {formatDate(new Date(invoice.emitDate), 'd MMMM yyyy', {locale: frLocale})}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Date d'échéance</p>
                            <p className="font-medium text-gray-900">
                                {formatDate(new Date(invoice.dueDate), 'd MMMM yyyy', {locale: frLocale})}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="section-card">
                    <div className="flex items-center gap-2 mb-4">
                        <FileText size={20} className="text-gray-400" />
                        <h3 className="section-card-title">Devis lié</h3>
                    </div>
                    {invoice.quote ? (
                        <Link
                            to="/quotes/$quoteId"
                            params={{ quoteId: invoice.quote.id }}
                            className="block p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-900">
                                    Devis n°{invoice.quote.num}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded ${statusColors[invoice.quote.status]}`}>
                                    {statusLabels[invoice.quote.status]}
                                </span>
                            </div>
                            {invoice.quote.title && (
                                <p className="text-xs text-gray-600">{invoice.quote.title}</p>
                            )}
                            <p className="text-xs text-gray-600 mt-1">{invoice.quote.totalAmount?.toFixed(2)}€</p>
                        </Link>
                    ) : (
                        <p className="text-sm text-gray-400">Aucun devis lié</p>
                    )}
                </div>
            </div>

            <div className="section-card">
                <div className="flex items-center gap-2 mb-4">
                    <Receipt size={20} className="text-gray-400" />
                    <h3 className="section-card-title">Détail de la facture</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full bg-white border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="text-left p-4 font-semibold text-gray-700">Description</th>
                            <th className="text-right p-4 font-semibold text-gray-700">Prix unitaire</th>
                            <th className="text-right p-4 font-semibold text-gray-700">Quantité</th>
                            <th className="text-right p-4 font-semibold text-gray-700">Prix total</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                        {invoice.lines.map((line) => {
                            const lineTotal = line.unitPrice * line.quantity;

                            return (
                                <tr key={line.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 text-gray-900">{line.description}</td>
                                    <td className="p-4 text-right text-gray-700">{line.unitPrice.toFixed(2)}€</td>
                                    <td className="p-4 text-right text-gray-700">{line.quantity}</td>
                                    <td className="p-4 text-right font-semibold text-gray-900">
                                        {lineTotal.toFixed(2)}€
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                        <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                        <tr>
                            <td colSpan={3} className="p-4 text-right font-semibold text-gray-700">Total HT</td>
                            <td className="p-4 text-right font-bold text-blue-600 text-lg">
                                {total.toFixed(2)}€
                            </td>
                        </tr>
                        </tfoot>
                    </table>
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                        TVA non applicable, art. 293 B du CGI
                    </p>
                </div>
            </div>
            <button
                type="button"
                onClick={onPay}
                className="cursor-pointer bg-green-500 rounded-lg p-2 text-white hover:bg-green-600 active:bg-green-600">
                Accepter
            </button>
            <button
                type="button"
                onClick={onCancel}
                className="cursor-pointer bg-red-500 rounded-lg p-2 text-white hover:bg-red-600 active:bg-red-600">
                Refuser
            </button>
        </div>
    );
}