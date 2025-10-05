import {createFileRoute, Link, useNavigate} from '@tanstack/react-router'
import {createServerFn} from "@tanstack/react-start";
import prisma from "@/lib/db.ts";
import {z} from 'zod';
import {useMutation, useQuery} from "@tanstack/react-query";
import {useFieldArray, useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {ArrowLeft, Plus, Trash2} from "lucide-react";
import {useState} from "react";

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
        const totalAmount = data.lines.reduce((sum, line) =>
            sum + line.unitPrice * line.quantity, 0
        );

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
            return { type: 'invoice', id: invoice.id };
        }
    });

export const Route = createFileRoute('/documents/new')({
    component: RouteComponent,
})

function RouteComponent() {
    const navigate = useNavigate();
    const [documentType, setDocumentType] = useState<'quote' | 'invoice'>('quote');

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
    const total = lines.reduce((sum, line) =>
        sum + (line.unitPrice || 0) * (line.quantity || 1), 0
    );

    const onSubmit = (data: DocumentFormData) => {
        createDocMut.mutate({ ...data, type: documentType });
    };

    return (
        <div className="content">
            <Link to='/documents'
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
                <ArrowLeft size={20} />
                Retour aux documents
            </Link>

            <h2 className="page-title mb-6">Créer un document</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl">
                <div className="section-card mb-6">
                    <label className="label">
                        Type de document *
                    </label>
                    <div className="flex gap-4">
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
                </div>

                <div className="section-card space-y-6">
                    <div>
                        <label htmlFor='customerId' className="label">
                            Client *
                        </label>
                        <select
                            {...register('customerId')}
                            id="customerId"
                            className={`input ${
                                errors.customerId ? 'border-red-500' : 'border-gray-300'
                            }`}
                        >
                            <option value="">Sélectionnez un client</option>
                            {customers?.map(customer => (
                                <option key={customer.id} value={customer.id}>
                                    {customer.name}
                                </option>
                            ))}
                        </select>
                        {errors.customerId && (
                            <p className="error-message">{errors.customerId.message}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor='title' className="label">
                            Titre (optionnel)
                        </label>
                        <input
                            {...register('title')}
                            id="title"
                            type="text"
                            placeholder='Ex: Site web vitrine'
                            className="input border-gray-300"
                        />
                    </div>

                    <div>
                        <label className="label">
                            Lignes *
                        </label>
                        <div className="space-y-3">
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex gap-3 items-start">
                                    <div className="flex-1/2">
                                        <input
                                            {...register(`lines.${index}.description`)}
                                            placeholder="Description"
                                            className={`input px-3 py-2 text-sm ${
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
                                            className={`input px-3 py-2 text-sm ${
                                                errors.lines?.[index]?.unitPrice ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        />
                                    </div>
                                    <div className="flex-1/6">
                                        <input
                                            {...register(`lines.${index}.quantity`, { valueAsNumber: true })}
                                            type="number"
                                            placeholder="Qté"
                                            className={`input px-3 py-2 text-sm ${
                                                errors.lines?.[index]?.quantity ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        />
                                    </div>
                                    {fields.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => remove(index)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
                            className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                            <Plus size={18} />
                            Ajouter une ligne
                        </button>
                    </div>

                    {documentType === 'quote' && (
                        <div>
                            <label htmlFor='notes' className="label">
                                Notes (optionnel)
                            </label>
                            <textarea
                                {...register('notes')}
                                id="notes"
                                rows={3}
                                placeholder="Notes internes..."
                                className="input border-gray-300"
                            />
                        </div>
                    )}

                    <div className="pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold text-gray-700">Total HT</span>
                            <span className="text-2xl font-bold text-blue-600">{total.toFixed(2)}€</span>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={createDocMut.isPending}
                            className="create-btn"
                        >
                            {createDocMut.isPending ? 'Création...' : `Créer ${documentType === 'quote' ? 'le devis' : 'la facture'}`}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate({to: '/documents'})}
                            className="cancel-btn"
                        >
                            Annuler
                        </button>
                    </div>

                    {createDocMut.isError && (
                        <p className="text-red-500 text-sm">
                            Une erreur est survenue lors de la création du document.
                        </p>
                    )}
                </div>
            </form>
        </div>
    );
}