/**
 * Cloudinary Frontend Direct Upload Utility
 * Uploads an image file directly to Cloudinary using an unsigned upload preset.
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export class CloudinaryUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CloudinaryUploadError';
  }
}

/**
 * Upload a single image file to Cloudinary.
 * @param file - The image File object to upload
 * @param folder - Optional Cloudinary folder to organize uploads (e.g. "products")
 * @returns The secure URL of the uploaded image
 */
export async function uploadImageToCloudinary(
  file: File,
  folder = 'fashionshop/products'
): Promise<CloudinaryUploadResult> {
  if (!CLOUD_NAME) {
    throw new CloudinaryUploadError(
      'Cloudinary Cloud Name chưa được cấu hình. Vui lòng điền NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME vào .env.local'
    );
  }
  if (!UPLOAD_PRESET) {
    throw new CloudinaryUploadError(
      'Cloudinary Upload Preset chưa được cấu hình. Vui lòng điền NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET vào .env.local'
    );
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new CloudinaryUploadError('Chỉ được phép upload file ảnh (JPEG, PNG, WEBP, v.v.)');
  }

  // Validate file size (max 5MB)
  const MAX_SIZE_BYTES = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE_BYTES) {
    throw new CloudinaryUploadError('Kích thước ảnh không được vượt quá 5MB');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new CloudinaryUploadError(
      errorData?.error?.message ?? `Upload thất bại (HTTP ${response.status})`
    );
  }

  return response.json() as Promise<CloudinaryUploadResult>;
}
