export const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:5001";

export async function apiGet(path) {
  const res = await fetch(`${apiBase}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
