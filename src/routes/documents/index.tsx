import {createFileRoute, Link} from '@tanstack/react-router'
import {createServerFn} from "@tanstack/react-start";
import prisma from "@/lib/db.ts";
import {FileText, Receipt, Search, SlidersHorizontal, X} from "lucide-react";
import {formatDate} from "date-fns";
import {fr as frLocale} from "date-fns/locale/fr";
import {statusColors, statusLabels} from "@/lib/constants.ts";
import {useMemo, useState} from "react";

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

export const Route = createFileRoute('/documents/')({
    component: RouteComponent,
    loader: () => getData()
})

function RouteComponent() {
    const {invoices, quotes} = Route.useLoaderData();

    const [quoteSearch, setQuoteSearch] = useState("");
    const [quoteStatusFilter, setQuoteStatusFilter] = useState<string[]>([]);

    const [invoiceSearch, setInvoiceSearch] = useState("");
    const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string[]>([]);

    const filteredQuotes = useMemo(() => {
        return quotes.filter(quote => {
            const matchSearch = !quoteSearch ||
                quote.num.toLowerCase().includes(quoteSearch.toLowerCase()) ||
                quote.customer.name.toLowerCase().includes(quoteSearch.toLowerCase()) ||
                quote.title?.toLowerCase().includes(quoteSearch.toLowerCase());

            const matchStatus = quoteStatusFilter.length === 0 ||
                quoteStatusFilter.includes(quote.status);

            return matchSearch && matchStatus;
        });
    }, [quotes, quoteSearch, quoteStatusFilter]);

    const filteredInvoices = useMemo(() => {
        return invoices.filter(invoice => {
            const matchSearch = !invoiceSearch ||
                invoice.num.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
                invoice.customer.name.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
                invoice.title?.toLowerCase().includes(invoiceSearch.toLowerCase());

            const matchStatus = invoiceStatusFilter.length === 0 ||
                invoiceStatusFilter.includes(invoice.status);

            return matchSearch && matchStatus;
        });
    }, [invoices, invoiceSearch, invoiceStatusFilter]);

    const toggleQuoteStatus = (status: string) => {
        setQuoteStatusFilter(prev =>
            prev.includes(status)
                ? prev.filter(s => s !== status)
                : [...prev, status]
        );
    };

    const toggleInvoiceStatus = (status: string) => {
        setInvoiceStatusFilter(prev =>
            prev.includes(status)
                ? prev.filter(s => s !== status)
                : [...prev, status]
        );
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
                            onChange={(e) => setQuoteSearch(e.target.value)}
                        />
                        {quoteSearch && (
                            <button
                                onClick={() => setQuoteSearch("")}
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
                            {['DRAFT', 'SENT', 'ACCEPTED', 'DECLINED'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => toggleQuoteStatus(status)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                        quoteStatusFilter.includes(status)
                                            ? statusColors[status]
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {statusLabels[status]}
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
                                {quoteSearch || quoteStatusFilter.length > 0
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
                            onChange={(e) => setInvoiceSearch(e.target.value)}
                        />
                        {invoiceSearch && (
                            <button
                                onClick={() => setInvoiceSearch("")}
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
                                    onClick={() => toggleInvoiceStatus(status)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                        invoiceStatusFilter.includes(status)
                                            ? statusColors[status]
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {statusLabels[status]}
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
                                {invoiceSearch || invoiceStatusFilter.length > 0
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