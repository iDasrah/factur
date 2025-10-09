import type { $Enums } from "@prisma/client";
import {Check, type LucideIcon, Plus, Send, UserMinus, UserPen, UserPlus, X } from "lucide-react";

type ActivityType = $Enums.ActivityType;

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


export const activityIcons: Record<ActivityType, { icon: LucideIcon; className: string }> = {
    QUOTE_CREATED: {
        icon: Plus,
        className: "text-blue-500"
    },
    QUOTE_SENT: {
        icon: Send,
        className: "text-blue-500"
    },
    QUOTE_ACCEPTED: {
        icon: Check,
        className: "text-green-500"
    },
    QUOTE_DECLINED: {
        icon: X,
        className: "text-red-500"
    },
    INVOICE_CREATED: {
        icon: Plus,
        className: "text-blue-500"
    },
    INVOICE_SENT: {
        icon: Send,
        className: "text-blue-500"
    },
    INVOICE_PAID: {
        icon: Check,
        className: "text-green-500"
    },
    INVOICE_CANCELLED: {
        icon: X,
        className: "text-red-500"
    },
    CUSTOMER_CREATED: {
        icon: UserPlus,
        className: "text-blue-500"
    },
    CUSTOMER_DELETED: {
        icon: UserMinus,
        className: "text-red-500"
    },
    CUSTOMER_EDITED: {
        icon: UserPen,
        className: "text-orange-500"
    },
}

export const activityText: Record<ActivityType, (id: string) => string> = {
    QUOTE_CREATED: (num) => `Devis n°${num} créé`,
    QUOTE_SENT: (num) => `Devis n°${num} envoyé`,
    QUOTE_ACCEPTED: (num) => `Devis n°${num} accepté`,
    QUOTE_DECLINED: (num) => `Devis n°${num} refusé`,
    INVOICE_CREATED: (num) => `Facture n°${num} créée`,
    INVOICE_SENT: (num) => `Facture n°${num} envoyée`,
    INVOICE_PAID: (num) => `Facture n°${num} payée`,
    INVOICE_CANCELLED: (num) => `Facture n°${num} annulée`,
    CUSTOMER_CREATED: (name) => `Client ${name} créé`,
    CUSTOMER_DELETED: (name) => `Client ${name} supprimé`,
    CUSTOMER_EDITED: (name) => `Client ${name} modifié`,
}