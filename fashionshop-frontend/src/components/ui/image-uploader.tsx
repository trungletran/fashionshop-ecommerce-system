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
        setErrors([`Tối đa ${maxImages} ảnh`]);
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
              : `${toUpload[idx].name}: Upload thất bại`
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
      // reset so same file can be re-selected
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
      {/* Drop Zone */}
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
            'relative flex flex-col items-center justify-center gap-3',
            'border-2 border-dashed rounded-xl p-10 cursor-pointer',
            'transition-all duration-200 select-none',
            dragOver
              ? 'border-black bg-neutral-50 scale-[1.01]'
              : 'border-neutral-200 bg-surface-container-low hover:border-neutral-400 hover:bg-neutral-50',
            uploading && 'pointer-events-none opacity-60',
          )}
        >
          {uploading ? (
            <>
              {/* Spinner */}
              <div className="w-10 h-10 rounded-full border-2 border-neutral-200 border-t-black animate-spin" />
              <p className="text-[11px] font-bold tracking-widest uppercase text-neutral-400">
                Đang tải lên...
              </p>
            </>
          ) : (
            <>
              <div className={cn(
                'w-14 h-14 rounded-full flex items-center justify-center transition-colors duration-200',
                dragOver ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-400'
              )}>
                <span className="material-symbols-outlined text-3xl">cloud_upload</span>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-neutral-700">
                  Kéo thả ảnh vào đây
                </p>
                <p className="text-[11px] text-neutral-400 mt-1">
                  hoặc <span className="underline font-medium text-neutral-600">click để chọn file</span>
                </p>
                <p className="text-[10px] text-neutral-300 mt-2 tracking-wide uppercase">
                  JPEG · PNG · WEBP · tối đa 5MB mỗi ảnh · tối đa {maxImages} ảnh
                </p>
              </div>
              {images.length > 0 && (
                <div className="absolute top-3 right-3 bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide">
                  {images.length}/{maxImages}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={maxImages > 1}
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || uploading}
      />

      {/* Error messages */}
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((error, i) => (
            <p key={i} className="text-xs text-red-500 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </p>
          ))}
        </div>
      )}

      {/* Image preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {images.map((img, idx) => (
            <div
              key={img.url + idx}
              className="group relative aspect-square rounded-lg overflow-hidden bg-neutral-100 border border-neutral-200 shadow-sm"
            >
              {/* Preview image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={`Ảnh sản phẩm ${idx + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Primary badge */}
              {idx === 0 && (
                <div className="absolute bottom-1.5 left-1.5 bg-black/80 backdrop-blur-sm text-white text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded">
                  Chính
                </div>
              )}

              {/* Remove button — visible on hover */}
              <button
                type="button"
                onClick={() => removeImage(idx)}
                disabled={disabled}
                className={cn(
                  'absolute top-1.5 right-1.5 w-6 h-6 rounded-full',
                  'bg-white/90 backdrop-blur-sm shadow-md',
                  'flex items-center justify-center',
                  'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
                  'hover:bg-red-500 hover:text-white',
                  disabled && 'hidden'
                )}
                aria-label={`Xóa ảnh ${idx + 1}`}
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 pointer-events-none" />
            </div>
          ))}

          {/* Add more slot — if still have space */}
          {images.length < maxImages && !uploading && !disabled && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'aspect-square rounded-lg border-2 border-dashed border-neutral-200',
                'flex flex-col items-center justify-center gap-1',
                'text-neutral-300 hover:text-neutral-500 hover:border-neutral-400',
                'transition-all duration-150 cursor-pointer bg-surface-container-low'
              )}
            >
              <span className="material-symbols-outlined text-2xl">add_photo_alternate</span>
              <span className="text-[9px] font-bold tracking-widest uppercase">Thêm</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
