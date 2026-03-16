const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

function getToken(): string | null {
  return localStorage.getItem('token')
}

interface ApiOptions extends RequestInit {
  auth?: boolean
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { auth = true, headers = {}, ...rest } = options

  const reqHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  }

  if (auth) {
    const token = getToken()
    if (token) {
      (reqHeaders as Record<string, string>)['Authorization'] = `Bearer ${token}`
    }
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: reqHeaders,
    ...rest,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ mensaje: 'Error de red' }))
    const msg = error.mensaje ?? error.message ?? error.error ?? 'Error desconocido'
    const err = new Error(msg) as Error & { status: number }
    err.status = res.status
    throw err
  }

  return res.json()
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const token = getToken()
  const headers: HeadersInit = {}
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ mensaje: 'Error de red' }))
    const msg = error.mensaje ?? error.message ?? error.error ?? 'Error desconocido'
    const err = new Error(msg) as Error & { status: number }
    err.status = res.status
    throw err
  }

  return res.json()
}
