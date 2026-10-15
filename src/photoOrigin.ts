// Remembers where a photo was tapped so the viewer can grow out of it.
// Kept out of the pages: a single capturing listener covers every photo entry point.
const SOURCES = '.seat-photo, .mini-grid button, .story, .quote, .opener'
let origin: { rect: DOMRect; radius: number; at: number } | null = null

if (typeof window !== 'undefined') {
  window.addEventListener('click', event => {
    const el = (event.target as Element | null)?.closest?.(SOURCES)
    if (!el) return
    const visual = el.querySelector('img, .ph') ?? el
    origin = { rect: visual.getBoundingClientRect(), radius: parseFloat(getComputedStyle(visual).borderRadius) || 12, at: performance.now() }
  }, true)
}

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** Grow the viewer out of the tapped thumbnail. No-op when nothing was tapped just before. */
export function playPhotoOpen(stage: HTMLElement | null) {
  const from = origin
  origin = null
  if (!stage || !from || performance.now() - from.at > 800 || reduced() || typeof stage.animate !== 'function') return
  const box = stage.getBoundingClientRect()
  if (!box.width || !box.height) return
  const t = Math.max(0, from.rect.top - box.top), l = Math.max(0, from.rect.left - box.left)
  const b = Math.max(0, box.bottom - from.rect.bottom), r = Math.max(0, box.right - from.rect.right)
  if (t + b >= box.height || l + r >= box.width) return
  stage.animate([
    { clipPath: `inset(${t}px ${r}px ${b}px ${l}px round ${from.radius}px)` },
    { clipPath: 'inset(0px 0px 0px 0px round 0px)' },
  ], { duration: 340, easing: 'cubic-bezier(.2,.8,.2,1)' })
  stage.classList.add('is-opening')
  window.setTimeout(() => stage.classList.remove('is-opening'), 340)
}
