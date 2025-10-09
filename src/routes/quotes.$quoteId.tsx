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
import {calculateTotal} from "@/lib/utils.ts";

const getData = createServerFn()
    .inputValidator((data: { quoteId: string }) => data)
    .handler(async ({data}) => {
        const quote = await prisma.quote.findUnique({
            where: {
                id: data.quoteId
            },
            include: {
                customer: true,
                invoices: {
                    include: {
                        lines: true
                    }
                },
                lines: true
            }
        });

        if (!quote) {
            throw notFound();
        }

        return {quote};
    });

const setQuoteStatus = createServerFn()
    .inputValidator((data: { quoteId: string, status: "SENT" | "ACCEPTED" | "DECLINED" }) => data)
    .handler(async ({data}) => {
        await prisma.quote.update({
            where: {
                id: data.quoteId
            },
            data: {
                status: data.status
            }
        });

        await prisma.activity.create({
            data: {
                type: `QUOTE_${data.status}`,
                quote: {
                    connect: {
                        id: data.quoteId
                    }
                }
            }
        });

        return {op: data.status.toLowerCase(), quote: data.quoteId}
    });

const deleteQuote = createServerFn()
    .inputValidator((data: { quoteId: string }) => data)
    .handler(async ({data}) => {
        await prisma.quote.delete({
            where: {
                id: data.quoteId
            }
        });

        return {op: 'deleted', quote: data.quoteId}
    });


export const Route = createFileRoute('/quotes/$quoteId')({
    component: RouteComponent,
    loader: ({params}) => getData({data: {quoteId: params.quoteId}})
})

function RouteComponent() {
    const {quote} = Route.useLoaderData();
    
    const sendQuoteMut = useDocumentMutation({
        documentId: quote.id,
        documentType: 'quote',
        action: 'send',
        mutationFn: (data: { quoteId: string, status: "SENT" }) => setQuoteStatus({data})
    });

    const acceptQuoteMut = useDocumentMutation({
        documentId: quote.id,
        documentType: 'quote',
        action: 'accept',
        mutationFn: (data: { quoteId: string, status: "ACCEPTED" }) => setQuoteStatus({data})
    });

    const declineQuoteMut = useDocumentMutation({
        documentId: quote.id,
        documentType: 'quote',
        action: 'decline',
        mutationFn: (data: { quoteId: string, status: "DECLINED" }) => setQuoteStatus({data})
    });

    const deleteQuoteMut = useDocumentMutation({
        documentId: quote.id,
        documentType: 'quote',
        action: 'delete',
        mutationFn: (data: { quoteId: string }) => deleteQuote({data}),
        invalidate: false,
        redirectTo: '/documents'
    });

    const onSend = () => {
        sendQuoteMut.mutate({quoteId: quote.id, status: 'SENT'});
    }

    const onDelete = () => {
        deleteQuoteMut.mutate({quoteId: quote.id});
    }

    const onAccept = () => {
        acceptQuoteMut.mutate({quoteId: quote.id, status: 'ACCEPTED'});
    }

    const onDecline = () => {
        declineQuoteMut.mutate({quoteId: quote.id, status: 'DECLINED'});
    }

    return (
        <div className="content">
            <BackLink to="/documents" label="Documents"/>
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h2 className="page-title mb-2">Devis n°{quote.num}</h2>
                    {quote.title && (
                        <p className="text-gray-600 text-lg">{quote.title}</p>
                    )}
                </div>
                <StatusBadge status={quote.status} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <Card variant="section">
                    <div className="flex items-center gap-2 mb-4">
                        <User size={20} className="text-gray-400"/>
                        <h3 className="section-card-title">Client</h3>
                    </div>
                    <Link
                        to="/customers/$customerId"
                        params={{customerId: quote.customer.id}}
                        className="block hover:text-blue-600"
                    >
                        <p className="font-semibold text-gray-900 mb-1">{quote.customer.name}</p>
                        <p className="text-sm text-gray-600">{quote.customer.address}</p>
                        {quote.customer.email && (
                            <p className="text-sm text-gray-600 mt-1">{quote.customer.email}</p>
                        )}
                        {quote.customer.phone && (
                            <p className="text-sm text-gray-600">{quote.customer.phone}</p>
                        )}
                    </Link>
                </Card>

                <Card variant="section">
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar size={20} className="text-gray-400"/>
                        <h3 className="section-card-title">Dates</h3>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <p className="text-sm text-gray-500">Date d'émission</p>
                            <p className="font-medium text-gray-900">
                                {formatDate(new Date(quote.emitDate), 'd MMMM yyyy', {locale: frLocale})}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Date d'expiration</p>
                            <p className="font-medium text-gray-900">
                                {formatDate(new Date(quote.expirationDate), 'd MMMM yyyy', {locale: frLocale})}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card variant="section">
                    <div className="flex items-center gap-2 mb-4">
                        <Receipt size={20} className="text-gray-400"/>
                        <h3 className="section-card-title">Factures</h3>
                    </div>
                    {quote.invoices.length > 0 ? (
                        <div className="space-y-2">
                            {quote.invoices.map(invoice => (
                                    <Link
                                        key={invoice.id}
                                        to="/invoices/$invoiceId"
                                        params={{invoiceId: invoice.id}}
                                        className="block p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-900">
                                                Facture n°{invoice.num}
                                            </span>
                                            <StatusBadge status={invoice.status} />
                                        </div>
                                        <p className="text-xs text-gray-600 mt-1">{calculateTotal(invoice.lines).toFixed(2)}€</p>
                                    </Link>
                            ))}
                        </div>
                    ) : (
                        <EmptyState 
                            icon={Receipt}
                            iconSize={32}
                            message="Aucune facture liée"
                        />
                    )}
                </Card>
            </div>

            {quote.notes && (
                <Card variant="section" className="mb-6">
                    <h3 className="section-card-title mb-3">Notes</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{quote.notes}</p>
                </Card>
            )}

            <Card variant="section" className="mb-4">
                <div className="flex items-center gap-2 mb-4">
                    <FileText size={20} className="text-gray-400"/>
                    <h3 className="section-card-title">Détail du devis</h3>
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
                        {quote.lines.map((line) => {
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
                                {quote.totalAmount ? quote.totalAmount.toFixed(2) : calculateTotal(quote.lines).toFixed(2)}€
                            </td>
                        </tr>
                        </tfoot>
                    </table>
                </div>
            </Card>
            <div className='flex w-full justify-end gap-4'>
                {
                    quote.status === 'DRAFT' ? (
                        <>
                            <button type="button" onClick={onSend}
                                    className="cursor-pointer bg-blue-500 rounded-lg p-2 text-white hover:bg-blue-600 active:bg-blue-600">
                                Envoyer
                            </button>
                            <button type="button" onClick={onDelete}
                                    className="cursor-pointer bg-red-500 rounded-lg p-2 text-white hover:bg-red-600 active:bg-red-600">
                                Supprimer le brouillon
                            </button>
                        </>

                    ) : quote.status === 'SENT' && (
                        <>
                            <button type="button" onClick={onAccept}
                                    className="action-btn-success">
                                Accepter
                            </button>
                            <button type="button" onClick={onDecline}
                                    className="action-btn-danger">
                                Refuser
                            </button>
                        </>
                    )
                }
            </div>
        </div>
    );
}