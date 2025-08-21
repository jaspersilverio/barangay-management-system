import { twMerge } from 'tailwind-merge'

function toClassNames(input: unknown): string[] {
  if (!input) return []
  if (typeof input === 'string') return [input]
  if (Array.isArray(input)) return input.flatMap(toClassNames)
  if (typeof input === 'object') {
    return Object.entries(input as Record<string, unknown>)
      .filter(([, v]) => Boolean(v))
      .map(([k]) => k)
  }
  return []
}

export function cn(...inputs: unknown[]) {
  const classes = inputs.flatMap(toClassNames).join(' ')
  return twMerge(classes)
}


