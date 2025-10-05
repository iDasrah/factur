import {createFileRoute, Link, useRouter} from '@tanstack/react-router'
import {createServerFn} from "@tanstack/react-start";
import prisma from "@/lib/db.ts";
import {FileText, Receipt, Search, SlidersHorizontal, X} from "lucide-react";
import {formatDate} from "date-fns";
import {fr as frLocale} from "date-fns/locale/fr";
import {statusColors, statusLabels} from "@/lib/constants.ts";
import {useMemo} from "react";
import { z } from 'zod';
import {$Enums} from "@prisma/client";

const getData = createServerFn().handler(async () => {
    const [invoices, quotes] = await Promise.all([
        prisma.invoice.findMany({
            include: {
                lines: true,
                customer: true
            },
            orderBy: { emitDate: 'desc' }
        }),
        prisma.quote.findMany({
            include: {
                customer: true
            },
            orderBy: { emitDate: 'desc' }
        })
    ])

    return {invoices, quotes}
});

const searchParams = z.object({
    quoteSearch: z.string().default(''),
    quoteStatus: z.enum($Enums.QuoteStatus).array().default([]),
    invoiceSearch: z.string().default(''),
    invoiceStatus: z.enum($Enums.InvoiceStatus).array().default([])
});

export const Route = createFileRoute('/documents/')({
    component: RouteComponent,
    loader: () => getData(),
    validateSearch: searchParams
})

function RouteComponent() {
    const {invoices, quotes} = Route.useLoaderData();
    const { quoteSearch, quoteStatus, invoiceSearch, invoiceStatus } = Route.useSearch();
    const router = useRouter();

    const filteredQuotes = useMemo(() => {
        return quotes.filter(quote => {
            const matchSearch = !quoteSearch ||
                quote.num.toLowerCase().includes(quoteSearch.toLowerCase()) ||
                quote.customer.name.toLowerCase().includes(quoteSearch.toLowerCase()) ||
                quote.title?.toLowerCase().includes(quoteSearch.toLowerCase());

            const matchStatus = quoteStatus.length === 0 ||
                quoteStatus.includes(quote.status);

            return matchSearch && matchStatus;
        });
    }, [quotes, quoteSearch, quoteStatus]);

    const filteredInvoices = useMemo(() => {
        return invoices.filter(invoice => {
            const matchSearch = !invoiceSearch ||
                invoice.num.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
                invoice.customer.name.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
                invoice.title?.toLowerCase().includes(invoiceSearch.toLowerCase());

            const matchStatus = invoiceStatus.length === 0 ||
                invoiceStatus.includes(invoice.status);

            return matchSearch && matchStatus;
        });
    }, [invoices, invoiceSearch, invoiceStatus]);

    const toggleQuoteStatus = (status: $Enums.QuoteStatus) => {
        const newStatus = quoteStatus.includes(status)
            ? quoteStatus.filter(s => s !== status)
            : [...quoteStatus, status];

        router.navigate({
            to: '/documents',
            search: {
                quoteStatus: newStatus,
                invoiceStatus,
                quoteSearch,
                invoiceSearch
            }
        });
    };

    const toggleInvoiceStatus = (status: $Enums.InvoiceStatus) => {
        const newStatus = invoiceStatus.includes(status)
            ? invoiceStatus.filter(s => s !== status)
            : [...invoiceStatus, status];

        router.navigate({
            to: '/documents',
            search: {
                invoiceStatus: newStatus,
                quoteStatus,
                quoteSearch,
                invoiceSearch
            }
        });
    };

    return (
        <div className="content">
            <h2 className="page-title mb-6">Vos documents</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section className="section-card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="section-card-title">Devis</h3>
                        <FileText size={20} className="text-gray-400"/>
                    </div>

                    <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Rechercher par numéro, client ou titre..."
                            type="text"
                            value={quoteSearch}
                            onChange={(e) => router.navigate({ to:'/documents', search: {quoteSearch: e.target.value, invoiceSearch, quoteStatus, invoiceStatus}})}
                        />
                        {quoteSearch && (
                            <button
                                onClick={() => router.navigate({to:'/documents', search: {quoteSearch: '', invoiceSearch, quoteStatus, invoiceStatus}})}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>

                    <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                            <SlidersHorizontal size={16} className="text-gray-400" />
                            <span className="text-sm text-gray-600">Filtrer par statut</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {['DRAFT', 'SENT', 'ACCEPTED', 'DECLINED'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => toggleQuoteStatus(status as $Enums.QuoteStatus)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                                        quoteStatus.includes(status as $Enums.QuoteStatus)
                                            ? statusColors[status as $Enums.QuoteStatus]
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {statusLabels[status as $Enums.QuoteStatus]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {filteredQuotes.length > 0 ? (
                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                            {filteredQuotes.map(quote => (
                                <Link
                                    to="/quotes/$quoteId"
                                    params={{quoteId: quote.id}}
                                    key={quote.num}
                                    className="document-card"
                                >
                                    <div className="document-card-header">
                                        <div>
                                            <h4 className="document-card-num">Devis n°{quote.num}</h4>
                                            <p className="text-sm text-gray-700">{quote.customer.name}</p>
                                        </div>
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
                        <div className="text-center py-12">
                            <FileText className="mx-auto text-gray-300 mb-2" size={40}/>
                            <p className="text-gray-400">
                                {quoteSearch || quoteStatus.length > 0
                                    ? "Aucun devis ne correspond à votre recherche"
                                    : "Aucun devis trouvé"
                                }
                            </p>
                        </div>
                    )}
                </section>

                <section className="section-card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="section-card-title">Factures</h3>
                        <Receipt size={20} className="text-gray-400"/>
                    </div>

                    <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Rechercher par numéro, client ou titre..."
                            type="text"
                            value={invoiceSearch}
                            onChange={(e) => router.navigate({to: '/documents', search:{invoiceSearch: e.target.value, quoteSearch, quoteStatus, invoiceStatus}})}
                        />
                        {invoiceSearch && (
                            <button
                                onClick={() => router.navigate({to:'/documents', search:{invoiceSearch:'', quoteSearch, quoteStatus, invoiceStatus}})}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>

                    <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                            <SlidersHorizontal size={16} className="text-gray-400" />
                            <span className="text-sm text-gray-600">Filtrer par statut</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {['UNPAID', 'PAID', 'CANCELLED'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => toggleInvoiceStatus(status as $Enums.InvoiceStatus)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                                        invoiceStatus.includes(status as $Enums.InvoiceStatus)
                                            ? statusColors[status]
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {statusLabels[status as $Enums.InvoiceStatus]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {filteredInvoices.length > 0 ? (
                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                            {filteredInvoices.map(invoice => {
                                const total = invoice.lines?.reduce((sum, line) =>
                                    sum + line.unitPrice * line.quantity, 0
                                ) || 0;

                                return (
                                    <Link
                                        to="/invoices/$invoiceId"
                                        params={{invoiceId: invoice.id}}
                                        key={invoice.num}
                                        className="document-card"
                                    >
                                        <div className="document-card-header">
                                            <div>
                                                <h4 className="document-card-num">Facture n°{invoice.num}</h4>
                                                <p className="text-sm text-gray-700">{invoice.customer.name}</p>
                                            </div>
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
                        <div className="text-center py-12">
                            <Receipt className="mx-auto text-gray-300 mb-2" size={40}/>
                            <p className="text-gray-400">
                                {invoiceSearch || invoiceStatus.length > 0
                                    ? "Aucune facture ne correspond à votre recherche"
                                    : "Aucune facture trouvée"
                                }
                            </p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}