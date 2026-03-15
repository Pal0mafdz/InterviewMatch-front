import { apiFetch } from './client'

export interface AuthResponse {
  _id: string
  nombre: string
  email: string
  rol: 'user' | 'admin'
  token: string
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ email, password }),
  })
}

export function register(nombre: string, email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ nombre, email, password }),
  })
}
