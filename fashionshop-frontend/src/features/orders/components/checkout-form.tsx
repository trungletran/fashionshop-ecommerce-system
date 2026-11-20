'use client';

import { useForm, type UseFormRegisterReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CheckoutSummary } from '@/types/order';

const checkoutSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  phone: z.string().min(1, 'Phone number is required').regex(/^\+?[0-9]{9,15}$/, 'Phone number is invalid (9–15 digits, optional + prefix)'),
  addressLine1: z.string().min(3, 'Required'),
  city: z.string().min(1, 'Required'),
  postalCode: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  paymentMethod: z.enum(['COD', 'MOMO', 'BANKING']),
  note: z.string().optional(),
});

type FormFields = z.infer<typeof checkoutSchema>;

export type CheckoutFormValues = {
  receiverName: string;
  phone: string;
  shippingAddress: string;
  paymentMethod: 'COD' | 'MOMO' | 'BANKING';
  note?: string;
};

const paymentOptions = [
  { value: 'BANKING' as const, label: 'Banking', icon: 'credit_card' },
  { value: 'MOMO' as const, label: 'Momo', icon: 'account_balance_wallet' },
  { value: 'COD' as const, label: 'Cash', icon: 'local_shipping' },
];

export function CheckoutForm({
  onSubmit,
}: {
  summary: CheckoutSummary;
  onSubmit: (values: CheckoutFormValues) => void;
}) {
  const form = useForm<FormFields>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      addressLine1: '',
      city: '',
      postalCode: '',
      email: '',
      paymentMethod: 'COD',
      note: '',
    },
  });

  const selectedMethod = form.watch('paymentMethod');

  const handleSubmit = (data: FormFields) => {
    onSubmit({
      receiverName: `${data.firstName} ${data.lastName}`,
      phone: data.phone,
      shippingAddress: `${data.addressLine1}\n${data.city}, ${data.postalCode}`,
      paymentMethod: data.paymentMethod,
      note: data.note,
    });
  };

  return (
    <form
      id="checkout-form"
      className="space-y-8"
      onSubmit={form.handleSubmit(handleSubmit, () => {
        toast.error('Please fill in all required fields.');
      })}
    >
      {/* 01 Shipping Information */}
      <section className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-6 shadow-xs sm:p-8">
        <div className="mb-6 border-b border-outline-variant/50 pb-4">
          <p className="font-label text-[10px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
            Step 01
          </p>
          <h2 className="font-headline mt-1 text-xl font-black uppercase tracking-tight text-primary">
            Shipping Information
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <CheckoutInput
            id="checkout-first-name"
            label="First Name"
            registration={form.register('firstName')}
            placeholder="Ava"
            error={form.formState.errors.firstName?.message}
          />
          <CheckoutInput
            id="checkout-last-name"
            label="Last Name"
            registration={form.register('lastName')}
            placeholder="Chen"
            error={form.formState.errors.lastName?.message}
          />
          <CheckoutInput
            id="checkout-phone"
            label="Phone Number"
            type="tel"
            registration={form.register('phone')}
            placeholder="+84901234567"
            error={form.formState.errors.phone?.message}
          />
          <CheckoutInput
            id="checkout-email"
            label="Email Address"
            type="email"
            registration={form.register('email')}
            placeholder="your@email.com"
            error={form.formState.errors.email?.message}
          />
          <CheckoutInput
            id="checkout-address"
            label="Address Line 1"
            registration={form.register('addressLine1')}
            placeholder="123 Le Loi, District 1"
            error={form.formState.errors.addressLine1?.message}
            className="sm:col-span-2"
          />
          <CheckoutInput
            id="checkout-city"
            label="City"
            registration={form.register('city')}
            placeholder="Ho Chi Minh City"
            error={form.formState.errors.city?.message}
          />
          <CheckoutInput
            id="checkout-postal"
            label="Postal Code"
            registration={form.register('postalCode')}
            placeholder="700000"
            error={form.formState.errors.postalCode?.message}
          />
        </div>
      </section>

      {/* 02 Delivery Method */}
      <section className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-6 shadow-xs sm:p-8">
        <div className="mb-6 border-b border-outline-variant/50 pb-4">
          <p className="font-label text-[10px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
            Step 02
          </p>
          <h2 className="font-headline mt-1 text-xl font-black uppercase tracking-tight text-primary">
            Delivery Method
          </h2>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border-2 border-primary bg-surface-container-low/50 px-5 py-4">
            <div className="flex items-center gap-4">
              <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-primary">
                <div className="h-2.5 w-2.5 rounded-full bg-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-primary">Standard Atelier Shipping</p>
                <p className="text-xs text-on-surface-variant">5–7 Business Days</p>
              </div>
            </div>
            <p className="font-label text-xs font-bold uppercase tracking-[0.14em] text-primary">Complimentary</p>
          </div>

          <div className="flex cursor-not-allowed items-center justify-between rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-5 py-4 opacity-45">
            <div className="flex items-center gap-4">
              <div className="h-5 w-5 rounded-full border-2 border-outline-variant" />
              <div>
                <p className="text-sm font-bold text-on-surface">Priority Curated Delivery</p>
                <p className="text-xs text-on-surface-variant">Next Business Day</p>
              </div>
            </div>
            <p className="text-sm font-bold text-on-surface">$25.00</p>
          </div>
        </div>
      </section>

      {/* 03 Payment Method */}
      <section className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-6 shadow-xs sm:p-8">
        <div className="mb-6 border-b border-outline-variant/50 pb-4">
          <p className="font-label text-[10px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
            Step 03
          </p>
          <h2 className="font-headline mt-1 text-xl font-black uppercase tracking-tight text-primary">
            Payment Method
          </h2>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-3">
          {paymentOptions.map((option) => {
            const isSelected = selectedMethod === option.value;
            return (
              <label
                key={option.value}
                className={`flex cursor-pointer flex-col items-center gap-2.5 rounded-lg border-2 px-4 py-5 transition-all ${
                  isSelected
                    ? 'border-primary bg-surface-container-low/60 text-primary'
                    : 'border-outline-variant/60 bg-surface-container-lowest text-on-surface-variant hover:border-outline'
                }`}
              >
                <input type="radio" value={option.value} {...form.register('paymentMethod')} className="sr-only" />
                <span className={`material-symbols-outlined text-xl ${isSelected ? 'text-primary' : 'text-outline'}`}>
                  {option.icon}
                </span>
                <span className="font-label text-xs font-bold uppercase tracking-[0.16em]">{option.label}</span>
              </label>
            );
          })}
        </div>

        <div className="space-y-2">
          <Label htmlFor="checkout-note">Order Notes (Optional)</Label>
          <Textarea
            id="checkout-note"
            {...form.register('note')}
            placeholder="Delivery instructions or packaging preferences..."
            className="min-h-24"
          />
        </div>
      </section>

      {/* Security badges */}
      <div className="flex flex-wrap items-center gap-6 px-1 font-label text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-primary">lock</span>
          <span>SSL Encrypted Secure Connection</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-primary">verified_user</span>
          <span>PCI Compliance Level 1</span>
        </div>
      </div>
    </form>
  );
}

function CheckoutInput({
  id,
  label,
  type = 'text',
  registration,
  placeholder,
  error,
  className,
}: {
  id: string;
  label: string;
  type?: string;
  registration: UseFormRegisterReturn;
  placeholder: string;
  error?: string;
  className?: string;
}) {
  return (
    <div className={className ? `space-y-2 ${className}` : 'space-y-2'}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        {...registration}
      />
      {error ? <p className="text-xs font-medium text-error">{error}</p> : null}
    </div>
  );
}
