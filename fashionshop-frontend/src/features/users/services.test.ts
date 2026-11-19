import { describe, expect, it, vi } from 'vitest';

const { post } = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock('@/lib/api/http', () => ({
  api: { post },
  apiRequest: async (promise: Promise<{ data: { data: unknown } }>) => (await promise).data.data,
}));

import { uploadMyAvatar } from './services';

describe('user avatar service', () => {
  it('submits exactly one file part to the current-user endpoint', async () => {
    post.mockResolvedValueOnce(Promise.resolve({ data: { success: true, data: { id: '1' } } }));
    const file = new File(['image'], 'avatar.png', { type: 'image/png' });

    await uploadMyAvatar(file);

    expect(post).toHaveBeenCalledWith('/api/me/avatar', expect.any(FormData));
    const formData = post.mock.calls[0][1] as FormData;
    expect(formData.getAll('file')).toHaveLength(1);
    expect(formData.get('file')).toBe(file);
  });
});
