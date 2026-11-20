import type { ChangeEvent, FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

type LoginValues = {
  email: string;
  password: string;
};

type LoginErrors = Partial<Record<keyof LoginValues, string>>;

type LoginFormProps = {
  values: LoginValues;
  errors: LoginErrors;
  isSubmitting?: boolean;
  onChange: (field: keyof LoginValues, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-1.5 text-xs font-medium text-error">{message}</p>;
}

export function LoginForm({ values, errors, isSubmitting = false, onChange, onSubmit }: LoginFormProps) {
  return (
    <form className="space-y-5" onSubmit={onSubmit} noValidate>
      <div className="space-y-2">
        <Label htmlFor="login-email">Email Address</Label>
        <Input
          id="login-email"
          type="email"
          value={values.email}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onChange('email', event.target.value)}
          placeholder="your@email.com"
          aria-invalid={Boolean(errors.email)}
        />
        <FieldError message={errors.email} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="login-password">Password</Label>
          <button
            type="button"
            className="cursor-pointer font-label text-[10px] font-bold uppercase tracking-[0.16em] text-outline transition-colors hover:text-primary"
          >
            Forgot Password?
          </button>
        </div>
        <Input
          id="login-password"
          type="password"
          value={values.password}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onChange('password', event.target.value)}
          placeholder="••••••••"
          aria-invalid={Boolean(errors.password)}
        />
        <FieldError message={errors.password} />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Signing In…' : 'Sign In'}
      </Button>
    </form>
  );
}

export type { LoginErrors, LoginValues };
