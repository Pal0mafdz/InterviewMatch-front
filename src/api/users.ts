import { apiFetch, apiUpload } from './client'

export interface PublicProfiles {
  leetcode: string
  codeforces: string
  linkedin: string
  github: string
}

export interface UserProfile {
  _id: string
  nombre: string
  email: string
  rol: 'user' | 'admin'
  cvPath?: string
  bio?: string
  publicProfiles?: PublicProfiles
  createdAt?: string
  updatedAt?: string
}

export function getProfile(): Promise<UserProfile> {
  return apiFetch<UserProfile>('/users/profile')
}

export function updateProfile(data: {
  nombre: string
  bio?: string
  publicProfiles: PublicProfiles
}): Promise<UserProfile> {
  return apiFetch<UserProfile>('/users/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function uploadCV(file: File): Promise<{ mensaje: string; cvPath: string }> {
  const formData = new FormData()
  formData.append('cv', file)
  return apiUpload('/users/upload-cv', formData)
}
