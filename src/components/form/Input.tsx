import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, helperText, className = "", id, ...props }, ref) => {
        return (
            <div>
                {label && (
                    <label htmlFor={id} className="label">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={id}
                    className={`input ${error ? 'border-red-500' : 'border-gray-300'} ${className}`}
                    {...props}
                />
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

Input.displayName = "Input";

export default Input;
