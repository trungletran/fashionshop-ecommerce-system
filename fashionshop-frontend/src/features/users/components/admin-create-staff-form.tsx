'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { FormField } from '@/components/common/form-field';

const createStaffSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.string().optional(),
});

export type CreateStaffFormValues = z.infer<typeof createStaffSchema>;

export function AdminCreateStaffForm({ onSubmit }: { onSubmit: (values: CreateStaffFormValues) => void }) {
  const form = useForm<CreateStaffFormValues>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: { fullName: '', email: '', password: '', role: 'STAFF' },
  });

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
      <FormField<CreateStaffFormValues> label="Full name" name="fullName" register={form.register} error={form.formState.errors.fullName} placeholder="Alexander McQueen" />
      <FormField<CreateStaffFormValues> label="Email" name="email" type="email" register={form.register} error={form.formState.errors.email} placeholder="staff@18studio.com" />
      <FormField<CreateStaffFormValues> label="Password" name="password" type="password" register={form.register} error={form.formState.errors.password} placeholder="••••••••" />
      <div className="space-y-2">
        <Label htmlFor="admin-create-staff-role">Role</Label>
        <Select id="admin-create-staff-role" {...form.register('role')}>
          <option value="STAFF">Staff</option>
          <option value="ADMIN">Admin</option>
        </Select>
      </div>
      <Button type="submit" className="w-full">
        Create staff account
      </Button>
    </form>
  );
}
