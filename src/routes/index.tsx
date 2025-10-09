import {createFileRoute, Link} from '@tanstack/react-router'
import {createServerFn} from "@tanstack/react-start";
import {endOfMonth, startOfMonth, subMonths} from "date-fns";
import {Check, Eye, Plus, Send, X} from "lucide-react";
import { ActivityCard } from "@/components/ActivityCard";
import Card from "@/components/Card.tsx";
import EmptyState from "@/components/EmptyState";
import StatCard from "@/components/StatCard.tsx";
import { UnpaidInvoiceCard } from "@/components/UnpaidInvoiceCard";
import prisma from "@/lib/db.ts";
import { calculateRevenues, calculateTotalRevenue } from "@/lib/revenueHelpers";
import { calculateTotal, formatRelativeDate } from "@/lib/utils";

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
            sentCount: await prisma.quote.count({where: {status: 'SENT'}}),
            acceptedCount: await prisma.quote.count({where: {status: 'ACCEPTED'}}),
            declinedCount: await prisma.quote.count({where: {status: 'DECLINED'}}),
        },

        // recent activities
        prisma.activity.findMany({
            take: 3,
            orderBy: {createdAt: 'desc'},
            include: {
                customer: true,
                invoice: true,
                quote: true
            }
        }),

        // pending quotes
        prisma.quote.findMany({
            where: {status: 'SENT'},
            take: 3,
            include: {customer: true, lines: true},
            orderBy: {expirationDate: 'asc'}
        }),

        // unpaid invoices
        prisma.invoice.findMany({
            where: {status: 'UNPAID'},
            take: 3,
            include: {
                customer: true,
                lines: true
            },
            orderBy: {dueDate: 'asc'}
        }),

        // this month invoices
        prisma.invoice.findMany({
            where: {
                emitDate: {gte: thisMonthStart}
            },
            include: {lines: true}
        }),

        // last month invoices
        prisma.invoice.findMany({
            where: {
                emitDate: {
                    gte: lastMonthStart,
                    lte: lastMonthEnd
                }
            },
            include: {lines: true}
        })
    ]);

    const stats = {
        sent: sentCount,
        accepted: acceptedCount,
        declined: declinedCount
    }

    // Calcul des revenus du mois en cours
    const { total: current, invoiced, pending } = calculateRevenues(currentMonthInvoices);

    // Calcul des revenus du mois dernier
    const lastMonthRevenues = calculateTotalRevenue(lastMonthInvoices);

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


function App() {
    const {stats, recentActivity, pendingQuotes, unpaidInvoices, revenues} = Route.useLoaderData();

    const revenueEvolution = Math.round((revenues.current - revenues.lastMonthRevenues) / revenues.lastMonthRevenues * 100) | 0;

    return <div className="content">
        <h1 className="page-title">Tableau de bord</h1>
        <section className="flex flex-col gap-4 md:flex-row mb-5">
            <StatCard
                title="Devis envoyés"
                icon={Send}
                value={stats.sent}
                valueColor="text-blue-500"
                action={
                    <Link to="/documents" search={{quoteStatus: ['SENT']}}>
                        <Eye strokeWidth={1} className="text-gray-600 hover:text-gray-500"/>
                    </Link>
                }
            />
            <StatCard
                title="Devis acceptés"
                icon={Check}
                value={stats.accepted}
                valueColor="text-green-500"
                action={
                    <Link to="/documents" search={{quoteStatus: ['ACCEPTED']}}>
                        <Eye strokeWidth={1} className="text-gray-600 hover:text-gray-500"/>
                    </Link>
                }
            />
            <StatCard
                title="Devis refusés"
                icon={X}
                value={stats.declined}
                valueColor="text-red-500"
                action={
                    <Link to="/documents" search={{quoteStatus: ['DECLINED']}}>
                        <Eye strokeWidth={1} className="text-gray-600 hover:text-gray-500"/>
                    </Link>
                }
            />
        </section>

        <div className="flex flex-col md:flex-row gap-4">
            <Card variant="section" className="mb-4 flex-1">
                <h2 className="section-card-title">Chiffre d'affaires</h2>
                <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-bold text-blue-600">{revenues.current}€</p>
                    <span
                        className={`text-sm ${revenueEvolution >= 0 ? 'text-green-500' : 'text-red-500'} font-medium`}>{revenueEvolution}% vs mois dernier</span>
                </div>
                <div className="flex gap-12">
                    <div>
                        <p className="text-label">Facturé</p>
                        <p className="text-2xl font-semibold text-gray-800">{revenues.invoiced}€</p>
                    </div>
                    <div>
                        <p className="text-label">En attente</p>
                        <p className="text-2xl font-semibold text-orange-500">{revenues.pending}€</p>
                    </div>
                </div>
            </Card>
            <Card variant="section" className="flex-1/4 mb-4">
                <div className="flex justify-between items-center">
                    <h2 className="section-card-title">Factures impayées</h2>
                    <Link to='/documents' search={{invoiceStatus: ['UNPAID']}}
                          className="text-gray-500 hover:underline">Voir tout</Link>
                </div>
                <div className="space-y-3 mt-3">
                    {
                        unpaidInvoices.length > 0 ?
                            unpaidInvoices.map((invoice) => (
                                <UnpaidInvoiceCard key={invoice.num} invoice={invoice} />
                            )) : (
                                <EmptyState 
                                    icon={Eye}
                                    iconSize={32}
                                    message="Aucune facture impayée."
                                    className="py-8"
                                />
                            )
                    }
                </div>
            </Card>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
            <Card variant="section" className="flex-1">
                <h2 className="section-card-title">Activité récente</h2>
                <div className="space-y-3 mt-3">
                    {
                        recentActivity.length > 0 ? recentActivity.map((activity) => (
                            <ActivityCard key={activity.id} activity={activity} />
                        )) : (
                            <EmptyState 
                                icon={Plus}
                                iconSize={32}
                                message="Aucune activité récente."
                                className="py-8"
                            />
                        )
                    }
                </div>
            </Card>
            <Card variant="section" className="flex-1">
                <div className="flex justify-between items-center">
                    <h2 className="section-card-title">Devis en attente</h2>
                    <Link to='/documents' search={{quoteStatus: ['SENT']}} className="text-gray-500 hover:underline">Voir
                        tout</Link>
                </div>
                <div className="space-y-3 mt-3">
                    {
                        pendingQuotes.length > 0 ?
                            pendingQuotes.map((quote) => {
                                    const dueDate = new Date(quote.expirationDate);

                                    return <Link to='/quotes/$quoteId' params={{quoteId: quote.id}} key={quote.num}
                                                 className="flex items-center justify-between p-3 border border-gray-200 rounded hover:bg-gray-50">
                                        <div>
                                            <p className="text-value">Devis #{quote.num}</p>
                                            <p className="text-muted">{quote.customer.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-800">{quote.totalAmount ? quote.totalAmount.toFixed(2) : calculateTotal(quote.lines).toFixed(2)}€</p>
                                            <p className="text-xs text-orange-500">Expire {formatRelativeDate(dueDate)}</p>
                                        </div>
                                    </Link>
                                }
                            ) : (
                                <EmptyState 
                                    icon={Send}
                                    iconSize={32}
                                    message="Aucun devis en attente."
                                    className="py-8"
                                />
                            )
                    }
                </div>
            </Card>
        </div>
    </div>
}