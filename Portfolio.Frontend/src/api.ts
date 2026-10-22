import { useEffect, useState } from 'react'
import type { Lang } from './i18n'

export type ProjectRelation = 'Owner' | 'Organization' | 'Contributor' | 'Manual'
export type SkillCategory = 'Frontend' | 'Backend' | 'Database' | 'DevOps' | 'Tools'
export type TimelineKind = 'Education' | 'Work' | 'Milestone'

export interface AssociationTag {
  id: number
  name: string
  slug: string
  color: string
  url: string | null
  logoUrl: string | null
}

export interface Project {
  id: number
  fullName: string
  title: string
  description: string | null
  imageUrl: string | null
  imageIsPlaceholder: boolean
  demoUrl: string | null
  repoUrl: string | null
  primaryLanguage: string | null
  languages: { name: string; color: string | null; percent: number }[]
  technologies: string[]
  stars: number
  forks: number
  createdAt: string | null
  lastActivityAt: string | null
  isFeatured: boolean
  isArchived: boolean
  relation: ProjectRelation
  association: AssociationTag | null
  contributor: { owner: string; color: string } | null
}

export interface Site {
  profile: {
    displayName: string
    level: number
    role: string | null
    bio: string | null
    dialog: string | null
    location: string | null
    email: string | null
    linkedInUrl: string | null
    whatsApp: string | null
    gitHubUrl: string | null
    photoUrl: string | null
    cvUrl: string | null
    cvOtherLanguageUrl: string | null
    availableForWork: boolean
    availability: string | null
    spokenLanguages: { name: string; level: string }[]
  }
  skills: { name: string; category: SkillCategory; level: number; icon: string | null }[]
  timeline: {
    kind: TimelineKind
    title: string
    organization: string | null
    description: string | null
    startDate: string
    endDate: string | null
    url: string | null
  }[]
  gitHubLanguages: { name: string; color: string | null; repos: number; percent: number }[]
  stats: { projects: number; associations: number; contributions: number; languages: number }
  featured: { id: number; title: string; description: string | null; imageUrl: string | null } | null
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public errors: Record<string, string[]> = {}
  ) {
    super(`HTTP ${status}`)
  }
}

export async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { Accept: 'application/json', ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers }
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new ApiError(response.status, body?.errors ?? {})
  }
  return response.status === 204 || response.status === 202 ? (undefined as T) : response.json()
}

// Caché en memoria: volver a una página ya visitada se ve al instante y se refresca por detrás
const cache = new Map<string, unknown>()

type State<T> = { data: T | undefined; error: boolean }

function useCached<T>(url: string): State<T> {
  const [state, setState] = useState<State<T>>(() => ({ data: cache.get(url) as T | undefined, error: false }))

  useEffect(() => {
    let active = true
    setState({ data: cache.get(url) as T | undefined, error: false })
    request<T>(url)
      .then((data) => {
        cache.set(url, data)
        if (active) setState({ data, error: false })
      })
      .catch(() => {
        if (active) setState((s) => ({ data: s.data, error: s.data === undefined }))
      })
    return () => {
      active = false
    }
  }, [url])

  return state
}

export const useSite = (lang: Lang) => useCached<Site>(`/api/site?lang=${lang}`)
export const useProjects = (lang: Lang) => useCached<Project[]>(`/api/projects?lang=${lang}`)

export const sendContact = (body: { name: string; email: string; message: string; language: Lang; website: string }) =>
  request<void>('/api/contact', { method: 'POST', body: JSON.stringify(body) })
