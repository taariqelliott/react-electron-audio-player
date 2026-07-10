import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

// Builds a localfile:// URL that survives URL parsing on every platform.
// Windows paths (C:\Users\…) need a leading slash and full encoding, or the
// drive letter is parsed as a URL host and the request never resolves.
export function localFileUrl(basePath: string, ...segments: string[]): string {
  const normalized = basePath.replace(/\\/g, '/')
  const withLeadingSlash = normalized.startsWith('/') ? normalized : `/${normalized}`
  const encodedBase = withLeadingSlash.split('/').map(encodeURIComponent).join('/')
  const encodedSegments = segments.map(encodeURIComponent).join('/')
  return `localfile://${encodedBase}${encodedSegments ? `/${encodedSegments}` : ''}`
}

export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}
