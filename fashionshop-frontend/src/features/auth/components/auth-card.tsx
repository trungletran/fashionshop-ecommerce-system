import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function AuthCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card className="mx-auto w-full max-w-lg shadow-sm">
      <CardHeader className="bg-surface-container-low">
        <h1 className="font-headline text-2xl font-black uppercase tracking-tight text-primary">{title}</h1>
        {description ? <p className="mt-1 text-sm text-on-surface-variant">{description}</p> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
