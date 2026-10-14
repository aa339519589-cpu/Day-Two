import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BRAND } from '../brand'
import { useImage } from '../images'
import { decideDir, formatWhen } from '../logic'
import { useStore } from '../store'
import type { Moment } from '../types'
import { Avatar, Dialog, IconPlus, LockScroll, fallbackPhoto, useTitle } from '../ui'

export function DailyPage() {
  const { data, removeMoment } = useStore()
  const navigate = useNavigate()
  useTitle(`日常 · ${BRAND.name}`)

  const activeFriends = useMemo(
    () =>
      data.relations
        .filter((rel) => rel.status === 'active')
        .map((rel) => data.people.find((p) => p.id === rel.personId))
        .filter((p): p is NonNullable<typeof p> => Boolean(p)),
    [data.relations, data.people],
  )

  const [filterId, setFilterId] = useState<string>('all')
  const [immersive, setImmersive] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const allowedAuthors = useMemo(() => {
    const set = new Set<string>(['me'])
    for (const friend of activeFriends) set.add(friend.id)
    return set
  }, [activeFriends])

  const list = useMemo(() => {
    return data.moments
      .filter((moment) => {
        if (!allowedAuthors.has(moment.authorId)) return false
        if (filterId === 'all') return true
        return moment.authorId === filterId
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [data.moments, allowedAuthors, filterId])

  const [index, setIndex] = useState(0)
  const safeIndex = list.length === 0 ? 0 : Math.min(index, list.length - 1)

  const stageRef = useRef<HTMLDivElement>(null)
  const reelRef = useRef<HTMLDivElement>(null)
  const indexRef = useRef(safeIndex)
  const listRef = useRef(list)
  const anim = useRef(false)
  indexRef.current = safeIndex
  listRef.current = list

  useEffect(() => {
    setIndex(0)
  }, [filterId])

  useEffect(() => {
    document.documentElement.classList.toggle('immersive-reel', immersive)
    return () => document.documentElement.classList.remove('immersive-reel')
  }, [immersive])

  useLayoutEffect(() => {
    const reel = reelRef.current
    if (!reel) return
    reel.style.transition = 'none'
    reel.style.transform = 'translate3d(0,0,0)'
    anim.current = false
  }, [safeIndex, filterId])

  const go = (dir: -1 | 1) => {
    const count = listRef.current.length
    const current = indexRef.current
    if (anim.current) return
    const next = current + dir
    const stage = stageRef.current
    const reel = reelRef.current
    if (!stage || !reel) return
    if (next < 0 || next >= count) {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      reel.animate(
        [
          { transform: 'translate3d(0,0,0)' },
          { transform: `translate3d(0, ${dir === 1 ? -18 : 18}px, 0)` },
          { transform: 'translate3d(0,0,0)' },
        ],
        { duration: 240, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
      )
      return
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIndex(next)
      return
    }
    anim.current = true
    const height = stage.clientHeight
    reel.style.transition = 'transform 360ms cubic-bezier(.22,.84,.28,1)'
    reel.style.transform = `translate3d(0, ${dir === 1 ? -height : height}px, 0)`
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      reel.removeEventListener('transitionend', finish)
      setIndex(next)
    }
    const timer = window.setTimeout(finish, 420)
    reel.addEventListener('transitionend', finish)
  }

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const drag = { startY: 0, lastY: 0, lastT: 0, dy: 0, vy: 0, active: false, moved: false }
    const onDown = (event: PointerEvent) => {
      if (anim.current) return
      const target = event.target as HTMLElement
      if (target.closest('button, a')) return
      drag.active = true
      drag.moved = false
      drag.startY = drag.lastY = event.clientY
      drag.lastT = performance.now()
      drag.dy = 0
      drag.vy = 0
      stage.setPointerCapture(event.pointerId)
    }
    const onMove = (event: PointerEvent) => {
      if (!drag.active || anim.current) return
      const now = performance.now()
      drag.vy = (event.clientY - drag.lastY) / Math.max(1, now - drag.lastT)
      drag.lastY = event.clientY
      drag.lastT = now
      drag.dy = event.clientY - drag.startY
      if (Math.abs(drag.dy) > 8) drag.moved = true
      const count = listRef.current.length
      const current = indexRef.current
      let offset = drag.dy
      if ((current === 0 && offset > 0) || (current === count - 1 && offset < 0)) offset *= 0.28
      const reel = reelRef.current
      if (!reel) return
      reel.style.transition = 'none'
      reel.style.transform = `translate3d(0, ${offset}px, 0)`
    }
    const onUp = () => {
      if (!drag.active) return
      drag.active = false
      if (!drag.moved && Math.abs(drag.dy) < 6) {
        setImmersive((prev) => !prev)
        return
      }
      const height = stage.clientHeight
      const dir = decideDir(drag.dy, drag.vy, height, indexRef.current, listRef.current.length)
      if (dir === 0) {
        const reel = reelRef.current
        if (!reel) return
        reel.style.transition = 'transform 260ms cubic-bezier(.22,.84,.28,1)'
        reel.style.transform = 'translate3d(0,0,0)'
        return
      }
      go(dir)
    }
    stage.addEventListener('pointerdown', onDown)
    stage.addEventListener('pointermove', onMove)
    stage.addEventListener('pointerup', onUp)
    stage.addEventListener('pointercancel', onUp)
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      if (Math.abs(event.deltaY) < 10) return
      go(event.deltaY > 0 ? 1 : -1)
    }
    stage.addEventListener('wheel', onWheel, { passive: false })
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown' || event.key === 'PageDown') {
        event.preventDefault()
        go(1)
      }
      if (event.key === 'ArrowUp' || event.key === 'PageUp') {
        event.preventDefault()
        go(-1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      stage.removeEventListener('pointerdown', onDown)
      stage.removeEventListener('pointermove', onMove)
      stage.removeEventListener('pointerup', onUp)
      stage.removeEventListener('pointercancel', onUp)
      stage.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  const current = list[safeIndex]
  const prev = list[safeIndex - 1]
  const next = list[safeIndex + 1]

  const resolveAuthor = (authorId: string) => {
    if (authorId === 'me') {
      return {
        id: 'me',
        name: data.me.name || '我',
        city: data.me.city,
        initial: data.me.name?.[0] || '我',
        tint: data.me.tint,
        isMe: true,
      }
    }
    const p = data.people.find((item) => item.id === authorId)
    return {
      id: authorId,
      name: p?.name ?? '好友',
      city: p?.city ?? '',
      initial: p?.initial ?? '·',
      tint: p?.tint,
      isMe: false,
    }
  }

  const author = current ? resolveAuthor(current.authorId) : null

  return (
    <div className={`theater daily-stage${immersive ? ' is-immersive' : ''}`} ref={stageRef}>
      <LockScroll />
      <header className="feed-top daily-top">
        <div className="daily-filters" role="tablist" aria-label="日常筛选">
          <button
            type="button"
            role="tab"
            aria-selected={filterId === 'all'}
            className={filterId === 'all' ? 'filter-chip on' : 'filter-chip'}
            onClick={() => setFilterId('all')}
          >
            全部
          </button>
          {activeFriends.map((friend) => (
            <button
              key={friend.id}
              type="button"
              role="tab"
              aria-selected={filterId === friend.id}
              className={filterId === friend.id ? 'filter-chip on' : 'filter-chip'}
              onClick={() => setFilterId(friend.id)}
            >
              {friend.name}
            </button>
          ))}
          <button
            type="button"
            role="tab"
            aria-selected={filterId === 'me'}
            className={filterId === 'me' ? 'filter-chip on' : 'filter-chip'}
            onClick={() => setFilterId('me')}
          >
            我
          </button>
        </div>
        <button
          type="button"
          className="compose-trigger"
          aria-label="记下今天"
          onClick={() => navigate('/compose')}
        >
          <IconPlus />
          <span>记下</span>
        </button>
      </header>

      {list.length === 0 ? (
        <div className="reel-empty">
          <p className="eyebrow">DAILY ARCHIVE</p>
          <h2>还没有留下的日常</h2>
          <p className="fine">今天看到的某个瞬间，随时可以放进这里。</p>
          <button type="button" className="btn light-ink" onClick={() => navigate('/compose')}>
            记下今天
          </button>
        </div>
      ) : (
        <>
          <div className="reel" ref={reelRef}>
            {prev ? <Slide moment={prev} place="prev" /> : <div className="slide prev" />}
            {current && <Slide moment={current} place="current" />}
            {next ? <Slide moment={next} place="next" /> : <div className="slide next" />}
          </div>

          {current && author && (
            <footer className="feed-bottom">
              <div className="feed-editorial">
                <div className="feed-author-row">
                  <button
                    type="button"
                    className="feed-author-btn"
                    onClick={() => navigate(author.isMe ? '/me' : `/friend/${author.id}`)}
                  >
                    <Avatar initial={author.initial} tint={author.tint} />
                    <span className="feed-author-text">
                      <strong>{author.isMe ? `${author.name} · 我` : author.name}</strong>
                      <small>
                        {formatWhen(current.createdAt)}
                        {author.city ? ` · ${author.city}` : ''}
                      </small>
                    </span>
                  </button>
                  <span className="feed-counter" aria-live="polite">
                    {String(safeIndex + 1).padStart(2, '0')} / {String(list.length).padStart(2, '0')}
                  </span>
                </div>

                {current.caption && <p className="cap">{current.caption}</p>}

                <div className="feed-actions-bar">
                  {!author.isMe ? (
                    <>
                      <button
                        type="button"
                        className="reel-action primary"
                        onClick={() => navigate(`/chat/${author.id}?moment=${current.id}`)}
                      >
                        回应这张照片
                      </button>
                      <button
                        type="button"
                        className="reel-action"
                        onClick={() => navigate(`/feed/${author.id}?m=${current.id}`)}
                      >
                        只看{author.name}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="reel-action primary"
                        onClick={() => navigate('/compose')}
                      >
                        再记一张
                      </button>
                      {current.mine && (
                        <button
                          type="button"
                          className="reel-action subtle"
                          onClick={() => setConfirmDelete(true)}
                        >
                          移除
                        </button>
                      )}
                    </>
                  )}
                  <span className="swipe-cue">↑ 上滑下一张</span>
                </div>
              </div>
            </footer>
          )}
        </>
      )}

      {confirmDelete && current && (
        <Dialog
          title="移除这张照片"
          body="移除后将不再出现在你的日常中。"
          confirm="确认移除"
          danger
          onClose={() => setConfirmDelete(false)}
          onConfirm={() => {
            void removeMoment(current.id)
            setConfirmDelete(false)
          }}
        />
      )}
    </div>
  )
}

function Slide({ moment, place }: { moment: Moment; place: 'prev' | 'current' | 'next' }) {
  const src = useImage(moment.image)
  return (
    <div className={`slide ${place}`}>
      {src ? (
        <div className="slide-frame">
          <img
            className="fit"
            src={src}
            alt={place === 'current' ? moment.caption || '日常照片' : ''}
            draggable={false}
            onError={(e) => {
              const fb = fallbackPhoto(moment.image)
              if (e.currentTarget.src !== fb) e.currentTarget.src = fb
            }}
          />
        </div>
      ) : (
        <div className="ph-full" />
      )}
    </div>
  )
}
