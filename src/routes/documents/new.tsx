import {zodResolver} from "@hookform/resolvers/zod";
import {useMutation, useQuery} from "@tanstack/react-query";
import {createFileRoute, useNavigate} from '@tanstack/react-router'
import {createServerFn} from "@tanstack/react-start";
import {Plus, Trash2} from "lucide-react";
import {useId, useState} from "react";
import {useFieldArray, useForm} from "react-hook-form";
import {z} from 'zod';
import BackLink from "@/components/BackLink";
import Card from "@/components/Card";
import { FormActions, Input, Select } from "@/components/form";
import prisma from "@/lib/db.ts";
import { calculateTotal } from "@/lib/utils";

const documentLineSchema = z.object({
    description: z.string().min(1, "La description est requise"),
    unitPrice: z.number().min(0, "Le prix doit être positif"),
    quantity: z.number().int().min(1, "La quantité doit être au moins 1"),
});

const documentSchema = z.object({
    type: z.enum(['quote', 'invoice']),
    customerId: z.string().min(1, "Sélectionnez un client"),
    title: z.string().optional(),
    notes: z.string().optional(),
    lines: z.array(documentLineSchema).min(1, "Ajoutez au moins une ligne"),
});

type DocumentFormData = z.infer<typeof documentSchema>;

const getCustomers = createServerFn().handler(async () => {
    return await prisma.customer.findMany({
        orderBy: {name: 'asc'}
    });
});

const createDocument = createServerFn({method: 'POST'})
    .inputValidator((data: DocumentFormData) => data)
    .handler(async ({data}) => {
        const totalAmount = calculateTotal(data.lines);

        if (data.type === 'quote') {
            const quote = await prisma.quote.create({
                data: {
                    num: `2025-${String(Date.now()).slice(-3)}`,
                    customerId: data.customerId,
                    title: data.title || null,
                    notes: data.notes || null,
                    totalAmount,
                    status: 'DRAFT',
                    lines: {
                        create: data.lines
                    }
                }
            });

            await prisma.activity.create({
                data: {
                    type: 'QUOTE_CREATED',
                    quote: {
                        connect: {
                            id: quote.id
                        }
                    }
                }
            });

            return { type: 'quote', id: quote.id };
        } else {
            const invoice = await prisma.invoice.create({
                data: {
                    num: `2025-${String(Date.now()).slice(-3)}`,
                    customerId: data.customerId,
                    title: data.title || null,
                    status: 'UNPAID',
                    lines: {
                        create: data.lines
                    }
                }
            });

            await prisma.activity.create({
                data: {
                   type: 'INVOICE_CREATED',
                   invoice: {
                       connect: {
                           id: invoice.id
                       }
                   }
                }
            });

            return { type: 'invoice', id: invoice.id };
        }
    });

export const Route = createFileRoute('/documents/new')({
    component: RouteComponent,
})

function RouteComponent() {
    const navigate = useNavigate();
    const [documentType, setDocumentType] = useState<'quote' | 'invoice'>('quote');
    const documentTypeId = useId();
    const customerId = useId();
    const titleId = useId();
    const linesId = useId();
    const notesId = useId();

    const { data: customers } = useQuery({
        queryKey: ['customers'],
        queryFn: () => getCustomers()
    });

    const createDocMut = useMutation({
        mutationKey: ['create', 'document'],
        mutationFn: (data: DocumentFormData) => createDocument({data}),
        onSuccess: (result) => {
            if (result.type === 'quote') {
                navigate({to: '/quotes/$quoteId', params: { quoteId: result.id }});
            } else {
                navigate({to: '/invoices/$invoiceId', params: { invoiceId: result.id }});
            }
        }
    });

    const { register, control, handleSubmit, watch, formState: { errors } } = useForm<DocumentFormData>({
        resolver: zodResolver(documentSchema),
        defaultValues: {
            type: 'quote',
            lines: [{ description: '', unitPrice: 0, quantity: 1 }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'lines'
    });

    const lines = watch('lines');
    const total = calculateTotal(lines);

    const onSubmit = (data: DocumentFormData) => {
        createDocMut.mutate({ ...data, type: documentType });
    };

    return (
        <div className="content">
            <BackLink to="/documents" label='Documents' />
            <h2 className="page-title mb-6">Créer un document</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl">
                <Card variant="section" className="mb-6">
                    <label htmlFor={documentTypeId} className="label">
                        Type de document *
                    </label>
                    <div className="flex gap-4" id={documentTypeId}>
                        <button
                            type="button"
                            onClick={() => setDocumentType('quote')}
                            className={`document-type ${
                                documentType === 'quote'
                                    ? 'selected-document-type'
                                    : 'unselected-document-type'
                            }`}
                        >
                            Devis
                        </button>
                        <button
                            type="button"
                            onClick={() => setDocumentType('invoice')}
                            className={`document-type ${
                                documentType === 'invoice'
                                    ? 'selected-document-type'
                                    : 'unselected-document-type'
                            }`}
                        >
                            Facture
                        </button>
                    </div>
                </Card>

                <Card variant="section" className="space-y-6">
                    <Select
                        {...register('customerId')}
                        id={customerId}
                        label="Client *"
                        error={errors.customerId?.message}
                    >
                        <option value="">Sélectionnez un client</option>
                        {customers?.map(customer => (
                            <option key={customer.id} value={customer.id}>
                                {customer.name}
                            </option>
                        ))}
                    </Select>

                    <Input
                        {...register('title')}
                        id={titleId}
                        type="text"
                        label="Titre (optionnel)"
                        placeholder='Ex: Site web vitrine'
                    />

                    <div>
                        <label htmlFor={linesId} className="label">
                            Lignes *
                        </label>
                        <div className="space-y-3" id={linesId}>
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex gap-3 items-start">
                                    <div className="flex-1/2">
                                        <input
                                            {...register(`lines.${index}.description`)}
                                            placeholder="Description"
                                            className={`input-line ${
                                                errors.lines?.[index]?.description ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        />
                                        {errors.lines?.[index]?.description && (
                                            <p className="error-message">
                                                {errors.lines[index]?.description?.message}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex-1/6">
                                        <input
                                            {...register(`lines.${index}.unitPrice`, { valueAsNumber: true })}
                                            type="number"
                                            step="0.01"
                                            placeholder="Prix"
                                            className={`input-line ${
                                                errors.lines?.[index]?.unitPrice ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        />
                                    </div>
                                    <div className="flex-1/6">
                                        <input
                                            {...register(`lines.${index}.quantity`, { valueAsNumber: true })}
                                            type="number"
                                            placeholder="Qté"
                                            className={`input-line ${
                                                errors.lines?.[index]?.quantity ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        />
                                    </div>
                                    {fields.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => remove(index)}
                                            className="btn-delete-line"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => append({ description: '', unitPrice: 0, quantity: 1 })}
                            className="btn-add-line"
                        >
                            <Plus size={18} />
                            Ajouter une ligne
                        </button>
                    </div>

                    {documentType === 'quote' && (
                        <div>
                            <label htmlFor={notesId} className="label">
                                Notes (optionnel)
                            </label>
                            <textarea
                                {...register('notes')}
                                id={notesId}
                                rows={3}
                                placeholder="Notes internes..."
                                className="input border-gray-300"
                            />
                        </div>
                    )}

                    <div className="pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold text-gray-700">Prix total</span>
                            <span className="text-2xl font-bold text-blue-600">{total.toFixed(2)}€</span>
                        </div>
                    </div>

                    <FormActions
                        submitLabel={`Créer ${documentType === 'quote' ? 'le devis' : 'la facture'}`}
                        isSubmitting={createDocMut.isPending}
                        onCancel={() => navigate({to: '/documents'})}
                        error={createDocMut.isError ? "Une erreur est survenue lors de la création du document." : undefined}
                    />
                </Card>
            </form>
        </div>
    );
}