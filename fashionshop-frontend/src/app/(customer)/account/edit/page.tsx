'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/common/empty-state';
import { LoadingState } from '@/components/common/loading-state';
import { useMeQuery, useUpdateMeMutation } from '@/features/users/hooks';
import { ProfileForm } from '@/features/users/components/profile-form';
import { toast } from 'sonner';
import Link from 'next/link';

export default function EditAccountPage() {
  const router = useRouter();
  const meQuery = useMeQuery();
  const updateMutation = useUpdateMeMutation();

  if (meQuery.isLoading) return <LoadingState label="Loading profile" />;
  if (!meQuery.data) return <EmptyState title="Profile unavailable" actionLabel="Go back" actionHref="/account" />;

  return (
    <main className="container-shell min-h-screen py-10 md:py-14">
      <div className="mx-auto mb-7 max-w-3xl">
        <Link href="/account" className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant hover:text-on-surface">← Back to account</Link>
        <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.28em] text-on-surface-variant">Account settings</p>
        <h1 className="font-headline mt-2 text-4xl font-black uppercase tracking-[-0.05em] md:text-5xl">Edit profile</h1>
      </div>
      <Card className="mx-auto max-w-3xl overflow-hidden rounded-xl border-outline-variant bg-surface-container-lowest shadow-sm">
      <CardHeader className="bg-surface-container-low">
        <h2 className="font-headline text-sm font-bold uppercase tracking-[0.15em]">Personal information</h2>
      </CardHeader>
      <CardContent className="px-5 py-6 md:px-8 md:py-8">
        <ProfileForm
          user={meQuery.data}
          onSubmit={(values) =>
            updateMutation.mutate(values, {
              onSuccess: () => {
                toast.success('Profile saved');
                router.push('/account');
              },
            })
          }
        />
      </CardContent>
      </Card>
    </main>
  );
}
