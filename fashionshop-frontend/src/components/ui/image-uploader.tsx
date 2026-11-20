'use client';

import { useCallback, useRef, useState } from 'react';
import { uploadImageToCloudinary, CloudinaryUploadError } from '@/lib/cloudinary';
import { cn } from '@/lib/utils/cn';

interface UploadedImage {
  url: string;
  publicId?: string;
  file?: File;
}

interface ImageUploaderProps {
  /** Current image URLs (controlled) */
  value?: string[];
  /** Fired when the list of uploaded URLs changes */
  onChange?: (urls: string[]) => void;
  /** Max number of images allowed */
  maxImages?: number;
  /** Cloudinary folder */
  folder?: string;
  className?: string;
  disabled?: boolean;
}

export function ImageUploader({
  value = [],
  onChange,
  maxImages = 10,
  folder = 'fashionshop/products',
  className,
  disabled = false,
}: ImageUploaderProps) {
  const [images, setImages] = useState<UploadedImage[]>(
    value.map((url) => ({ url }))
  );
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const notifyChange = useCallback(
    (imgs: UploadedImage[]) => {
      onChange?.(imgs.map((img) => img.url));
    },
    [onChange]
  );

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const remaining = maxImages - images.length;

      if (remaining <= 0) {
        setErrors([`Maximum ${maxImages} images allowed`]);
        return;
      }

      const toUpload = fileArray.slice(0, remaining);
      setErrors([]);
      setUploading(true);

      const results = await Promise.allSettled(
        toUpload.map((file) => uploadImageToCloudinary(file, folder))
      );

      const newImages: UploadedImage[] = [];
      const newErrors: string[] = [];

      results.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          newImages.push({ url: result.value.secure_url, publicId: result.value.public_id });
        } else {
          const err = result.reason;
          newErrors.push(
            err instanceof CloudinaryUploadError
              ? `${toUpload[idx].name}: ${err.message}`
              : `${toUpload[idx].name}: Upload failed`
          );
        }
      });

      const updated = [...images, ...newImages];
      setImages(updated);
      setErrors(newErrors);
      notifyChange(updated);
      setUploading(false);
    },
    [images, maxImages, folder, notifyChange]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled || uploading) return;
    processFiles(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
    notifyChange(updated);
  };

  const canAdd = images.length < maxImages && !disabled;

  return (
    <div className={cn('space-y-4', className)}>
      {canAdd && (
        <div
          role="button"
          tabIndex={0}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && !uploading && fileInputRef.current?.click()}
          className={cn(
            'relative flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-8 transition-colors select-none cursor-pointer',
            dragOver
              ? 'border-primary bg-surface-container'
              : 'border-outline-variant bg-surface-container-low hover:border-primary hover:bg-surface-container/60',
            uploading && 'pointer-events-none opacity-60',
          )}
        >
          {uploading ? (
            <>
              <div className="h-9 w-9 animate-spin rounded-full border-2 border-outline-variant border-t-primary" />
              <p className="font-label text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                Uploading…
              </p>
            </>
          ) : (
            <>
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-full transition-colors',
                  dragOver ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant/60'
                )}
              >
                <span className="material-symbols-outlined text-2xl">cloud_upload</span>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-on-surface">
                  Drop product images here
                </p>
                <p className="mt-1 text-xs text-on-surface-variant">
                  or <span className="font-semibold text-primary underline underline-offset-4">browse files</span>
                </p>
                <p className="mt-2 font-label text-[10px] font-bold uppercase tracking-[0.16em] text-outline">
                  JPEG · PNG · WEBP · Max 5MB each · Up to {maxImages} images
                </p>
              </div>
              {images.length > 0 && (
                <div className="absolute right-3 top-3 rounded-full bg-primary px-2.5 py-0.5 font-label text-[10px] font-bold tracking-wider text-on-primary">
                  {images.length}/{maxImages}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={maxImages > 1}
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || uploading}
      />

      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((error, i) => (
            <p key={i} className="flex items-center gap-1.5 text-xs font-medium text-error">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </p>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {images.map((img, idx) => (
            <div
              key={img.url + idx}
              className="group relative aspect-square overflow-hidden rounded-lg border border-outline-variant/60 bg-surface-container"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={`Product image ${idx + 1}`}
                className="h-full w-full object-cover"
              />

              {idx === 0 && (
                <div className="absolute bottom-1.5 left-1.5 rounded-sm bg-primary/90 px-1.5 py-0.5 font-label text-[9px] font-bold uppercase tracking-[0.16em] text-on-primary">
                  Primary
                </div>
              )}

              <button
                type="button"
                onClick={() => removeImage(idx)}
                disabled={disabled}
                className={cn(
                  'absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-surface-container-lowest/95 text-on-surface shadow-sm transition-all opacity-0 group-hover:opacity-100 hover:bg-error hover:text-on-error',
                  disabled && 'hidden'
                )}
                aria-label={`Remove image ${idx + 1}`}
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>

              <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
            </div>
          ))}

          {images.length < maxImages && !uploading && !disabled && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-outline-variant bg-surface-container-low text-outline transition-colors hover:border-primary hover:text-primary"
            >
              <span className="material-symbols-outlined text-2xl">add_photo_alternate</span>
              <span className="font-label text-[9px] font-bold uppercase tracking-[0.16em]">Add</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
