import {createFileRoute, Link} from '@tanstack/react-router'
import {Check, Eye, Plus, Send, X} from "lucide-react";

export const Route = createFileRoute('/')({
    component: App,
})

enum ActivityType {
    SENT,
    CREATED
}

const activityIcons = [<Send size={20} className="text-blue-500"/>, <Plus className="text-blue-500"/>];
const activityText = [
    (numQuote: string) => `Devis n°${numQuote} envoyé`,
    (numQuote: string) => `Devis n°${numQuote} créé`,
];

function App() {
    const data = {
        stats: {
            sent: 3,
            accepted: 1,
            declined: 0
        },
        activities: [
            {
                type: ActivityType.CREATED,
                numQuote: "2025-053",
                clientName: 'ACME',
                totalPrice: 1000,
                date: 'Il y a 3h'
            },
            {
                type: ActivityType.SENT,
                numQuote: "2025-047",
                clientName: 'Google',
                totalPrice: 75000,
                date: 'Il y a 7j'
            }
        ],
        revenue: {
            money: 420,
            invoiced: 200,
            pending: 220,
            lastMonth: 420
        },
        pendingQuotes: [
            {
                numQuote: "2025-047",
                clientName: 'Google',
                totalPrice: 75000,
                expirationDate: new Date('2025-10-9')
            }
        ],
        pendingInvoices: [
            {
                numQuote: "2025-50",
                clientName: 'Lirobi',
                totalPrice: 400,
                dueDate: new Date('2025-9-24')
            }
        ]
    };

    const revenueEvolution = Math.round((data.revenue.money - data.revenue.lastMonth) / data.revenue.lastMonth * 100)

    return <div className="p-4 w-full">
        <h1 className="font-bold text-blue-600 text-center text-4xl mb-8 md:hidden">Factur</h1>
        <h1 className="font-bold text-2xl mb-4">Tableau de bord</h1>
        <section className="flex flex-col gap-4 md:flex-row mb-5">
            <div className="stat-card flex-1">
                <div className="stat-card-header">
                    <div className="stat-card-title">
                        <Send className="stat-card-header-icon" size={32} strokeWidth={1}/>
                        <h3>Devis envoyés</h3>
                    </div>

                    <Link to="/" className="stat-card-view">
                        <Eye strokeWidth={1} className="text-gray-600 hover:text-gray-500"/>
                    </Link>
                </div>
                <p className="stat-card-stat text-blue-500">{data.stats.sent}</p>
            </div>
            <div className="stat-card flex-1">
                <div className="stat-card-header">
                    <div className="stat-card-title">
                        <Check className="stat-card-header-icon" size={32} strokeWidth={1}/>
                        <h3>Devis acceptés</h3>
                    </div>

                    <Link to="/" className="stat-card-view">
                        <Eye strokeWidth={1} className="text-gray-600 hover:text-gray-500"/>
                    </Link>
                </div>
                <p className="stat-card-stat text-green-500">{data.stats.accepted}</p>
            </div>
            <div className="stat-card flex-1">
                <div className="stat-card-header">
                    <div className="stat-card-title">
                        <X className="stat-card-header-icon" size={32} strokeWidth={1}/>
                        <h3>Devis refusés</h3>
                    </div>

                    <Link to="/" className="stat-card-view">
                        <Eye strokeWidth={1} className="text-gray-600 hover:text-gray-500"/>
                    </Link>
                </div>
                <p className="stat-card-stat text-red-500">{data.stats.declined}</p>
            </div>
        </section>

        <div className="flex flex-col md:flex-row gap-4">
            <section className="dashboard-section-card mb-4 flex-1">
                <h2 className="dashboard-section-card-title">Chiffre d'affaires</h2>
                <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-bold text-blue-600">{data.revenue.money}€</p>
                    <span
                        className={`text-sm ${revenueEvolution >= 0 ? 'text-green-500' : 'text-red-500'} font-medium`}>{revenueEvolution}% vs mois dernier</span>
                </div>
                <div className="flex gap-12">
                    <div>
                        <p className="text-sm text-gray-500">Facturé</p>
                        <p className="text-2xl font-semibold text-gray-800">{data.revenue.invoiced}€</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">En attente</p>
                        <p className="text-2xl font-semibold text-orange-500">{data.revenue.pending}€</p>
                    </div>
                </div>
            </section>
            <section className="dashboard-section-card flex-1/4 mb-4">
                <div className="flex justify-between items-center">
                    <h2 className="dashboard-section-card-title">Factures impayées</h2>
                    <Link to='/' className="text-gray-500 hover:underline">Voir tout</Link>
                </div>
                <div className="space-y-3 mt-3">
                    {
                        data.pendingInvoices.map((pendingInvoice) => {
                                const now = new Date();
                                const dueDate = new Date(pendingInvoice.dueDate);
                                const diffTime = now.getTime() - dueDate.getTime();
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                const isLate = diffDays > 0;

                                return <Link to="/" key={pendingInvoice.numQuote}
                                            className={`flex items-center justify-between p-3 border-l-4 ${isLate ? 'border-red-500 bg-red-50 hover:bg-red-50/75' : 'border-orange-500 bg-orange-50 hover:bg-orange-50/75'} rounded`}>
                                    <div>
                                        <p className="font-medium">Facture #{pendingInvoice.numQuote}</p>
                                        <p className="text-sm text-gray-600">{pendingInvoice.clientName}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-800">{pendingInvoice.totalPrice}€</p>
                                        <p className={`text-xs ${isLate ? 'text-red-600' : 'text-orange-600'}`}>
                                            {isLate
                                                ? `Retard: ${diffDays} jour${diffDays > 1 ? 's' : ''}`
                                                : `Échéance: dans ${Math.abs(diffDays)} jour${Math.abs(diffDays) > 1 ? 's' : ''}`
                                            }
                                        </p>
                                    </div>
                                </Link>
                            }
                        )
                    }
                </div>
            </section>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
            <section className="dashboard-section-card flex-1">
                <h2 className="dashboard-section-card-title">Activité récente</h2>
                <div className="space-y-3 mt-3">
                    {
                        data.activities.map((activity, i) => (
                            <Link to="/" key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                                {activityIcons[activity.type]}
                                <div className="flex-1">
                                    <p className="font-medium">{activityText[activity.type].call(null, activity.numQuote)}</p>
                                    <p className="text-sm text-gray-500">{activity.clientName} - {activity.totalPrice}€</p>
                                </div>
                                <span className="text-xs text-gray-400">{activity.date}</span>
                            </Link>
                        ))
                    }
                </div>
            </section>
            <section className="dashboard-section-card flex-1">
                <div className="flex justify-between items-center">
                    <h2 className="dashboard-section-card-title">Devis en attente</h2>
                    <Link to='/' className="text-gray-500 hover:underline">Voir tout</Link>
                </div>
                <div className="space-y-3 mt-3">
                    {
                        data.pendingQuotes.map((pendingQuote) => {
                                const now = new Date();
                                const dueDate = new Date(pendingQuote.expirationDate);
                                const diffTime = dueDate.getTime() - now.getTime();
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                            return <Link to='/' key={pendingQuote.numQuote}
                                  className="flex items-center justify-between p-3 border border-gray-200 rounded hover:bg-gray-50">
                                <div>
                                    <p className="font-medium">Devis #{pendingQuote.numQuote}</p>
                                    <p className="text-sm text-gray-500">{pendingQuote.clientName}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-gray-800">{pendingQuote.totalPrice}€</p>
                                    <p className="text-xs text-orange-500">Expire dans {diffDays} jours</p>
                                </div>
                            </Link>
                        }
                        )
                    }
                </div>
            </section>
        </div>
    </div>
}