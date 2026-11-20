'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  destructive?: boolean;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onOpenChange,
  onConfirm,
  destructive = false,
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,460px)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-6 text-on-surface shadow-2xl outline-none sm:p-8">
          <Dialog.Title className="font-headline text-lg font-extrabold tracking-tight text-primary">
            {title}
          </Dialog.Title>
          {description ? (
            <Dialog.Description className="mt-2 text-sm leading-relaxed text-on-surface-variant">
              {description}
            </Dialog.Description>
          ) : null}
          <div className="mt-7 flex items-center justify-end gap-3">
            <Dialog.Close asChild>
              <Button type="button" variant="outline" size="sm">
                {cancelLabel}
              </Button>
            </Dialog.Close>
            <Button
              type="button"
              size="sm"
              variant={destructive ? 'destructive' : 'default'}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
