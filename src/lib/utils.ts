import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export function calculateTotal(lines: { quantity: number; unitPrice: number }[]) {
    return lines.reduce((total, line) => total + line.quantity * line.unitPrice, 0);
}

export function formatRelativeDate(date: Date, suffix: boolean = true) {
    return formatDistanceToNow(date, { addSuffix: suffix, locale: fr });
}