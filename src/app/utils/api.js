// utils/api.js
export async function safeFetch(url, options = {}) {
  const res = await fetch(url, { credentials: 'include', ...options });
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    // If status is 500, throw a clear error
    throw new Error(res.status === 500 ? 'Server error – please try again later' : 'Unexpected response from server');
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}