import {createFileRoute, Link} from '@tanstack/react-router'
import {Check, Eye, Plus, Send, UserMinus, UserPen, UserPlus, X} from "lucide-react";
import {createServerFn} from "@tanstack/react-start";
import prisma from "@/lib/db.ts";
import {$Enums} from "@prisma/client";
import ActivityType = $Enums.ActivityType;
import {ReactNode} from "react";
import {endOfMonth, formatDistanceToNow, startOfMonth, subMonths} from "date-fns";
import { fr as frLocale } from 'date-fns/locale';

const getData = createServerFn().handler(async () => {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const lastMonth = subMonths(now, 1);
    const lastMonthStart = startOfMonth(lastMonth);
    const lastMonthEnd = endOfMonth(lastMonth);

    const [
        {sentCount, acceptedCount, declinedCount},
        recentActivity,
        pendingQuotes,
        unpaidInvoices,
        currentMonthInvoices,
        lastMonthInvoices
    ] = await Promise.all([
        // stats
        {
            sentCount: await prisma.quote.count({ where: { status: 'SENT' } }),
            acceptedCount: await prisma.quote.count({ where: { status: 'ACCEPTED' } }),
            declinedCount: await prisma.quote.count({ where: { status: 'DECLINED' } }),
        },

        // recent activities
        prisma.activity.findMany({
            take: 3,
            orderBy: { createdAt: 'desc' },
            include: {
                customer: true,
                invoice: true,
                quote: true
            }
        }),

        // pending quotes
        prisma.quote.findMany({
            where: { status: 'SENT' },
            take: 3,
            include: { customer: true },
            orderBy: { expirationDate: 'asc' }
        }),

        // unpaid invoices
        prisma.invoice.findMany({
            where: { status: 'UNPAID' },
            take: 3,
            include: {
                customer: true,
                lines: true
            },
            orderBy: { dueDate: 'asc' }
        }),

        // this month invoices
        prisma.invoice.findMany({
            where: {
                emitDate: { gte: thisMonthStart }
            },
            include: { lines: true }
        }),

        // last month invoices
        prisma.invoice.findMany({
            where: {
                emitDate: {
                    gte: lastMonthStart,
                    lte: lastMonthEnd
                }
            },
            include: { lines: true }
        })
    ]);

    const stats = {
        sent: sentCount,
        accepted: acceptedCount,
        declined: declinedCount
    }

    let current = 0;
    let invoiced = 0;
    let pending = 0;

    currentMonthInvoices.forEach(invoice => {
        const total = invoice.lines.reduce((sum, line) =>
            sum + line.unitPrice * line.quantity, 0
        );

        current += total;

        if (invoice.status === 'PAID') {
            invoiced += total;
        } else if (invoice.status === 'UNPAID') {
            pending += total;
        }
    });

    const lastMonthRevenues = lastMonthInvoices.reduce((sum, invoice) => {
        return sum + invoice.lines.reduce((s, line) =>
            s + line.unitPrice * line.quantity, 0
        );
    }, 0);

    return {
        stats,
        recentActivity,
        pendingQuotes,
        unpaidInvoices,
        revenues: {
            current,
            invoiced,
            pending,
            lastMonthRevenues
        }
    };
});

export const Route = createFileRoute('/')({
    component: App,
    loader: () => getData(),
})

const activityIcons: Record<ActivityType, ReactNode> = {
    QUOTE_CREATED: <Plus className="text-blue-500"/>,
    QUOTE_SENT: <Send className="text-blue-500"/>,
    QUOTE_ACCEPTED: <Check className="text-green-500"/>,
    QUOTE_DECLINED: <X className="text-red-500"/>,
    INVOICE_CREATED: <Plus className="text-blue-500"/>,
    INVOICE_SENT: <Send className="text-blue-500"/>,
    INVOICE_PAID: <Check className="text-green-500"/>,
    INVOICE_CANCELLED: <X className="text-red-500"/>,
    CUSTOMER_CREATED: <UserPlus className="text-blue-500"/>,
    CUSTOMER_DELETED: <UserMinus className="text-red-500"/>,
    CUSTOMER_EDITED: <UserPen className="text-orange-500"/>,
}

const activityText: Record<ActivityType, (id: string) => string> = {
    QUOTE_CREATED: (num) => `Devis n°${num} créé`,
    QUOTE_SENT: (num) => `Devis n°${num} envoyé`,
    QUOTE_ACCEPTED: (num) => `Devis n°${num} accepté`,
    QUOTE_DECLINED: (num) => `Devis n°${num} refusé`,
    INVOICE_CREATED: (num) => `Facture n°${num} créée`,
    INVOICE_SENT: (num) => `Facture n°${num} envoyée`,
    INVOICE_PAID: (num) => `Facture n°${num} payée`,
    INVOICE_CANCELLED: (num) => `Facture n°${num} annulée`,
    CUSTOMER_CREATED: (name) => `Client ${name} créé`,
    CUSTOMER_DELETED: (name) => `Client ${name} supprimé`,
    CUSTOMER_EDITED: (name) => `Client ${name} modifié`,
}

function App() {
    const {stats, recentActivity, pendingQuotes, unpaidInvoices, revenues} = Route.useLoaderData();

    const revenueEvolution = Math.round((revenues.current - revenues.lastMonthRevenues) / revenues.lastMonthRevenues * 100) | 0;

    return <div className="content">
        <h1 className="page-title">Tableau de bord</h1>
        <section className="flex flex-col gap-4 md:flex-row mb-5">
            <div className="stat-card flex-1">
                <div className="stat-card-header">
                    <div className="stat-card-title">
                        <Send className="stat-card-header-icon" size={32} strokeWidth={1}/>
                        <h3>Devis envoyés</h3>
                    </div>

                    <Link to="/documents" search={{quoteStatus:['SENT']}} className="stat-card-view">
                        <Eye strokeWidth={1} className="text-gray-600 hover:text-gray-500"/>
                    </Link>
                </div>
                <p className="stat-card-stat text-blue-500">{stats.sent}</p>
            </div>
            <div className="stat-card flex-1">
                <div className="stat-card-header">
                    <div className="stat-card-title">
                        <Check className="stat-card-header-icon" size={32} strokeWidth={1}/>
                        <h3>Devis acceptés</h3>
                    </div>

                    <Link to="/documents" search={{quoteStatus:['ACCEPTED']}} className="stat-card-view">
                        <Eye strokeWidth={1} className="text-gray-600 hover:text-gray-500"/>
                    </Link>
                </div>
                <p className="stat-card-stat text-green-500">{stats.accepted}</p>
            </div>
            <div className="stat-card flex-1">
                <div className="stat-card-header">
                    <div className="stat-card-title">
                        <X className="stat-card-header-icon" size={32} strokeWidth={1}/>
                        <h3>Devis refusés</h3>
                    </div>

                    <Link to="/documents" search={{quoteStatus:['DECLINED']}} className="stat-card-view">
                        <Eye strokeWidth={1} className="text-gray-600 hover:text-gray-500"/>
                    </Link>
                </div>
                <p className="stat-card-stat text-red-500">{stats.declined}</p>
            </div>
        </section>

        <div className="flex flex-col md:flex-row gap-4">
            <section className="section-card mb-4 flex-1">
                <h2 className="section-card-title">Chiffre d'affaires</h2>
                <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-bold text-blue-600">{revenues.current}€</p>
                    <span
                        className={`text-sm ${revenueEvolution >= 0 ? 'text-green-500' : 'text-red-500'} font-medium`}>{revenueEvolution}% vs mois dernier</span>
                </div>
                <div className="flex gap-12">
                    <div>
                        <p className="text-sm text-gray-500">Facturé</p>
                        <p className="text-2xl font-semibold text-gray-800">{revenues.invoiced}€</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">En attente</p>
                        <p className="text-2xl font-semibold text-orange-500">{revenues.pending}€</p>
                    </div>
                </div>
            </section>
            <section className="section-card flex-1/4 mb-4">
                <div className="flex justify-between items-center">
                    <h2 className="section-card-title">Factures impayées</h2>
                    <Link to='/documents' search={{invoiceStatus:['UNPAID']}} className="text-gray-500 hover:underline">Voir tout</Link>
                </div>
                <div className="space-y-3 mt-3">
                    {
                        unpaidInvoices.length > 0 ?
                        unpaidInvoices.map((invoice) => {
                                const now = new Date();
                                const dueDate = new Date(invoice.dueDate);
                                const diffTime = now.getTime() - dueDate.getTime();
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                const isLate = diffDays > 0;
                                const totalAmount = invoice.lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);

                                return <Link to="/invoices/$invoiceId" params={{invoiceId: invoice.id}} key={invoice.num}
                                             className={`flex items-center justify-between p-3 border-l-4 ${isLate ? 'border-red-500 bg-red-50 hover:bg-red-50/75' : 'border-orange-500 bg-orange-50 hover:bg-orange-50/75'} rounded`}>
                                    <div>
                                        <p className="font-medium">Facture #{invoice.num}</p>
                                        <p className="text-sm text-gray-600">{invoice.customer.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-800">{totalAmount}€</p>
                                        <p className={`text-xs ${isLate ? 'text-red-600' : 'text-orange-600'}`}>
                                            {isLate
                                                ? `Retard: ${formatDistanceToNow(dueDate, {locale: frLocale})}`
                                                : `Échéance: dans ${formatDistanceToNow(dueDate, {locale: frLocale})}`
                                            }
                                        </p>
                                    </div>
                                </Link>
                            }
                        ) : (
                                <p className="font-light text-gray-400">Aucune facture impayée.</p>
                            )
                    }
                </div>
            </section>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
            <section className="section-card flex-1">
                <h2 className="section-card-title">Activité récente</h2>
                <div className="space-y-3 mt-3">
                    {
                        recentActivity.length > 0 ? recentActivity.map((activity, i) => (
                            <Link to="/" key={i}
                                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                                {activityIcons[activity.type]}
                                <div className="flex-1">
                                    <p className="font-medium">{activityText[activity.type](activity.quote?.num || activity.invoice?.num || activity.customer?.name || activity.customer?.id || '')}</p>
                                    <p className="text-sm text-gray-500"></p>
                                </div>
                                <span className="text-xs text-gray-400">{formatDistanceToNow(activity.createdAt, {locale: frLocale})}</span>
                            </Link>
                        )) : (
                            <p className="font-light text-gray-400">Aucune activité récente.</p>
                        )
                    }
                </div>
            </section>
            <section className="section-card flex-1">
                <div className="flex justify-between items-center">
                    <h2 className="section-card-title">Devis en attente</h2>
                    <Link to='/documents' search={{quoteStatus:['SENT']}} className="text-gray-500 hover:underline">Voir tout</Link>
                </div>
                <div className="space-y-3 mt-3">
                    {
                        pendingQuotes.length > 0 ?
                            pendingQuotes.map((quote) => {
                                    const dueDate = new Date(quote.expirationDate);

                                    return <Link to='/quotes/$quoteId' params={{quoteId: quote.id}} key={quote.num}
                                                 className="flex items-center justify-between p-3 border border-gray-200 rounded hover:bg-gray-50">
                                        <div>
                                            <p className="font-medium">Devis #{quote.num}</p>
                                            <p className="text-sm text-gray-500">{quote.customer.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-800">{quote.totalAmount}€</p>
                                            <p className="text-xs text-orange-500">Expire dans {formatDistanceToNow(dueDate, {locale: frLocale})}</p>
                                        </div>
                                    </Link>
                                }
                            ) : (
                                <p className="font-light text-gray-400">Aucun devis en attente.</p>
                            )
                    }
                </div>
            </section>
        </div>
    </div>
}