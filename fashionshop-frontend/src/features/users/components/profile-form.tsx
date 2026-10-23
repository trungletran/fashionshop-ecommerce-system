'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { AuthUser } from '@/types/common';
import { FormField } from '@/components/common/form-field';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useUploadMyAvatarMutation } from '../hooks';
import { toast } from 'sonner';

const profileSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phoneNumber: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileForm({ user, onSubmit }: { user: AuthUser; onSubmit: (values: ProfileFormValues) => void }) {
  const form = useForm<ProfileFormValues>({ resolver: zodResolver(profileSchema), defaultValues: { fullName: user.fullName, email: user.email ?? '', phoneNumber: user.phoneNumber ?? '' } });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const upload = useUploadMyAvatarMutation();
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  function selectFile(selected?: File) {
    if (!selected) return;
    if (!['image/jpeg', 'image/png'].includes(selected.type) || selected.size > 5 * 1024 * 1024) {
      toast.error('Choose a JPEG or PNG image up to 5 MB');
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }
  function cancelAvatar() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null); setFile(null);
    if (input.current) input.current.value = '';
  }

  return (
    <form className="space-y-7" onSubmit={form.handleSubmit(onSubmit)}>
      <section className="rounded-xl border border-outline-variant bg-surface-container-low p-4 sm:p-5" aria-label="Avatar">
        <h2 className="font-headline text-sm font-bold uppercase tracking-[0.15em]">Profile photo</h2>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-full border-4 border-white bg-surface-container">
            {(preview || user.avatarUrl) ? <Image src={preview || user.avatarUrl!} alt="Avatar preview" fill unoptimized className="object-cover" /> : <div className="flex h-full items-center justify-center text-2xl font-bold">{user.fullName.charAt(0).toUpperCase()}</div>}
          </div>
          <div className="space-y-2">
            <label htmlFor="avatar-file" className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Choose a new image</label>
            <input id="avatar-file" ref={input} type="file" accept="image/jpeg,image/png" aria-label="Choose avatar image" disabled={upload.isPending} onChange={(event) => selectFile(event.target.files?.[0])} className="block w-full max-w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-xs file:font-bold file:uppercase file:tracking-wide file:text-on-primary hover:file:opacity-80" />
            <p className="mt-2 text-xs text-on-surface-variant">JPEG or PNG, up to 5 MB</p>
          </div>
        </div>
        {file && <div className="flex gap-2">
          <Button type="button" disabled={upload.isPending} onClick={() => upload.mutate(file, { onSuccess: () => { toast.success('Avatar updated'); cancelAvatar(); }, onError: (error) => toast.error(error.message || 'Avatar upload failed') })}>{upload.isPending ? 'Uploading…' : 'Upload avatar'}</Button>
          <Button type="button" disabled={upload.isPending} variant="outline" onClick={cancelAvatar}>Cancel</Button>
        </div>}
      </section>
      <FormField<ProfileFormValues> label="Full name" name="fullName" register={form.register} error={form.formState.errors.fullName} />
      <FormField<ProfileFormValues> label="Email" name="email" register={form.register} error={form.formState.errors.email} />
      <FormField<ProfileFormValues> label="Phone number" name="phoneNumber" register={form.register} error={form.formState.errors.phoneNumber} />
      <Button type="submit" className="bg-black !text-white hover:bg-[#474747]">Save changes</Button>
    </form>
  );
}
