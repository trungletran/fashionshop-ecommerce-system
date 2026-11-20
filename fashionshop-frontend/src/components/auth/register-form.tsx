import type { ChangeEvent, FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

type RegisterValues = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type RegisterErrors = Partial<Record<keyof RegisterValues, string>>;

type RegisterFormProps = {
  values: RegisterValues;
  errors: RegisterErrors;
  isSubmitting?: boolean;
  onChange: (field: keyof RegisterValues, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-1.5 text-xs font-medium text-error">{message}</p>;
}

export function RegisterForm({ values, errors, isSubmitting = false, onChange, onSubmit }: RegisterFormProps) {
  return (
    <form className="space-y-5" onSubmit={onSubmit} noValidate>
      <div className="space-y-2">
        <Label htmlFor="register-full-name">Full Name</Label>
        <Input
          id="register-full-name"
          type="text"
          value={values.fullName}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onChange('fullName', event.target.value)}
          placeholder="Ava Chen"
          aria-invalid={Boolean(errors.fullName)}
        />
        <FieldError message={errors.fullName} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-email">Email Address</Label>
        <Input
          id="register-email"
          type="email"
          value={values.email}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onChange('email', event.target.value)}
          placeholder="your@email.com"
          aria-invalid={Boolean(errors.email)}
        />
        <FieldError message={errors.email} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-password">Password</Label>
        <Input
          id="register-password"
          type="password"
          value={values.password}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onChange('password', event.target.value)}
          placeholder="••••••••"
          aria-invalid={Boolean(errors.password)}
        />
        <FieldError message={errors.password} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-confirm-password">Confirm Password</Label>
        <Input
          id="register-confirm-password"
          type="password"
          value={values.confirmPassword}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onChange('confirmPassword', event.target.value)}
          placeholder="••••••••"
          aria-invalid={Boolean(errors.confirmPassword)}
        />
        <FieldError message={errors.confirmPassword} />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Creating Account…' : 'Create Account'}
      </Button>
    </form>
  );
}

export type { RegisterErrors, RegisterValues };
