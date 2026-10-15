import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../store'
import { dayCount, formatWhen } from '../logic'
import { LockScroll, Photo, useTitle } from '../ui'
import { BackButton, Icon, PersonAvatar, Sheet } from './Elements'

const REEL_KEY = 'daytwo-reel-position-v1'
function savedReel(): {filter: string; id: string} | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(REEL_KEY) || 'null')
    return typeof value?.filter === 'string' && typeof value?.id === 'string' ? value : null
  } catch { return null }
}
function saveReel(filter: string, id: string) {
  try { sessionStorage.setItem(REEL_KEY, JSON.stringify({filter, id})) } catch { /* Private browsing may disable session storage. */ }
}

export function PhotoStream({ personId, inShell = false }: { personId?: string; inShell?: boolean }) {
  const { data, removeMoment, showToast } = useStore()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const focus = params.get('m')
  const [filter, setFilter] = useState(() => inShell ? savedReel()?.filter || 'all' : 'all')
  const [index, setIndex] = useState(0)
  const [clean, setClean] = useState(false)
  const [full, setFull] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [busy, setBusy] = useState(false)
  const rail = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const position = useRef(0)
  const pointer = useRef({x: 0, y: 0, moved: false})
  const friends = useMemo(() => data.people.filter(p => data.relations.some(r => r.personId === p.id && r.status === 'active')), [data.people, data.relations])
  const blocked = !!personId && personId !== 'me' && !friends.some(p => p.id === personId)
  const chosen = personId || filter
  useEffect(() => {
    if (inShell && filter !== 'all' && filter !== 'me' && !friends.some(p => p.id === filter)) setFilter('all')
  }, [inShell, filter, friends])
  const list = useMemo(() => data.moments.filter(m =>
    !blocked && (m.authorId === 'me' || friends.some(p => p.id === m.authorId)) && (chosen === 'all' || m.authorId === chosen)
  ).sort((a,b) => b.createdAt.localeCompare(a.createdAt)), [data.moments, friends, chosen, blocked])
  const ids = list.map(m => m.id).join(',')
  const count = useRef(list.length)
  count.current = list.length
  const safe = Math.min(index, Math.max(0, list.length-1))
  const current = list[safe]
  const author = current?.authorId === 'me' ? data.me : data.people.find(p => p.id === current?.authorId)
  const name = personId === 'me' ? '我的日常' : data.people.find(p => p.id === personId)?.name || '日常'
  useTitle(`${name} · Day Two`)

  useLayoutEffect(() => {
    const node = rail.current
    const last = inShell && !focus ? savedReel() : null
    const target = focus || (last?.filter === chosen ? last.id : null)
    const found = target ? list.findIndex(m => m.id === target) : -1
    const next = found < 0 ? 0 : found
    position.current = next
    setIndex(next)
    if (node) node.scrollTop = next * node.clientHeight
    if (inShell && list[next]) saveReel(chosen, list[next].id)
    setFull(false)
    // The list is represented by IDs so unrelated chat/profile changes do not reset a photo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosen, focus, ids])
  useEffect(() => {
    document.documentElement.classList.toggle('immersive-reel', inShell && clean)
    return () => document.documentElement.classList.remove('immersive-reel')
  }, [clean, inShell])
  useEffect(() => {
    const node = rail.current
    if (!node) return
    let frame = 0
    let wheelSum = 0
    let wheelLock = false
    let wheelTimer = 0
    const sync = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const next = Math.max(0, Math.min(count.current - 1, Math.round(node.scrollTop / Math.max(1, node.clientHeight))))
        position.current = next
        setIndex(next)
        if (inShell && list[next]) saveReel(chosen, list[next].id)
      })
    }
    const go = (dir: number) => {
      const next = Math.max(0, Math.min(count.current - 1, position.current + dir))
      node.scrollTo({top: next * node.clientHeight, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'})
    }
    const onWheel = (e: WheelEvent) => {
      if (document.querySelector('dialog[open]') || e.ctrlKey) return
      e.preventDefault()
      clearTimeout(wheelTimer)
      wheelTimer = window.setTimeout(() => {wheelLock = false;wheelSum = 0}, 180)
      if (wheelLock) return
      wheelSum += e.deltaY
      if (Math.abs(wheelSum) < 18) return
      wheelLock = true
      go(wheelSum > 0 ? 1 : -1)
    }
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector('dialog[open]') || (e.target as HTMLElement).closest('input,textarea,button,a,select')) return
      if (['ArrowDown','PageDown','ArrowUp','PageUp'].includes(e.key)) {
        e.preventDefault()
        go(e.key === 'ArrowDown' || e.key === 'PageDown' ? 1 : -1)
      }
      if (e.key === 'Escape') setClean(false)
    }
    const observer = new ResizeObserver(() => {node.scrollTop = position.current * node.clientHeight})
    observer.observe(node)
    node.addEventListener('scroll', sync, {passive:true})
    node.addEventListener('wheel', onWheel, {passive:false})
    window.addEventListener('keydown', onKey)
    return () => {observer.disconnect();cancelAnimationFrame(frame);clearTimeout(wheelTimer);node.removeEventListener('scroll',sync);node.removeEventListener('wheel',onWheel);window.removeEventListener('keydown',onKey)}
  }, [chosen, ids, inShell])
  useEffect(() => {
    const viewport = window.visualViewport
    const node = stage.current
    if (!viewport || !node || inShell) return
    const sync = () => {node.style.height = `${viewport.height}px`;node.style.top = `${viewport.offsetTop}px`}
    sync()
    viewport.addEventListener('resize', sync)
    viewport.addEventListener('scroll', sync)
    return () => {viewport.removeEventListener('resize',sync);viewport.removeEventListener('scroll',sync)}
  }, [inShell])

  const answered = current && current.authorId !== 'me' ? data.messages.some(m => m.from === 'me' && m.momentId === current.id) : false
  const rel = current && current.authorId !== 'me' ? data.relations.find(r => r.personId === current.authorId) : undefined
  const dots = list.length > 1 ? list.slice(Math.max(0, Math.min(safe - 4, list.length - 9)), Math.max(0, Math.min(safe - 4, list.length - 9)) + 9) : []

  return <section className={`photo-stage${inShell ? ' in-shell' : ' standalone'}${clean ? ' chrome-hidden' : ''}${full ? ' show-full' : ''}`} ref={stage} data-current-id={current?.id}>
    <LockScroll/>
    {list.length > 0 ? <div ref={rail} className="photo-rail" tabIndex={0} aria-label="日常照片" onPointerDown={e => {pointer.current={x:e.clientX,y:e.clientY,moved:false}}} onPointerMove={e => {if (Math.abs(e.clientY-pointer.current.y)>8 || Math.abs(e.clientX-pointer.current.x)>8) pointer.current.moved=true}} onClick={() => {if (!pointer.current.moved) setClean(v => !v)}}>
      {list.map((moment, i) => <article key={moment.id} className="photo-slide" aria-hidden={i !== safe}>{Math.abs(i - safe) <= 1 && <>{full && <Photo className="photo-backdrop" image={moment.image} alt=""/>}<Photo image={moment.image} alt={i === safe ? moment.caption || '日常照片' : ''}/></>}</article>)}
    </div> : <div className="photo-empty"><span className="photo-empty-frame"><Icon name="photo" size={30}/></span><h2>{blocked ? '还不是好友' : '这里还没有照片'}</h2><p>{blocked ? '成为朋友后，才能看到彼此的日常。' : '分享一张今天的照片，朋友可以从它开始聊。'}</p><button type="button" className="pill light" onClick={() => navigate(blocked ? `/friend/${personId}` : '/compose')}>{blocked ? '查看资料' : '分享照片'}</button></div>}
    <div className="photo-scrim top" aria-hidden="true"/><div className="photo-scrim bottom" aria-hidden="true"/>
    <header className="photo-top photo-chrome">
      {inShell ? <div className="photo-filters" aria-label="按好友筛选">
        <button type="button" className={filter === 'all' ? 'selected' : ''} aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>全部</button>
        {friends.map(p => <button type="button" key={p.id} className={filter === p.id ? 'selected' : ''} aria-pressed={filter === p.id} onClick={() => setFilter(p.id)}>{p.name}</button>)}
        <button type="button" className={filter === 'me' ? 'selected' : ''} aria-pressed={filter === 'me'} onClick={() => setFilter('me')}>我</button>
      </div> : <><BackButton to="/daily"/><span className="photo-page-name">{name}</span></>}
      <button type="button" className="icon-button glass" aria-label="分享日常" onClick={() => navigate('/compose')}><Icon name="camera" size={21}/></button>
    </header>
    {dots.length > 1 && <div className="photo-progress photo-chrome" aria-hidden="true">{dots.map(m => <i key={m.id} className={m.id === current?.id ? 'on' : ''}/>)}</div>}
    {current && author && <footer className="photo-bottom photo-chrome">
      <div className="photo-byline">
        <button type="button" className="photo-author" onClick={() => navigate(current.authorId === 'me' ? '/me' : `/friend/${current.authorId}`)}>
          <PersonAvatar id={current.authorId} size="small" ring/>
          <span><strong>{current.authorId === 'me' ? '我' : author.name}</strong><time>{rel?.status === 'active' ? `第 ${dayCount(rel.since)} 天 · ` : ''}{formatWhen(current.createdAt)}</time></span>
        </button>
        <span className="photo-counter" aria-live="polite">{safe+1} / {list.length}</span>
      </div>
      {current.caption && <p className="photo-caption">{current.caption}</p>}
      <div className="photo-tools">
        {current.authorId === 'me'
          ? <button type="button" className="photo-reply" onClick={() => navigate('/compose')}><Icon name="plus" size={18}/><span>再分享一张</span></button>
          : <button type="button" className="photo-reply" aria-label="说点什么…" onClick={() => navigate(`/chat/${current.authorId}?moment=${encodeURIComponent(current.id)}`)}><span>{answered ? '接着聊这张…' : `回应${author.name}…`}</span><span className="photo-reply-go"><Icon name="send" size={17} stroke={2}/></span></button>}
        <button className="icon-button glass" type="button" aria-label={full ? '填满屏幕' : '查看完整照片'} aria-pressed={full} onClick={() => setFull(v => !v)}><Icon name={full ? 'contract' : 'expand'} size={20}/></button>
        {current.mine && <button className="icon-button glass" type="button" aria-label="照片选项" onClick={() => setDeleting(true)}><Icon name="more"/></button>}
      </div>
      {answered && <p className="photo-answered"><Icon name="check" size={14} stroke={2.2}/>你回应过这张</p>}
    </footer>}
    {deleting && current && <Sheet title="这张照片" onClose={() => {if (!busy) setDeleting(false)}}><p className="sheet-note">删除后，朋友也看不到它了。</p><button className="settings-row danger-text" type="button" disabled={busy} onClick={async () => {setBusy(true);try {await removeMoment(current.id);setDeleting(false)} catch {showToast('删除失败，请重试')} finally {setBusy(false)}}}>{busy ? '删除中…' : '删除这张照片'}</button></Sheet>}
  </section>
}
