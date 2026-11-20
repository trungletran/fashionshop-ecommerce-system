import type { FieldValues, Path, UseFormRegister } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils/cn';

type FormFieldProps<TFormValues extends FieldValues> = {
  label: string;
  name: Path<TFormValues>;
  register: UseFormRegister<TFormValues>;
  error?: { message?: string };
  type?: string;
  placeholder?: string;
  textarea?: boolean;
  hint?: string;
  className?: string;
};

export function FormField<TFormValues extends FieldValues>({
  label,
  name,
  register,
  error,
  type = 'text',
  placeholder,
  textarea = false,
  hint,
  className,
}: FormFieldProps<TFormValues>) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={name}>{label}</Label>
      {textarea ? (
        <Textarea
          id={name}
          aria-label={label}
          aria-invalid={Boolean(error)}
          placeholder={placeholder}
          {...register(name)}
        />
      ) : (
        <Input
          id={name}
          aria-label={label}
          aria-invalid={Boolean(error)}
          type={type}
          placeholder={placeholder}
          {...register(name)}
        />
      )}
      {hint && !error ? <p className="text-xs text-on-surface-variant">{hint}</p> : null}
      {error?.message ? <p className="text-xs font-medium text-error">{error.message}</p> : null}
    </div>
  );
}
