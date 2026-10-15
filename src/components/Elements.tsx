import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { initialOf } from '../logic'
import { Photo } from '../ui'

export type IconName = 'friends' | 'photo' | 'chat' | 'me' | 'plus' | 'back' | 'close' | 'arrow' | 'more' | 'expand' | 'contract' | 'check' | 'sun' | 'moon' | 'system' | 'edit' | 'camera' | 'chevron' | 'send' | 'image' | 'reply' | 'seat' | 'pause' | 'play'
const paths: Record<IconName, ReactNode> = {
  friends: <><rect x="3.5" y="5" width="5" height="14" rx="2.5"/><rect x="9.5" y="5" width="5" height="14" rx="2.5"/><rect x="15.5" y="5" width="5" height="14" rx="2.5" strokeDasharray="2.2 2.4"/></>,
  photo: <><rect x="6" y="2.75" width="12" height="18.5" rx="3"/><path d="M9.5 17.25h5"/></>,
  chat: <><path d="M20 11.4c0 4.2-3.6 7.6-8 7.6-1.1 0-2.2-.2-3.1-.6L4 20l1.3-3.9A7.4 7.4 0 0 1 4 11.4C4 7.2 7.6 3.8 12 3.8s8 3.4 8 7.6Z"/></>,
  me: <><circle cx="12" cy="8.6" r="3.6"/><path d="M4.8 20.2c1.3-3.3 4-5 7.2-5s5.9 1.7 7.2 5"/></>,
  plus: <path d="M12 5v14M5 12h14"/>, back: <path d="m14.5 5-7 7 7 7"/>,
  close: <path d="m6.5 6.5 11 11M17.5 6.5l-11 11"/>, arrow: <path d="M12 19V5m-6 6 6-6 6 6"/>,
  more: <><circle cx="5.5" cy="12" r="1.1" fill="currentColor"/><circle cx="12" cy="12" r="1.1" fill="currentColor"/><circle cx="18.5" cy="12" r="1.1" fill="currentColor"/></>,
  expand: <path d="M9 4H4v5M15 4h5v5M4 15v5h5M20 15v5h-5"/>,
  contract: <path d="M4 9h5V4M20 9h-5V4M4 15h5v5M20 15h-5v5"/>,
  check: <path d="m5 12.5 4.2 4.2L19 7"/>,
  sun: <><circle cx="12" cy="12" r="3.8"/><path d="M12 2.5v2m0 15v2M2.5 12h2m15 0h2M5.3 5.3l1.4 1.4m10.6 10.6 1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></>,
  moon: <path d="M19.5 14.6A7.8 7.8 0 0 1 9.4 4.5a7.8 7.8 0 1 0 10.1 10.1Z"/>,
  system: <><circle cx="12" cy="12" r="8"/><path d="M12 4v16a8 8 0 0 0 0-16Z" fill="currentColor"/></>,
  edit: <path d="m14.5 5.5 4 4M5 19l4.3-.9L19.6 7.8a2 2 0 0 0 0-2.8l-.6-.6a2 2 0 0 0-2.8 0L5.9 14.7 5 19Z"/>,
  camera: <><path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.8L10 4h4l1.7 2h1.8A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-8Z"/><circle cx="12" cy="12.3" r="3.3"/></>,
  chevron: <path d="m9.5 6 6 6-6 6"/>,
  send: <path d="M12 19V6m-5.5 5.5L12 6l5.5 5.5"/>,
  image: <><rect x="3.5" y="4.5" width="17" height="15" rx="3"/><circle cx="9" cy="9.8" r="1.5"/><path d="m4 17 4.8-4.4 3.4 3 3-2.6L20 17"/></>,
  reply: <path d="M9.5 6 4 11.5 9.5 17M4.5 11.5H14a6 6 0 0 1 6 6v.5"/>,
  seat: <rect x="7" y="4" width="10" height="16" rx="5"/>,
  pause: <path d="M9 6v12M15 6v12"/>,
  play: <path d="M8 5.5v13l10-6.5-10-6.5Z"/>,
}
export function Icon({ name, size = 22, stroke = 1.7 }: { name: IconName; size?: number; stroke?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

/** Brand mark: yesterday (outline) and the day after (filled ember) overlapping. */
export function Mark({ size = 26 }: { size?: number }) {
  return <svg className="brand-mark" width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
    <circle cx="10.5" cy="14" r="7.25" fill="none" stroke="currentColor" strokeWidth="2"/>
    <circle cx="17.5" cy="14" r="7.25" fill="var(--ember)"/>
  </svg>
}

export function Wordmark() {
  return <span className="wordmark"><Mark/><span>Day<i>Two</i></span></span>
}

export function PersonAvatar({ id, size = 'normal', ring = false }: { id: string; size?: 'tiny' | 'small' | 'normal' | 'large'; ring?: boolean }) {
  const { data } = useStore()
  const person = id === 'me' ? data.me : data.people.find(p => p.id === id)
  const image = data.moments.filter(m => m.authorId === id).sort((a,b) => b.createdAt.localeCompare(a.createdAt))[0]?.image
  return <span className={`person-avatar ${size}${ring ? ' ring' : ''}`} aria-hidden="true">{image ? <Photo image={image} alt=""/> : <b>{initialOf(person?.name || '')}</b>}</span>
}

export function BackButton({ to = '/home', label = '返回' }: { to?: string; label?: string }) {
  const navigate = useNavigate()
  return <button className="icon-button" type="button" aria-label={label} onClick={() => { if (window.history.state?.idx > 0) navigate(-1); else navigate(to) }}><Icon name="back"/></button>
}

const ROMAN = ['Ⅰ', 'Ⅱ', 'Ⅲ']
export function SeatNo({ slot }: { slot: number | null | undefined }) {
  return <span className="seat-no" aria-label={slot == null ? '空席位' : `第${slot + 1}席`}>{slot == null ? '·' : ROMAN[slot] ?? slot + 1}</span>
}

/** Three-seat meter used wherever relationship capacity is shown. */
export function SeatMeter({ used, pending = 0 }: { used: number; pending?: number }) {
  return <span className="seat-meter" role="img" aria-label={`已用 ${used} / 3 个席位`}>
    {[0, 1, 2].map(i => <i key={i} className={i < used ? 'on' : i < used + pending ? 'pending' : ''}/>)}
  </span>
}

export function Sheet({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    const dialog = ref.current
    const previous = document.activeElement as HTMLElement | null
    dialog?.showModal()
    return () => { dialog?.close(); previous?.focus() }
  }, [])
  return createPortal(<dialog className="sheet" ref={ref} aria-label={title} onCancel={e => { e.preventDefault(); close.current() }} onClick={e => {
    if (e.target !== e.currentTarget) return
    const r = e.currentTarget.getBoundingClientRect()
    if (e.clientY < r.top || e.clientY > r.bottom || e.clientX < r.left || e.clientX > r.right) close.current()
  }}>
    <span className="sheet-grip" aria-hidden="true"/>
    <header className="sheet-header"><h2>{title}</h2><button type="button" className="icon-button" aria-label="关闭" onClick={onClose}><Icon name="close" size={20}/></button></header>
    <div className="sheet-content">{children}</div>
  </dialog>, document.body)
}
export function Empty({ text, children }: { text: string; children?: ReactNode }) {
  return <div className="empty-state"><Mark size={34}/><p>{text}</p>{children}</div>
}
