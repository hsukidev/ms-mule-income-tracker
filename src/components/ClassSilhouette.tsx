interface ClassSilhouetteProps {
  klass: string
  size?: number
}

export function ClassSilhouette({ klass, size = 72 }: ClassSilhouetteProps) {
  const k = (klass || '').toLowerCase()
  const body = (
    <g>
      <ellipse cx="36" cy="48" rx="18" ry="20" fill="currentColor" opacity="0.55" />
      <ellipse cx="36" cy="30" rx="13" ry="14" fill="currentColor" opacity="0.55" />
    </g>
  )
  let hat = null
  if (k.includes('night lord')) {
    hat = (
      <g>
        <path d="M16 22 Q36 10 56 22 L52 26 Q36 20 20 26 Z" fill="currentColor" opacity="0.9" />
        <path d="M30 12 Q36 6 42 14 L38 22 L32 22 Z" fill="currentColor" opacity="0.9" />
      </g>
    )
  } else if (k.includes('shadower')) {
    hat = <path d="M22 30 Q22 14 36 14 Q50 14 50 30 L48 32 Q36 26 24 32 Z" fill="currentColor" opacity="0.9" />
  } else if (k.includes('bishop') || k.includes('mage')) {
    hat = <path d="M28 26 L36 8 L44 26 Z" fill="currentColor" opacity="0.9" />
  } else if (k.includes('kaiser') || k.includes('adele') || k.includes('paladin') || k.includes('hero') || k.includes('dark knight')) {
    hat = <path d="M24 24 L36 10 L48 24 Z" fill="currentColor" opacity="0.9" />
  } else if (k) {
    hat = <path d="M24 26 Q36 16 48 26 L46 28 Q36 22 26 28 Z" fill="currentColor" opacity="0.85" />
  }
  return (
    <svg viewBox="0 0 72 72" width={size} height={size} style={{ color: 'var(--dim, var(--surface-dim))' }} aria-hidden>
      {body}
      {hat}
    </svg>
  )
}
