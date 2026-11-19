import { describe, expect, it } from 'vitest';
import { parseApiError } from './errors';
import { api } from './http';

describe('parseApiError', () => {
  it('returns fallback message for unknown values', () => {
    expect(parseApiError(null).message).toBe('An unexpected error occurred');
  });

  it('extracts error message from an Error instance', () => {
    expect(parseApiError(new Error('boom')).message).toBe('boom');
  });

  it('extracts api message and code from axios-style error payload', () => {
    const parsed = parseApiError({
      message: 'Request failed with status code 401',
      response: {
        status: 401,
        data: {
          code: 'ACCOUNT_DELETED',
          message: 'Tài khoản đã bị xóa',
        },
      },
    });

    expect(parsed.status).toBe(401);
    expect(parsed.code).toBe('ACCOUNT_DELETED');
    expect(parsed.message).toBe('Tài khoản đã bị xóa');
  });
});

describe('api FormData handling', () => {
  it('preserves FormData body and omits application/json Content-Type while keeping JSON default for objects', async () => {
    const originalAdapter = api.defaults.adapter;
    const seen: Array<{ contentType: unknown; isFormData: boolean }> = [];
    api.defaults.adapter = async (config) => {
      const jsonHeaders = typeof config.headers?.toJSON === 'function' ? config.headers.toJSON() : config.headers;
      seen.push({
        contentType: jsonHeaders?.['Content-Type'],
        isFormData: config.data instanceof FormData,
      });
      return {
        data: { success: true, message: 'ok', data: null },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    try {
      const formData = new FormData();
      formData.append('file', new File(['png'], 'avatar.png', { type: 'image/png' }));
      await api.post('/api/me/avatar', formData);
      await api.post('/api/me', { fullName: 'Jane' });

      expect(seen[0]).toEqual({ contentType: undefined, isFormData: true });
      expect(seen[1]).toEqual({ contentType: 'application/json', isFormData: false });
    } finally {
      api.defaults.adapter = originalAdapter;
    }
  });
});
