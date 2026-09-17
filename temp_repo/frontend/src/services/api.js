export async function getJson(path, { signal } = {}) {
  const response = await fetch(path, { signal });
  if (!response.ok) {
    let body;
    try { body = await response.json(); } catch { /* Có thể proxy trả văn bản khi Flask tắt. */ }
    throw new Error(body?.error?.message || `API trả HTTP ${response.status}. Kiểm tra terminal Flask.`);
  }
  return response.json();
}
