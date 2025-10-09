import { useMemo } from "react";

interface Document {
    num: string;
    status: string;
    title?: string | null;
    customer: {
        name: string;
    };
}

export function useDocumentFilter<T extends Document, S extends string>(
    documents: T[],
    searchQuery: string,
    statusFilter: S[]
): T[] {
    return useMemo(() => {
        return documents.filter(doc => {
            const matchSearch = !searchQuery ||
                doc.num.toLowerCase().includes(searchQuery.toLowerCase()) ||
                doc.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                doc.title?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchStatus = statusFilter.length === 0 ||
                statusFilter.includes(doc.status as S);

            return matchSearch && matchStatus;
        });
    }, [documents, searchQuery, statusFilter]);
}

