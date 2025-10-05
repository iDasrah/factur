import {createFileRoute, Link, notFound} from '@tanstack/react-router'
import {createServerFn} from "@tanstack/react-start";
import prisma from "@/lib/db.ts";
import {Mail, MapPin, Phone, FileText, Receipt, ArrowLeft} from "lucide-react";
import {formatDate} from "date-fns";
import { fr as frLocale } from 'date-fns/locale';

const getData = createServerFn()
    .inputValidator((data: { customerId: string }) => data)
    .handler(async ({data}) => {
        const customer = await prisma.customer.findUnique({
            where: {
                id: data.customerId
            },
            include: {
                invoices: {
                    orderBy: { emitDate: 'desc' },
                    include: {
                        lines: true
                    }
                },
                quotes: {
                    orderBy: { emitDate: 'desc' }
                }
            }
        });

        if (!customer) {
            throw notFound();
        }

        return {customer};
    })

export const Route = createFileRoute('/customers/$customerId')({
    component: RouteComponent,
    loader: ({params}) => getData({data: {customerId: params.customerId}}),
})

const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    SENT: 'bg-blue-100 text-blue-700',
    ACCEPTED: 'bg-green-100 text-green-700',
    DECLINED: 'bg-red-100 text-red-700',
    UNPAID: 'bg-orange-100 text-orange-700',
    PAID: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-gray-100 text-gray-700',
};

const statusLabels: Record<string, string> = {
    DRAFT: 'Brouillon',
    SENT: 'Envoyé',
    ACCEPTED: 'Accepté',
    DECLINED: 'Refusé',
    UNPAID: 'Impayée',
    PAID: 'Payée',
    CANCELLED: 'Annulée',
};

function RouteComponent() {
    const {customer} = Route.useLoaderData();

    return (
        <div className="content">
            <Link to="/customers" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
                <ArrowLeft size={20} />
                Retour aux clients
            </Link>

            <h2 className="page-title mb-6">{customer.name}</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <section className="section-card lg:col-span-1">
                    <h3 className="section-card-title mb-4">Informations</h3>
                    <div className="space-y-3">
                        <div className="customer-card-info">
                            <MapPin size={20} className="mt-0.5 flex-shrink-0 text-gray-400" />
                            <address className="not-italic">{customer.address}</address>
                        </div>
                        {customer.phone && (
                            <div className="customer-card-info">
                                <Phone size={20} className="flex-shrink-0 text-gray-400" />
                                <a href={`tel:${customer.phone}`} className="hover:text-blue-600">
                                    {customer.phone}
                                </a>
                            </div>
                        )}
                        {customer.email && (
                            <div className="customer-card-info">
                                <Mail size={20} className="flex-shrink-0 text-gray-400" />
                                <a href={`mailto:${customer.email}`} className="hover:text-blue-600 truncate">
                                    {customer.email}
                                </a>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                                <p className="text-2xl font-bold text-blue-600">{customer.quotes.length}</p>
                                <p className="text-sm text-gray-500">Devis</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-green-600">{customer.invoices.length}</p>
                                <p className="text-sm text-gray-500">Factures</p>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="lg:col-span-2 space-y-6">
                    <section className="section-card">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="section-card-title">Devis</h3>
                            <FileText size={20} className="text-gray-400" />
                        </div>

                        {customer.quotes.length > 0 ? (
                            <div className="space-y-3">
                                {customer.quotes.map(quote => (
                                    <Link
                                        to="/quotes/$quoteId"
                                        params={{ quoteId: quote.id }}
                                        key={quote.num}
                                        className="document-card"
                                    >
                                        <div className="document-card-header">
                                            <h4 className="document-card-num">Devis n°{quote.num}</h4>
                                            <span className={`document-status ${statusColors[quote.status]}`}>
                                                {statusLabels[quote.status]}
                                            </span>
                                        </div>
                                        {quote.title && (
                                            <p className="document-title">{quote.title}</p>
                                        )}
                                        <div className="document-card-footer">
                                            <p className="document-date">
                                                {formatDate(new Date(quote.emitDate), 'd MMM yyyy', {locale: frLocale})}
                                            </p>
                                            <p className="document-amount">{quote.totalAmount}€</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <FileText className="mx-auto text-gray-300 mb-2" size={40} />
                                <p className="text-gray-400">Aucun devis pour ce client</p>
                            </div>
                        )}
                    </section>

                    <section className="section-card">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="section-card-title">Factures</h3>
                            <Receipt size={20} className="text-gray-400" />
                        </div>

                        {customer.invoices.length > 0 ? (
                            <div className="space-y-3">
                                {customer.invoices.map(invoice => {
                                    const total = invoice.lines?.reduce((sum, line) =>
                                        sum + line.unitPrice * line.quantity, 0
                                    ) || 0;

                                    return (
                                        <Link
                                            to="/invoices/$invoiceId"
                                            params={{ invoiceId: invoice.id }}
                                            key={invoice.num}
                                            className="document-card"
                                        >
                                            <div className="document-card-header">
                                                <h4 className="document-card-num">Facture n°{invoice.num}</h4>
                                                <span className={`document-status ${statusColors[invoice.status]}`}>
                                                    {statusLabels[invoice.status]}
                                                </span>
                                            </div>
                                            {invoice.title && (
                                                <p className="document-title">{invoice.title}</p>
                                            )}
                                            <div className="document-card-footer">
                                                <p className="document-date">
                                                    {formatDate(new Date(invoice.emitDate), 'd MMM yyyy', {locale: frLocale})}
                                                </p>
                                                <p className="document-amount">{total}€</p>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Receipt className="mx-auto text-gray-300 mb-2" size={40} />
                                <p className="text-gray-400">Aucune facture pour ce client</p>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}