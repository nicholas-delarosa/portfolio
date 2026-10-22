import { ApiError, request, type AssociationTag, type ProjectRelation, type SkillCategory, type TimelineKind } from '../api'

export interface Me {
  isAdmin: boolean
  login: string | null
  name: string | null
  avatarUrl: string | null
}

export interface AdminProject {
  id: number
  gitHubId: number | null
  fullName: string
  name: string
  displayTitle: string
  ownerLogin: string
  relation: ProjectRelation
  htmlUrl: string | null
  gitHubHomepage: string | null
  gitHubDescription: string | null
  primaryLanguage: string | null
  languages: { name: string; color: string | null; bytes: number }[]
  topics: string[]
  stars: number
  forks: number
  isFork: boolean
  isArchived: boolean
  gitHubCreatedAt: string | null
  gitHubPushedAt: string | null
  removedFromGitHub: boolean
  lastSyncedAt: string | null
  isVisible: boolean
  isFeatured: boolean
  sortOrder: number
  titleEs: string | null
  titleEn: string | null
  descriptionEs: string | null
  descriptionEn: string | null
  demoUrl: string | null
  effectiveDemoUrl: string | null
  technologies: string[]
  imageUrl: string | null
  imageLocked: boolean
  imageCapturedAt: string | null
  imageError: string | null
  needsScreenshot: boolean
  association: AssociationTag | null
  associationLocked: boolean
}

export interface ProjectUpdate {
  isVisible: boolean
  isFeatured: boolean
  sortOrder: number
  titleEs: string | null
  titleEn: string | null
  descriptionEs: string | null
  descriptionEn: string | null
  demoUrl: string | null
  technologies: string[]
  associationId: number | null
  associationLocked: boolean
}

export const toUpdate = (p: AdminProject): ProjectUpdate => ({
  isVisible: p.isVisible,
  isFeatured: p.isFeatured,
  sortOrder: p.sortOrder,
  titleEs: p.titleEs,
  titleEn: p.titleEn,
  descriptionEs: p.descriptionEs,
  descriptionEn: p.descriptionEn,
  demoUrl: p.demoUrl,
  technologies: p.technologies,
  associationId: p.association?.id ?? null,
  associationLocked: p.associationLocked
})

export interface Association {
  id: number
  name: string
  slug: string
  gitHubLogin: string | null
  color: string
  websiteUrl: string | null
  logoUrl: string | null
  descriptionEs: string | null
  descriptionEn: string | null
  projectCount: number
}

export type AssociationInput = Omit<Association, 'id' | 'slug' | 'projectCount'>

export interface SpokenLanguage {
  nameEs: string
  nameEn: string
  level: string
}

export interface Profile {
  displayName: string
  level: number
  roleEs: string | null
  roleEn: string | null
  bioEs: string | null
  bioEn: string | null
  dialogEs: string | null
  dialogEn: string | null
  locationEs: string | null
  locationEn: string | null
  email: string | null
  linkedInUrl: string | null
  whatsApp: string | null
  gitHubLogin: string | null
  photoUrl: string | null
  cvEsUrl: string | null
  cvEnUrl: string | null
  availableForWork: boolean
  availabilityEs: string | null
  availabilityEn: string | null
  contributorTagColor: string
  spokenLanguages: SpokenLanguage[]
}

export interface Skill {
  name: string
  category: SkillCategory
  level: number
  icon: string | null
}

export interface TimelineEntry {
  kind: TimelineKind
  titleEs: string
  titleEn: string
  organization: string | null
  descriptionEs: string | null
  descriptionEn: string | null
  startDate: string
  endDate: string | null
  url: string | null
}

export interface Message {
  id: number
  name: string
  email: string
  message: string
  language: string | null
  isRead: boolean
  emailNotified: boolean
  createdAt: string
}

export interface SyncRun {
  id: number
  trigger: 'Manual' | 'Scheduled'
  status: 'Running' | 'Succeeded' | 'Failed'
  added: number
  updated: number
  error: string | null
  startedAt: string
  finishedAt: string | null
}

export interface SyncStatus {
  isRunning: boolean
  gitHubConfigured: boolean
  screenshotsConfigured: boolean
  cloudinaryConfigured: boolean
  emailConfigured: boolean
  runs: SyncRun[]
}

const json = (method: string, body?: unknown): RequestInit => ({ method, body: body === undefined ? undefined : JSON.stringify(body) })

async function upload<T>(url: string, file: File): Promise<T> {
  const form = new FormData()
  form.append('file', file)
  const response = await fetch(url, { method: 'POST', body: form })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new ApiError(response.status, body?.errors ?? {})
  }
  return response.json()
}

export const adminApi = {
  me: () => request<Me>('/api/auth/me'),
  logout: () => request<void>('/api/auth/logout', json('POST')),

  projects: () => request<AdminProject[]>('/api/admin/projects'),
  updateProject: (id: number, body: ProjectUpdate) => request<AdminProject>(`/api/admin/projects/${id}`, json('PUT', body)),
  setVisibility: (ids: number[], isVisible: boolean) => request<void>('/api/admin/projects/visibility', json('PATCH', { ids, isVisible })),
  saveOrder: (ids: number[]) => request<void>('/api/admin/projects/order', json('PUT', { ids })),
  createProject: (name: string, repoUrl: string | null, details: ProjectUpdate) =>
    request<AdminProject>('/api/admin/projects', json('POST', { name, repoUrl, details })),
  deleteProject: (id: number) => request<void>(`/api/admin/projects/${id}`, json('DELETE')),
  uploadProjectImage: (id: number, file: File) => upload<AdminProject>(`/api/admin/projects/${id}/image`, file),
  removeProjectImage: (id: number) => request<AdminProject>(`/api/admin/projects/${id}/image`, json('DELETE')),
  retakeScreenshot: (id: number) => request<void>(`/api/admin/projects/${id}/screenshot`, json('POST')),

  associations: () => request<Association[]>('/api/admin/associations'),
  createAssociation: (body: AssociationInput) => request<Association>('/api/admin/associations', json('POST', body)),
  updateAssociation: (id: number, body: AssociationInput) => request<Association>(`/api/admin/associations/${id}`, json('PUT', body)),
  deleteAssociation: (id: number) => request<void>(`/api/admin/associations/${id}`, json('DELETE')),

  profile: () => request<Profile>('/api/admin/profile'),
  saveProfile: (body: Profile) => request<Profile>('/api/admin/profile', json('PUT', body)),
  uploadPhoto: (file: File) => upload<Profile>('/api/admin/profile/photo', file),
  removePhoto: () => request<Profile>('/api/admin/profile/photo', json('DELETE')),
  uploadCv: (lang: 'es' | 'en', file: File) => upload<Profile>(`/api/admin/profile/cv/${lang}`, file),
  removeCv: (lang: 'es' | 'en') => request<Profile>(`/api/admin/profile/cv/${lang}`, json('DELETE')),

  skills: () => request<Skill[]>('/api/admin/skills'),
  saveSkills: (body: Skill[]) => request<Skill[]>('/api/admin/skills', json('PUT', body)),
  timeline: () => request<TimelineEntry[]>('/api/admin/timeline'),
  saveTimeline: (body: TimelineEntry[]) => request<TimelineEntry[]>('/api/admin/timeline', json('PUT', body)),

  messages: () => request<Message[]>('/api/admin/messages'),
  markMessage: (id: number, isRead: boolean) => request<void>(`/api/admin/messages/${id}`, json('PATCH', { isRead })),
  deleteMessage: (id: number) => request<void>(`/api/admin/messages/${id}`, json('DELETE')),

  syncStatus: () => request<SyncStatus>('/api/admin/sync'),
  syncNow: () => request<void>('/api/admin/sync', json('POST'))
}

// Convierte el error de la API en un texto para mostrar (los 400 traen el detalle de cada campo)
export function describeError(error: unknown) {
  if (error instanceof ApiError) {
    const details = Object.values(error.errors).flat()
    if (details.length > 0) return details.join(' ')
    if (error.status === 401) return 'Tu sesión expiró. Vuelve a entrar.'
    if (error.status === 409) return 'Ya hay una sincronización en curso.'
    return `El servidor respondió con un error (${error.status}).`
  }
  return 'No se pudo conectar con el servidor.'
}
