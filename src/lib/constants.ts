export const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    SENT: 'bg-blue-100 text-blue-700',
    ACCEPTED: 'bg-green-100 text-green-700',
    DECLINED: 'bg-red-100 text-red-700',
    UNPAID: 'bg-orange-100 text-orange-700',
    PAID: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-gray-100 text-gray-700',
};

export const statusLabels: Record<string, string> = {
    DRAFT: 'Brouillon',
    SENT: 'Envoyé',
    ACCEPTED: 'Accepté',
    DECLINED: 'Refusé',
    UNPAID: 'Impayée',
    PAID: 'Payée',
    CANCELLED: 'Annulée',
};