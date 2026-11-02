const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init)
  if (!res.ok) {
    // FastAPI reports problems as { detail: "..." }
    const body = (await res.json().catch(() => null)) as { detail?: string | { msg?: string; loc?: unknown[] }[] } | null
    const d = body?.detail
    const text = Array.isArray(d) ? d.map((e) => `${e.loc?.slice(1).join('.') ?? 'request'}: ${e.msg ?? 'invalid'}`).join('; ') : d
    throw new Error(text || `Request failed (${res.status}) for ${path}`)
  }
  return (await res.json()) as T
}

/** GET a JSON endpoint of the FastAPI backend. */
export function apiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const qs = params ? `?${new URLSearchParams(params)}` : ''
  return request<T>(`${path}${qs}`)
}

/** POST a JSON body to the FastAPI backend. */
export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

/** PATCH a JSON body to the FastAPI backend. */
export function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

/** POST and read a server-sent-events stream (`data: {json}` lines), calling `onEvent` for each event as it arrives. */
export async function apiStream<E>(path: string, body: unknown, onEvent: (event: E) => void): Promise<void> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok || !res.body) throw new Error(`Request failed (${res.status}) for ${path}`)
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
  let buffer = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += value
    const frames = buffer.split('\n\n')
    buffer = frames.pop() ?? ''
    for (const frame of frames) {
      const line = frame.split('\n').find((l) => l.startsWith('data: '))
      if (line) onEvent(JSON.parse(line.slice(6)) as E)
    }
  }
}
