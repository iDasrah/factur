import {createFileRoute, Link, notFound} from '@tanstack/react-router'
import {createServerFn} from "@tanstack/react-start";
import {formatDate} from "date-fns";
import { fr as frLocale } from 'date-fns/locale';
import {FileText, Mail, MapPin, Phone, Receipt } from "lucide-react";
import BackLink from '@/components/BackLink';
import Card from "@/components/Card.tsx";
import EmptyState from "@/components/EmptyState";
import InfoItem from "@/components/InfoItem.tsx";
import CustomerNotFound from '@/components/notFound/CustomerNotFound';
import StatusBadge from "@/components/StatusBadge";
import prisma from "@/lib/db.ts";
import { calculateTotal } from '@/lib/utils';

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
                    include: { lines: true },
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
    notFoundComponent: CustomerNotFound
})

function RouteComponent() {
    const {customer} = Route.useLoaderData();

    return (
        <div className="content">
            <BackLink to="/customers" label='Clients' />
            <h2 className="page-title mb-6">{customer.name}</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card variant="section" className="lg:col-span-1">
                    <h3 className="text-xl font-semibold mb-4">Informations</h3>
                    <div className="space-y-3">
                        <InfoItem icon={MapPin} iconSize={20}>
                            <address className="not-italic">{customer.address}</address>
                        </InfoItem>
                        {customer.phone && (
                            <InfoItem icon={Phone} iconSize={20}>
                                <a href={`tel:${customer.phone}`} className="hover:text-blue-600">
                                    {customer.phone}
                                </a>
                            </InfoItem>
                        )}
                        {customer.email && (
                            <InfoItem icon={Mail} iconSize={20}>
                                <a href={`mailto:${customer.email}`} className="hover:text-blue-600 truncate">
                                    {customer.email}
                                </a>
                            </InfoItem>
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
                </Card>

                <div className="lg:col-span-2 space-y-6">
                    <Card variant="section">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold">Devis</h3>
                            <FileText size={20} className="text-gray-400" />
                        </div>

                        {customer.quotes.length > 0 ? (
                            <div className="flex flex-col gap-2 max-h-70 overflow-y-auto pr-2">
                                {customer.quotes.map(quote => (
                                    <Link
                                        to="/quotes/$quoteId"
                                        params={{ quoteId: quote.id }}
                                        key={quote.num}
                                    >
                                        <Card variant="document">
                                            <div className="list-item-header mb-2">
                                                <h4 className="font-semibold text-gray-900">Devis n°{quote.num}</h4>
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
                                message="Aucun devis pour ce client"
                                className="py-8"
                            />
                        )}
                    </Card>

                    <Card variant="section">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold">Factures</h3>
                            <Receipt size={20} className="text-gray-400" />
                        </div>

                        {customer.invoices.length > 0 ? (
                            <div className="flex flex-col gap-2 max-h-70 overflow-y-auto pr-2">
                                {customer.invoices.map(invoice => 
                                    (
                                        <Link
                                            to="/invoices/$invoiceId"
                                            params={{ invoiceId: invoice.id }}
                                            key={invoice.num}
                                        >
                                            <Card variant="document">
                                                <div className="list-item-header mb-2">
                                                    <h4 className="font-semibold text-gray-900">Facture n°{invoice.num}</h4>
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
                                message="Aucune facture pour ce client"
                                className="py-8"
                            />
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}