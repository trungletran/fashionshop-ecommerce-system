'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { AuthUser } from '@/types/common';
import { FormField } from '@/components/common/form-field';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useUploadMyAvatarMutation } from '../hooks';
import { toast } from 'sonner';

const profileSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phoneNumber: z.string().optional(),
});

const MAX_AVATAR_BYTES = 5_242_880;

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileForm({ user, onSubmit }: { user: AuthUser; onSubmit: (values: ProfileFormValues) => void }) {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: user.fullName, email: user.email ?? '', phoneNumber: user.phoneNumber ?? '' },
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const upload = useUploadMyAvatarMutation();
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const savedAvatarSrc = user.avatarUrl && user.avatarUrl !== failedAvatarUrl ? user.avatarUrl : null;
  const displayedAvatarSrc = preview || savedAvatarSrc;

  function selectFile(selected?: File) {
    if (!selected) return;
    if (!['image/jpeg', 'image/png'].includes(selected.type) || selected.size > MAX_AVATAR_BYTES) {
      const message = 'Choose a JPEG or PNG image up to 5 MiB';
      setAvatarError(message);
      toast.error(message);
      if (input.current) input.current.value = '';
      return;
    }
    setAvatarError(null);
    if (preview) URL.revokeObjectURL(preview);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }

  function cancelAvatar() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFile(null);
    setAvatarError(null);
    if (input.current) input.current.value = '';
  }

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
      <section className="rounded-lg border border-outline-variant/60 bg-surface-container-low p-5" aria-label="Avatar">
        <p className="font-label text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
          Identity
        </p>
        <h2 className="font-headline mt-1 text-base font-bold uppercase tracking-tight text-primary">
          Profile photo
        </h2>

        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-full border-2 border-outline-variant/60 bg-surface-container-lowest">
            {displayedAvatarSrc ? (
              <Image
                src={displayedAvatarSrc}
                alt="Avatar preview"
                fill
                unoptimized
                className="object-cover"
                onError={() => {
                  if (!preview && user.avatarUrl) {
                    setFailedAvatarUrl(user.avatarUrl);
                  }
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center font-headline text-2xl font-black text-on-surface-variant">
                {(user.fullName?.charAt(0) || 'U').toUpperCase()}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar-file">Choose a new image</Label>
            <input
              id="avatar-file"
              ref={input}
              type="file"
              accept="image/jpeg,image/png"
              aria-label="Choose avatar image"
              aria-describedby={avatarError ? 'avatar-file-error' : 'avatar-file-hint'}
              disabled={upload.isPending}
              onChange={(event) => selectFile(event.target.files?.[0])}
              className="block w-full max-w-full text-xs text-on-surface-variant file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:font-label file:text-[11px] file:font-bold file:uppercase file:tracking-[0.16em] file:text-on-primary hover:file:bg-primary-container"
            />
            <p id="avatar-file-hint" className="text-xs text-on-surface-variant">
              JPEG or PNG, up to 5 MiB
            </p>
            {avatarError ? (
              <p id="avatar-file-error" role="alert" className="text-xs font-medium text-error">
                {avatarError}
              </p>
            ) : null}
          </div>
        </div>

        {file && (
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Button
              type="button"
              size="sm"
              disabled={upload.isPending}
              onClick={() =>
                upload.mutate(file, {
                  onSuccess: () => {
                    toast.success('Avatar updated');
                    cancelAvatar();
                  },
                  onError: (error) => {
                    const message = error.message || 'Avatar upload failed';
                    cancelAvatar();
                    setAvatarError(message);
                    toast.error(message);
                  },
                })
              }
            >
              {upload.isPending ? 'Uploading…' : 'Upload avatar'}
            </Button>
            <Button type="button" size="sm" disabled={upload.isPending} variant="outline" onClick={cancelAvatar}>
              Cancel
            </Button>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField<ProfileFormValues>
          label="Full name"
          name="fullName"
          register={form.register}
          error={form.formState.errors.fullName}
          placeholder="Ava Chen"
          className="sm:col-span-2"
        />
        <FormField<ProfileFormValues>
          label="Email"
          name="email"
          type="email"
          register={form.register}
          error={form.formState.errors.email}
          placeholder="you@example.com"
        />
        <FormField<ProfileFormValues>
          label="Phone number"
          name="phoneNumber"
          type="tel"
          register={form.register}
          error={form.formState.errors.phoneNumber}
          placeholder="+84 900 000 000"
        />
      </div>

      <div className="flex justify-end border-t border-outline-variant/60 pt-5">
        <Button type="submit">Save changes</Button>
      </div>
    </form>
  );
}
