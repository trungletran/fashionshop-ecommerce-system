'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useCreateStaffAccountMutation, useUpdateStaffAccountMutation } from '@/features/users/hooks';
import type { StaffAccount } from '@/types/user';

type StaffFormValues = {
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  password?: string;
  confirmPassword?: string;
};

type Props = {
  initialData?: StaffAccount;
};

export function StaffForm({ initialData }: Props) {
  const router = useRouter();
  const createMutation = useCreateStaffAccountMutation();
  const updateMutation = useUpdateStaffAccountMutation(initialData?.id || '');

  const { register, handleSubmit } = useForm<StaffFormValues>({
    defaultValues: {
      fullName: initialData?.fullName || '',
      email: initialData?.email || '',
      role: initialData?.role?.toLowerCase() || '',
      password: '',
      confirmPassword: '',
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit: SubmitHandler<StaffFormValues> = (data) => {
    if (initialData) {
      updateMutation.mutate(
        { fullName: data.fullName, email: data.email, role: data.role.toUpperCase() },
        {
          onSuccess: () => {
            toast.success('Staff member updated successfully');
            router.push('/admin/staff-accounts');
          },
          onError: (err: { message?: string }) => toast.error(err?.message || 'Failed to update'),
        },
      );
      return;
    }

    if (!data.password) {
      toast.error('Password is required for new accounts');
      return;
    }

    if (!data.confirmPassword) {
      toast.error('Confirm password is required for new accounts');
      return;
    }

    if (data.password !== data.confirmPassword) {
      toast.error('Password and confirm password must match');
      return;
    }

    createMutation.mutate(
      {
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        role: data.role.toUpperCase(),
      },
      {
        onSuccess: () => {
          toast.success('Staff member created successfully');
          router.push('/admin/staff-accounts');
        },
        onError: (err: { message?: string }) => toast.error(err?.message || 'Failed to create'),
      },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-12 gap-8">
      <div className="col-span-12 flex flex-col gap-8 lg:col-span-7">
        {/* Step 01 */}
        <section className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-6 shadow-xs sm:p-8">
          <div className="mb-6 border-b border-outline-variant/50 pb-4">
            <span className="font-label text-[10px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
              Step 01
            </span>
            <h3 className="font-headline mt-1 text-lg font-black uppercase tracking-tight text-primary">
              Personal Information
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="staff-full-name">Full Name</Label>
              <Input
                id="staff-full-name"
                {...register('fullName')}
                required
                placeholder="e.g. Alexander McQueen"
                type="text"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff-email">Email Address</Label>
              <Input
                id="staff-email"
                {...register('email')}
                required
                placeholder="alexander@18studio.com"
                type="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff-phone">Phone Number</Label>
              <Input
                id="staff-phone"
                {...register('phone')}
                placeholder="+84 900 000 000"
                type="tel"
              />
            </div>
          </div>
        </section>

        {/* Step 02 */}
        <section className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-6 shadow-xs sm:p-8">
          <div className="mb-6 border-b border-outline-variant/50 pb-4">
            <span className="font-label text-[10px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
              Step 02
            </span>
            <h3 className="font-headline mt-1 text-lg font-black uppercase tracking-tight text-primary">
              Access Role
            </h3>
          </div>

          <div className="space-y-2">
            <Label htmlFor="staff-role">Assign Role</Label>
            <Select id="staff-role" {...register('role')} required>
              <option disabled value="">
                Select a role...
              </option>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
            </Select>
          </div>
          <p className="mt-3 text-xs text-on-surface-variant">
            Admins have full console access. Staff members can manage products, categories, and orders.
          </p>
        </section>

        {/* Step 03 */}
        <section className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-6 shadow-xs sm:p-8">
          <div className="mb-6 border-b border-outline-variant/50 pb-4">
            <span className="font-label text-[10px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
              Step 03
            </span>
            <h3 className="font-headline mt-1 text-lg font-black uppercase tracking-tight text-primary">
              Security Credentials
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="staff-password">
                {initialData ? 'New Password (Optional)' : 'Temporary Password'}
              </Label>
              <Input
                id="staff-password"
                {...register('password')}
                required={!initialData}
                placeholder="••••••••"
                type="password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff-confirm-password">Confirm Password</Label>
              <Input
                id="staff-confirm-password"
                {...register('confirmPassword')}
                required={!initialData}
                placeholder="••••••••"
                type="password"
              />
            </div>
          </div>
        </section>
      </div>

      {/* Right Column: Permissions & Submit */}
      <div className="col-span-12 flex flex-col gap-6 lg:col-span-5">
        <section className="sticky top-8 rounded-xl bg-primary p-7 text-on-primary shadow-xl sm:p-8">
          <div className="mb-8 border-b border-white/15 pb-5">
            <span className="font-label text-[10px] font-bold uppercase tracking-[0.24em] text-on-primary/60">
              Final Step
            </span>
            <h3 className="font-headline mt-1 text-lg font-black uppercase tracking-tight">
              Role Capabilities
            </h3>
          </div>

          <div className="flex flex-col gap-4">
            {[
              'View & Fulfill Orders',
              'Manage Products & Stock',
              'Manage Categories',
              'View Customer Accounts',
              'Manage Staff Accounts (Admin)',
              'Access Sales Reports',
            ].map((perm) => (
              <label key={perm} className="group flex cursor-pointer items-center justify-between gap-3">
                <span className="text-xs font-medium tracking-wide text-on-primary/80 transition-colors group-hover:text-on-primary">
                  {perm}
                </span>
                <input
                  className="h-4 w-4 cursor-pointer rounded-sm border-white/30 bg-transparent accent-white"
                  type="checkbox"
                  defaultChecked
                />
              </label>
            ))}
          </div>

          <div className="mt-10 border-t border-white/15 pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full cursor-pointer rounded-md bg-surface-container-lowest font-label text-xs font-bold uppercase tracking-[0.2em] text-primary transition-all hover:bg-surface-container active:scale-[0.99] disabled:opacity-50"
            >
              {isSubmitting ? 'Processing…' : initialData ? 'Save Changes' : 'Create Account'}
            </button>
            <button
              type="button"
              className="mt-4 block w-full cursor-pointer text-center font-label text-[11px] font-bold uppercase tracking-[0.18em] text-on-primary/60 transition-colors hover:text-on-primary"
              onClick={() => router.back()}
            >
              Cancel & Discard
            </button>
          </div>
        </section>
      </div>
    </form>
  );
}
