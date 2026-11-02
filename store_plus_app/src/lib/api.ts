const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000'

/** GET a JSON endpoint of the FastAPI backend. */
export async function apiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const qs = params ? `?${new URLSearchParams(params)}` : ''
  const res = await fetch(`${BASE}${path}${qs}`)
  if (!res.ok) throw new Error(`Request failed (${res.status}) for ${path}`)
  return (await res.json()) as T
}
