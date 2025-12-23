// Use VITE_API_URL when provided, otherwise default to the current origin
export const API_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : '');

export async function getUsers() {
  const base = API_URL.replace(/\/$/, '');
  const res = await fetch(`${base}/users`);
  if (!res.ok) {
    throw new Error("Failed to fetch users");
  }
  return res.json();
}

// Fetch courses, optionally with a search query parameter `q` (backend should accept it).
export async function fetchCourses(query?: string, timestamp?: number) {
  const base = `${API_URL.replace(/\/$/, '')}`;
  const urlStr = `${base}/api/v1/courses`;
  try {
    const url = new URL(urlStr);
    if (typeof timestamp === 'number') url.searchParams.set('_t', String(timestamp));
    if (query && query.trim()) url.searchParams.set('q', query.trim());

    // Abortable fetch with timeout to avoid hanging
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Failed to fetch courses: ${res.status} ${body}`);
    }
    return res.json();
  } catch (e: any) {
    // Try a simpler string-based fetch as a fallback (some envs/routers reject URL constructor)
    try {
      const params = [] as string[];
      if (typeof timestamp === 'number') params.push(`_t=${timestamp}`);
      if (query && query.trim()) params.push(`q=${encodeURIComponent(query.trim())}`);
      const sep = params.length ? `?${params.join('&')}` : '';
      const fallbackUrl = `${urlStr}${sep}`;
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(fallbackUrl, { signal: controller.signal });
      clearTimeout(id);
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Failed to fetch courses (fallback): ${res.status} ${body}`);
      }
      return res.json();
    } catch (ee: any) {
      console.error('fetchCourses error primary:', e, 'fallback error:', ee);
      throw ee || e;
    }
  }
}
