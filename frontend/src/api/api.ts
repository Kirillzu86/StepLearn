// Если VITE_API_URL пустой, берем корень сайта. 
// В Coolify лучше оставить пустым или поставить '/', так как Nginx сам все разрулит.
export const API_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : '');

const getBase = () => API_URL.replace(/\/$/, '');

export async function getUsers() {
  // Добавляем /api/, чтобы Nginx перекинул запрос на бэкенд
  const res = await fetch(`${getBase()}/api/users`); 
  if (!res.ok) {
    throw new Error("Failed to fetch users");
  }
  return res.json();
}

export async function fetchCourses(query?: string, timestamp?: number) {
  // Проверь, какой путь в FastAPI: если там @app.get("/api/v1/courses"), то оставляй так.
  // Если в FastAPI просто @app.get("/v1/courses"), то пиши `${getBase()}/api/v1/courses`
  const urlStr = `${getBase()}/api/v1/courses`;
  
  try {
    const url = new URL(urlStr, window.location.origin);
    if (timestamp) url.searchParams.set('_t', String(timestamp));
    if (query?.trim()) url.searchParams.set('q', query.trim());

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 8000);
    
    const res = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(id);
    
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Error: ${res.status} ${body}`);
    }
    return res.json();
  } catch (e) {
    console.error("Fetch error:", e);
    throw e;
  }
}
