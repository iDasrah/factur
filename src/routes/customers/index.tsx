import {createFileRoute, Link} from '@tanstack/react-router'
import {createServerFn} from "@tanstack/react-start";
import prisma from "@/lib/db.ts";
import {Mail, MapPin, Phone, Users} from "lucide-react";

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
                        className="section-card p-5 hover:shadow-md hover:border-blue-300 transition-all group"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                                {customer.name}
                            </h3>
                            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">
                        Client
                    </span>
                        </div>

                        <div className="space-y-2 text-sm">
                            <div className="customer-card-info">
                                <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                                <address className="not-italic">{customer.address}</address>
                            </div>

                            {customer.phone && (
                                <div className="customer-card-info">
                                    <Phone size={16} className="flex-shrink-0" />
                                    <p>{customer.phone}</p>
                                </div>
                            )}

                            {customer.email && (
                                <div className="customer-card-info">
                                    <Mail size={16} className="flex-shrink-0" />
                                    <p className="truncate">{customer.email}</p>
                                </div>
                            )}
                        </div>
                    </Link>
                )) : (
                    <div className="col-span-full text-center py-12">
                        <Users className="mx-auto text-gray-300 mb-3" size={48} />
                        <p className="text-gray-400">Aucun client pour le moment</p>
                    </div>
                )
            }
        </div>
  </div>
}
