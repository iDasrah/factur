import { forwardRef, type SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    helperText?: string;
    options?: Array<{ value: string; label: string }>;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, error, helperText, options, className = "", id, children, ...props }, ref) => {
        return (
            <div>
                {label && (
                    <label htmlFor={id} className="label">
                        {label}
                    </label>
                )}
                <select
                    ref={ref}
                    id={id}
                    className={`input ${error ? 'border-red-500' : 'border-gray-300'} ${className}`}
                    {...props}
                >
                    {children}
                    {options?.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                {error && (
                    <p className="error-message">{error}</p>
                )}
                {helperText && !error && (
                    <p className="text-sm text-gray-500 mt-1">{helperText}</p>
                )}
            </div>
        );
    }
);

Select.displayName = "Select";

export default Select;
