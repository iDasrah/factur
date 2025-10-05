import {createFileRoute, Link, useNavigate} from '@tanstack/react-router'
import {createServerFn} from "@tanstack/react-start";
import prisma from "@/lib/db.ts";
import {z} from 'zod';
import {useMutation} from "@tanstack/react-query";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {ArrowLeft} from "lucide-react";

const customerSchema = z.object({
    name: z.string().min(1, "Le nom est requis"),
    street: z.string().min(1, "La rue est requise"),
    city: z.string().min(1, "La ville est requise"),
    postalCode: z.string().min(1, "Le code postal est requis"),
    email: z.email("Email invalide").optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal(''))
});

type CustomerFormData = z.infer<typeof customerSchema>;

const createCustomer = createServerFn({method: 'POST'})
    .inputValidator((data: CustomerFormData) => {
        const address = `${data.street}, ${data.postalCode} ${data.city}`;
        return {
            name: data.name,
            address,
            email: data.email || null,
            phone: data.phone || null
        };
    })
    .handler(async ({data}) => {
        return await prisma.customer.create({
            data,
        });
    });

export const Route = createFileRoute('/customers/new')({
    component: RouteComponent,
})

function RouteComponent() {
    const navigate = useNavigate();

    const createClientMut = useMutation({
        mutationKey: ['create', 'customer'],
        mutationFn: (data: CustomerFormData) => createCustomer({data}),
        onSuccess: () => {
            navigate({to: '/customers'});
        }
    });

    const { register, handleSubmit, formState: { errors } } = useForm<CustomerFormData>({
        resolver: zodResolver(customerSchema)
    });

    const onSubmit = (data: CustomerFormData) => {
        createClientMut.mutate(data);
    };

    return (
        <div className="content">
            <Link
                to='/customers'
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
                <ArrowLeft size={20} />
                Retour aux clients
            </Link>

            <h2 className="page-title mb-6">Créer un client</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl">
                <div className="section-card space-y-6">
                    <div>
                        <label htmlFor='name' className="label">
                            Nom / Raison sociale *
                        </label>
                        <input
                            {...register('name')}
                            id="name"
                            type="text"
                            placeholder='Ex: ACME Corp'
                            className={`input ${
                                errors.name ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        {errors.name && (
                            <p className="error-message">{errors.name.message}</p>
                        )}
                    </div>

                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-3">Adresse *</p>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor='street' className="address-label">
                                    Numéro et rue
                                </label>
                                <input
                                    {...register('street')}
                                    id="street"
                                    type="text"
                                    placeholder='Ex: 3 Rue Principale'
                                    className={`input ${
                                        errors.street ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                                {errors.street && (
                                    <p className="error-message">{errors.street.message}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor='postalCode' className="address-label">
                                        Code postal
                                    </label>
                                    <input
                                        {...register('postalCode')}
                                        id="postalCode"
                                        type="text"
                                        placeholder='75008'
                                        className={`input ${
                                            errors.postalCode ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.postalCode && (
                                        <p className="error-message">{errors.postalCode.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor='city' className="address-label">
                                        Ville
                                    </label>
                                    <input
                                        {...register('city')}
                                        id="city"
                                        type="text"
                                        placeholder='Paris'
                                        className={`input ${
                                            errors.city ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.city && (
                                        <p className="error-message">{errors.city.message}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label htmlFor='email' className="label">
                            Email
                        </label>
                        <input
                            {...register('email')}
                            id="email"
                            type="email"
                            placeholder='contact@acme.com'
                            className={`input ${
                                errors.email ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        {errors.email && (
                            <p className="error-message">{errors.email.message}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor='phone' className="label">
                            Téléphone
                        </label>
                        <input
                            {...register('phone')}
                            id="phone"
                            type="tel"
                            placeholder='01 23 45 67 89'
                            className={`input ${
                                errors.phone ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        {errors.phone && (
                            <p className="error-message">{errors.phone.message}</p>
                        )}
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={createClientMut.isPending}
                            className="cursor-pointer px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {createClientMut.isPending ? 'Création...' : 'Créer le client'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate({to: '/customers'})}
                            className="cursor-pointer px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Annuler
                        </button>
                    </div>

                    {createClientMut.isError && (
                        <p className="text-red-500 text-sm">
                            Une erreur est survenue lors de la création du client.
                        </p>
                    )}
                </div>
            </form>
        </div>
    );
}