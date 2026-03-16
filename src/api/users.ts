import { apiFetch, apiUpload } from './client'

export interface UserProfile {
  _id: string
  nombre: string
  email: string
  rol: 'user' | 'admin'
  cvPath?: string
  bio?: string
}

export function getProfile(): Promise<UserProfile> {
  return apiFetch<UserProfile>('/users/profile')
}

export function uploadCV(file: File): Promise<{ mensaje: string; cvPath: string }> {
  const formData = new FormData()
  formData.append('cv', file)
  return apiUpload('/users/upload-cv', formData)
}
