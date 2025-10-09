import type { ReactNode } from "react";

interface FormActionsProps {
    submitLabel?: string;
    cancelLabel?: string;
    isSubmitting?: boolean;
    onCancel?: () => void;
    submitDisabled?: boolean;
    showCancel?: boolean;
    error?: string;
    children?: ReactNode;
}

const FormActions = ({
    submitLabel = "Enregistrer",
    cancelLabel = "Annuler",
    isSubmitting = false,
    onCancel,
    submitDisabled = false,
    showCancel = true,
    error,
    children
}: FormActionsProps) => {
    return (
        <>
            <div className="flex gap-3 pt-4">
                {children || (
                    <>
                        <button
                            type="submit"
                            disabled={isSubmitting || submitDisabled}
                            className="create-btn"
                        >
                            {isSubmitting ? 'Enregistrement...' : submitLabel}
                        </button>
                        {showCancel && onCancel && (
                            <button
                                type="button"
                                onClick={onCancel}
                                className="cancel-btn"
                            >
                                {cancelLabel}
                            </button>
                        )}
                    </>
                )}
            </div>
            {error && (
                <p className="text-red-500 text-sm mt-2">
                    {error}
                </p>
            )}
        </>
    );
};

export default FormActions;
