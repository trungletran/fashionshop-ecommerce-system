import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const uploadState = vi.hoisted(() => ({ isPending: false, mutate: vi.fn() }));
vi.mock('../hooks', () => ({
  useUploadMyAvatarMutation: () => uploadState,
}));
vi.mock('next/image', () => ({ default: (props: { src?: string }) => <div data-testid="avatar-image" data-src={props.src} /> }));

import { ProfileForm } from './profile-form';

Object.defineProperty(URL, 'createObjectURL', { writable: true, value: vi.fn(() => 'blob:avatar') });
Object.defineProperty(URL, 'revokeObjectURL', { writable: true, value: vi.fn() });

const user = { id: '1', email: 'user@example.com', fullName: 'User', role: 'CUSTOMER' as const };

describe('ProfileForm avatar controls', () => {
  it('shows the fallback and accepts one valid image for upload', () => {
    render(<ProfileForm user={user} onSubmit={vi.fn()} />);
    expect(screen.getByText('U')).toBeInTheDocument();
    const file = new File(['png'], 'avatar.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Choose avatar image'), { target: { files: [file] } });
    expect(screen.getByRole('button', { name: 'Upload avatar' })).toBeInTheDocument();
    expect(screen.getByTestId('avatar-image')).toHaveAttribute('data-src', 'blob:avatar');
  });

  it('does not offer upload for an oversized file and displays an accessible alert', () => {
    render(<ProfileForm user={user} onSubmit={vi.fn()} />);
    const file = new File([new Uint8Array(5_242_881)], 'avatar.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Choose avatar image'), { target: { files: [file] } });
    expect(screen.queryByRole('button', { name: 'Upload avatar' })).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Choose a JPEG or PNG image up to 5 MiB');
  });

  it('rejects unsupported file types before upload', () => {
    render(<ProfileForm user={user} onSubmit={vi.fn()} />);
    const file = new File(['<svg />'], 'avatar.svg', { type: 'image/svg+xml' });
    fireEvent.change(screen.getByLabelText('Choose avatar image'), { target: { files: [file] } });
    expect(screen.queryByRole('button', { name: 'Upload avatar' })).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Choose a JPEG or PNG image up to 5 MiB');
  });

  it('cancels a preview and revokes its object URL', () => {
    const userWithAvatar = { ...user, avatarUrl: 'https://cdn.example/old.png' };
    render(<ProfileForm user={userWithAvatar} onSubmit={vi.fn()} />);
    const file = new File(['png'], 'avatar.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Choose avatar image'), { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('button', { name: 'Upload avatar' })).not.toBeInTheDocument();
    expect(screen.getByTestId('avatar-image')).toHaveAttribute('data-src', userWithAvatar.avatarUrl);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:avatar');
  });

  it('prevents duplicate submission while upload is pending', () => {
    uploadState.isPending = true;
    uploadState.mutate.mockClear();
    render(<ProfileForm user={user} onSubmit={vi.fn()} />);
    const file = new File(['png'], 'avatar.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Choose avatar image'), { target: { files: [file] } });
    const uploadButton = screen.getByRole('button', { name: 'Uploading…' });
    expect(uploadButton).toBeDisabled();
    fireEvent.click(uploadButton);
    expect(uploadState.mutate).not.toHaveBeenCalled();
    uploadState.isPending = false;
  });

  it('clears the failed preview, shows an accessible error, and keeps the saved avatar visible', () => {
    const userWithAvatar = { ...user, avatarUrl: 'https://cdn.example/old.png' };
    uploadState.mutate.mockImplementationOnce((_file, options) => options?.onError?.(new Error('upload failed')));
    render(<ProfileForm user={userWithAvatar} onSubmit={vi.fn()} />);
    const file = new File(['png'], 'avatar.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Choose avatar image'), { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: 'Upload avatar' }));
    expect(screen.getByTestId('avatar-image')).toHaveAttribute('data-src', userWithAvatar.avatarUrl);
    expect(screen.queryByRole('button', { name: 'Upload avatar' })).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('upload failed');
    uploadState.mutate.mockReset();
  });
});
