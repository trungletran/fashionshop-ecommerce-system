import { describe, expect, it, vi } from 'vitest';

const { post, put } = vi.hoisted(() => ({ post: vi.fn(), put: vi.fn() }));
vi.mock('@/lib/api/http', () => ({
  api: { post, put },
  apiRequest: async (promise: Promise<{ data: { data: unknown } }>) => (await promise).data.data,
}));

import { updateMe, updateUserProfile, uploadMyAvatar } from './services';

describe('user avatar service', () => {
  it('submits exactly one file part to the current-user endpoint', async () => {
    const updated = { id: '1', email: 'u@example.com', fullName: 'User', role: 'CUSTOMER', avatarUrl: 'https://res.cloudinary.com/demo/image/upload/v1/fashionshop/avatars/1/a.png' };
    post.mockResolvedValueOnce(Promise.resolve({ data: { success: true, data: updated } }));
    const file = new File(['image'], 'avatar.png', { type: 'image/png' });

    const result = await uploadMyAvatar(file);

    expect(post).toHaveBeenCalledWith('/api/me/avatar', expect.any(FormData));
    const formData = post.mock.calls[0][1] as FormData;
    expect(formData.getAll('file')).toHaveLength(1);
    expect(formData.get('file')).toBe(file);
    expect(result).toEqual(updated);
  });

  it('keeps legacy profile updates separate from the avatar upload endpoint', async () => {
    put.mockResolvedValueOnce(Promise.resolve({ data: { success: true, data: { id: '1' } } }));
    put.mockResolvedValueOnce(Promise.resolve({ data: { success: true, data: { id: '1' } } }));

    await updateMe({ fullName: 'Jane', email: 'jane@example.com' });
    await updateUserProfile({ fullName: 'Jane', email: 'jane@example.com' });

    expect(put).toHaveBeenNthCalledWith(1, '/api/me', { fullName: 'Jane', email: 'jane@example.com' });
    expect(put).toHaveBeenNthCalledWith(2, '/api/users/profile', { fullName: 'Jane', email: 'jane@example.com' });
  });
});
