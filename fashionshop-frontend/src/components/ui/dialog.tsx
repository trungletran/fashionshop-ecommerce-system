'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils/cn';

export const DialogRoot = Dialog.Root;
export const DialogTrigger = Dialog.Trigger;
export const DialogClose = Dialog.Close;

export function DialogContent({ className, ...props }: Dialog.DialogContentProps) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
      <Dialog.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-[min(92vw,640px)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-6 text-on-surface shadow-2xl outline-none',
          className,
        )}
        {...props}
      />
    </Dialog.Portal>
  );
}
