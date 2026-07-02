import type { CSSProperties } from 'react'
import type { TaskKey } from '@/lib/site-config'

export type TaskTheme = {
  kicker: string
  note: string
  dark: boolean
  fontDisplay: string
  fontBody: string
  bg: string
  surface: string
  raised: string
  text: string
  muted: string
  line: string
  accent: string
  accentSoft: string
  onAccent: string
  glow: string
  radius: string
}

const DISPLAY = "'Cormorant Garamond', Georgia, serif"
const BODY = "'Manrope', system-ui, sans-serif"

const base = {
  dark: false,
  fontDisplay: DISPLAY,
  fontBody: BODY,
  bg: '#f4f1e8',
  surface: '#fbfaf3',
  raised: '#ece7d8',
  text: '#202118',
  muted: '#6a6d5a',
  line: 'rgba(62,63,41,0.15)',
  accent: '#3e3f29',
  accentSoft: '#d8d2bf',
  onAccent: '#f4f1e8',
  glow: 'rgba(188,168,141,0.24)',
  radius: '1.5rem',
} satisfies Omit<TaskTheme, 'kicker' | 'note'>

export const taskThemes: Record<TaskKey, TaskTheme> = {
  article: { ...base, kicker: 'Journal', note: 'Stories, market notes, and practical reads in an editorial layout.' },
  listing: { ...base, kicker: 'Directory', note: 'Compare local businesses through a cleaner discovery-first interface.' },
  classified: { ...base, kicker: 'Marketplace', note: 'Scan active offers and listings with a price-forward browsing rhythm.' },
  image: { ...base, kicker: 'Gallery', note: 'Visual posts lead the experience with stronger image surfaces.' },
  sbm: { ...base, kicker: 'Resources', note: 'Saved links and references presented like a curated shelf.' },
  pdf: { ...base, kicker: 'Library', note: 'Documents and downloads framed as a polished archive.' },
  profile: { ...base, kicker: 'Profiles', note: 'Identity, reputation, and contact details come forward first.' },
}

export function getTaskTheme(task: TaskKey): TaskTheme {
  return taskThemes[task] || taskThemes.article
}

export function taskThemeStyle(task: TaskKey): CSSProperties {
  const t = getTaskTheme(task)
  return {
    '--tk-bg': t.bg,
    '--tk-surface': t.surface,
    '--tk-raised': t.raised,
    '--tk-text': t.text,
    '--tk-muted': t.muted,
    '--tk-line': t.line,
    '--tk-accent': t.accent,
    '--tk-accent-soft': t.accentSoft,
    '--tk-on-accent': t.onAccent,
    '--tk-glow': t.glow,
    '--tk-radius': t.radius,
    '--slot4-accent': t.accent,
    '--slot4-accent-fill': t.accent,
    '--editable-font-display': t.fontDisplay,
    '--editable-font-body': t.fontBody,
    fontFamily: t.fontBody,
  } as CSSProperties
}
