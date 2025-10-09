import {zodResolver} from "@hookform/resolvers/zod";
import {useMutation} from "@tanstack/react-query";
import {createFileRoute, useNavigate} from '@tanstack/react-router'
import {createServerFn} from "@tanstack/react-start";
import {useId } from 'react';
import {useForm} from "react-hook-form";
import {z} from 'zod';
import BackLink from '@/components/BackLink';
import Card from '@/components/Card';
import { FormActions, Input } from '@/components/form';
import prisma from "@/lib/db.ts";

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
        const customer = await prisma.customer.create({
            data,
        });

        await prisma.activity.create({
            data: {
                type: 'CUSTOMER_CREATED',
                customer: {
                    connect: {
                        id: customer.id
                    }
                }
            }
        });

        return { type: 'customer', id: customer.id };
    });

export const Route = createFileRoute('/customers/new')({
    component: RouteComponent,
})

function RouteComponent() {
    const navigate = useNavigate();
    const nameId = useId();
    const streetId = useId();
    const cityId = useId();
    const postalCodeId = useId();
    const emailId = useId();
    const phoneId = useId();

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
            <BackLink to="/customers" label='Clients' />
            <h2 className="page-title mb-6">Créer un client</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl">
                <Card variant="section" className="space-y-6">
                    <Input
                        {...register('name')}
                        id={nameId}
                        type="text"
                        label="Nom / Raison sociale *"
                        placeholder='Ex: ACME Corp'
                        error={errors.name?.message}
                    />

                    <div>
                        <p className="label-section">Adresse *</p>

                        <div className="space-y-4">
                            <Input
                                {...register('street')}
                                id={streetId}
                                type="text"
                                label="Numéro et rue"
                                placeholder='Ex: 3 Rue Principale'
                                error={errors.street?.message}
                                className="!mt-0"
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    {...register('postalCode')}
                                    id={postalCodeId}
                                    type="text"
                                    label="Code postal"
                                    placeholder='75008'
                                    error={errors.postalCode?.message}
                                    className="!mt-0"
                                />

                                <Input
                                    {...register('city')}
                                    id={cityId}
                                    type="text"
                                    label="Ville"
                                    placeholder='Paris'
                                    error={errors.city?.message}
                                    className="!mt-0"
                                />
                            </div>
                        </div>
                    </div>

                    <Input
                        {...register('email')}
                        id={emailId}
                        type="email"
                        label="Email"
                        placeholder='contact@acme.com'
                        error={errors.email?.message}
                    />

                    <Input
                        {...register('phone')}
                        id={phoneId}
                        type="tel"
                        label="Téléphone"
                        placeholder='01 23 45 67 89'
                        error={errors.phone?.message}
                    />

                    <FormActions
                        submitLabel="Créer le client"
                        isSubmitting={createClientMut.isPending}
                        onCancel={() => navigate({to: '/customers'})}
                        error={createClientMut.isError ? "Une erreur est survenue lors de la création du client." : undefined}
                    />
                </Card>
            </form>
        </div>
    );
}