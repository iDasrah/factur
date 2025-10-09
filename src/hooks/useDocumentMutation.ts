import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";

type DocumentAction = 'send' | 'accept' | 'decline' | 'delete' | 'pay' | 'cancel';
type DocumentType = 'quote' | 'invoice';

interface UseDocumentMutationOptions<TData = unknown, TVariables = unknown> {
    documentId: string;
    documentType: DocumentType;
    action: DocumentAction;
    mutationFn: (variables: TVariables) => Promise<TData>;
    onSuccess?: (data: TData) => void;
    invalidate?: boolean;
    redirectTo?: string;
}

export function useDocumentMutation<TData = unknown, TVariables = unknown>({
    documentId,
    documentType,
    action,
    mutationFn,
    onSuccess,
    invalidate = true,
    redirectTo
}: UseDocumentMutationOptions<TData, TVariables>) {
    const router = useRouter();

    return useMutation({
        mutationKey: [action, documentType, documentId],
        mutationFn,
        onSuccess: (data) => {
            if (invalidate) {
                router.invalidate();
            }
            
            if (redirectTo) {
                router.navigate({ to: redirectTo });
            }
            
            onSuccess?.(data);
        }
    });
}
