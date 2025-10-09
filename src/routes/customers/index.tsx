import {createFileRoute, Link} from '@tanstack/react-router'
import {createServerFn} from "@tanstack/react-start";
import {Mail, MapPin, Phone, Users} from "lucide-react";
import Card from "@/components/Card.tsx";
import EmptyState from "@/components/EmptyState";
import InfoItem from "@/components/InfoItem.tsx";
import prisma from "@/lib/db.ts";

const getData = createServerFn().handler(async () => {
    const customers = await prisma.customer.findMany();

    return { customers };
});

export const Route = createFileRoute('/customers/')({
  component: RouteComponent,
    loader: () => getData()
})

function RouteComponent() {
  const {customers} = Route.useLoaderData();

    return <div className="content">
        <div className="flex items-center justify-between mb-4">
            <h2 className="page-title m-0">Vos clients</h2>
            <Link to='/customers/new' className="new-btn">Nouveau</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {
                customers.length > 0 ? customers.map(customer => (
                    <Link
                        to="/customers/$customerId"
                        params={{ customerId: customer.id }}
                        key={customer.id}
                        className="group"
                    >
                        <Card variant="section" hover className="p-5 group-hover:text-blue-600">
                            <div className="flex items-start justify-between mb-3">
                                <h3 className="text-value text-lg group-hover:text-blue-600 transition-colors">
                                    {customer.name}
                                </h3>
                                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">
                                    Client
                                </span>
                            </div>

                            <div className="space-y-2 text-sm">
                                <InfoItem icon={MapPin}>
                                    <address className="not-italic">{customer.address}</address>
                                </InfoItem>

                                {customer.phone && (
                                    <InfoItem icon={Phone}>
                                        <p>{customer.phone}</p>
                                    </InfoItem>
                                )}

                                {customer.email && (
                                    <InfoItem icon={Mail}>
                                        <p className="truncate">{customer.email}</p>
                                    </InfoItem>
                                )}
                            </div>
                        </Card>
                    </Link>
                )) : (
                    <EmptyState 
                        icon={Users}
                        message="Aucun client pour le moment"
                        className="col-span-full"
                    />
                )
            }
        </div>
  </div>
}
