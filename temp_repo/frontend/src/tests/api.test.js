import { afterEach, expect, it, vi } from 'vitest';
import { getJson } from '../services/api.js';
afterEach(() => vi.unstubAllGlobals());
it('đọc thông báo JSON khi API báo 501 thay vì coi là đã lưu', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 501, json: async () => ({ error: { message: 'Chưa triển khai' } }) }));
  await expect(getJson('/api/runs')).rejects.toThrow('Chưa triển khai');
});
it('lỗi proxy không phải JSON vẫn có thông báo HTTP', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => { throw new Error('not JSON'); } }));
  await expect(getJson('/api/health')).rejects.toThrow('HTTP 500');
});
