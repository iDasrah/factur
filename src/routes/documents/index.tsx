import {$Enums} from "@prisma/client";
import {createFileRoute, Link, useRouter} from '@tanstack/react-router'
import {createServerFn} from "@tanstack/react-start";
import {formatDate} from "date-fns";
import {fr as frLocale} from "date-fns/locale/fr";
import {FileText, Receipt, Search, SlidersHorizontal, X} from "lucide-react";
import { z } from 'zod';
import Card from "@/components/Card.tsx";
import EmptyState from "@/components/EmptyState";
import StatusBadge from "@/components/StatusBadge";
import { useDocumentFilter, useInvoiceStatusToggle, useQuoteStatusToggle } from "@/hooks";
import {statusColors, statusLabels} from "@/lib/constants.ts";
import prisma from "@/lib/db.ts";
import {calculateTotal} from "@/lib/utils.ts";

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
                customer: true,
                lines: true
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

    const filteredQuotes = useDocumentFilter(quotes, quoteSearch, quoteStatus);
    const filteredInvoices = useDocumentFilter(invoices, invoiceSearch, invoiceStatus);

    const toggleQuoteStatus = useQuoteStatusToggle(quoteStatus, {
        quoteSearch,
        quoteStatus,
        invoiceSearch,
        invoiceStatus
    });

    const toggleInvoiceStatus = useInvoiceStatusToggle(invoiceStatus, {
        quoteSearch,
        quoteStatus,
        invoiceSearch,
        invoiceStatus
    });

    return (
        <div className="content">
            <div className="flex items-center justify-between mb-4">
                <h2 className="page-title m-0">Vos documents</h2>
                <Link to='/documents/new' className="new-btn">Nouveau</Link>
            </div>

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
                                type="button"
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
                                    type="button"
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
                        <div className="flex flex-col gap-2 max-h-140 overflow-y-auto pr-2">
                            {filteredQuotes.map(quote => (
                                <Link
                                    to="/quotes/$quoteId"
                                    params={{quoteId: quote.id}}
                                    key={quote.num}
                                >
                                    <Card variant="document">
                                        <div className="list-item-header mb-2">
                                            <div>
                                                <h4 className="font-semibold text-gray-900">Devis n°{quote.num}</h4>
                                                <p className="text-muted">{quote.customer.name}</p>
                                            </div>
                                            <StatusBadge status={quote.status} />
                                        </div>
                                        {quote.title && (
                                            <p className="text-muted mb-2">{quote.title}</p>
                                        )}
                                        <div className="flex items-center justify-between text-sm">
                                            <p className="text-gray-500">
                                                {formatDate(new Date(quote.emitDate), 'd MMM yyyy', {locale: frLocale})}
                                            </p>
                                            <p className="font-semibold text-gray-900">{quote.totalAmount ? quote.totalAmount.toFixed(2) : calculateTotal(quote.lines).toFixed(2)}€</p>
                                        </div>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <EmptyState 
                            icon={FileText}
                            iconSize={40}
                            message={quoteSearch || quoteStatus.length > 0
                                ? "Aucun devis ne correspond à votre recherche"
                                : "Aucun devis trouvé"
                            }
                        />
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
                                type="button"
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
                                    type="button"
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
                        <div className="flex flex-col gap-2 max-h-140 overflow-y-auto pr-2">
                            {filteredInvoices.map(invoice => 
                                (
                                    <Link
                                        to="/invoices/$invoiceId"
                                        params={{invoiceId: invoice.id}}
                                        key={invoice.num}
                                    >
                                        <Card variant="document">
                                            <div className="list-item-header mb-2">
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">Facture n°{invoice.num}</h4>
                                                    <p className="text-muted">{invoice.customer.name}</p>
                                                </div>
                                                <StatusBadge status={invoice.status} />
                                            </div>
                                            {invoice.title && (
                                                <p className="text-muted mb-2">{invoice.title}</p>
                                            )}
                                            <div className="flex items-center justify-between text-sm">
                                                <p className="text-gray-500">
                                                    {formatDate(new Date(invoice.emitDate), 'd MMM yyyy', {locale: frLocale})}
                                                </p>
                                                <p className="font-semibold text-gray-900">{calculateTotal(invoice.lines).toFixed(2)}€</p>
                                            </div>
                                        </Card>
                                    </Link>
                                )
                            )}
                        </div>
                    ) : (
                        <EmptyState 
                            icon={Receipt}
                            iconSize={40}
                            message={invoiceSearch || invoiceStatus.length > 0
                                ? "Aucune facture ne correspond à votre recherche"
                                : "Aucune facture trouvée"
                            }
                        />
                    )}
                </section>
            </div>
        </div>
    );
}