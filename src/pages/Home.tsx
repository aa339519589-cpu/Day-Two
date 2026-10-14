import { useNavigate } from 'react-router-dom'
import { BRAND } from '../brand'
import { formatWhen, seatStatus, streakInfo } from '../logic'
import { useStore } from '../store'
import type { Person, Relation } from '../types'
import { Avatar, Photo, useTitle } from '../ui'

type Fill =
  | { kind: 'incoming' | 'outgoing'; person: Person; ended?: false }
  | { kind: 'suggest'; person: Person; ended: boolean }

const ROMAN = ['01', '02', '03']

export function HomePage() {
  const { data, today, acceptIncoming, declineIncoming, invite, cancelInvite, simulateAccept } = useStore()
  const navigate = useNavigate()
  useTitle(BRAND.name)

  const active = [0, 1, 2].map(
    (slot) => data.relations.find((rel) => rel.status === 'active' && rel.slot === slot) ?? null,
  )
  const queue: Fill[] = []
  for (const rel of data.relations) {
    if (rel.status !== 'incoming' && rel.status !== 'outgoing') continue
    const person = data.people.find((item) => item.id === rel.personId)
    if (person) queue.push({ kind: rel.status, person })
  }
  for (const person of data.people) {
    const rel = data.relations.find((item) => item.personId === person.id)
    if (!rel || rel.status === 'ended') queue.push({ kind: 'suggest', person, ended: rel?.status === 'ended' })
  }
  const activeCount = active.filter(Boolean).length
  const emptyCount = 3 - activeCount
  const placed = queue.slice(0, emptyCount)
  let cursor = 0

  return (
    <div className="home">
      <header className="home-masthead">
        <div className="home-masthead-top">
          <span className="eyebrow">{BRAND.name.toUpperCase()} · THREE SEATS</span>
          <span className="seat-occupancy">{activeCount} / 3 席在位</span>
        </div>
        <div className="home-masthead-main">
          <h1>三个席位</h1>
          <p className="home-tagline">{BRAND.tagline}</p>
        </div>
      </header>

      <div className="seats">
        {active.map((rel, index) => {
          const slotLabel = ROMAN[index] ?? `0${index + 1}`
          if (rel) {
            return <Seat key={rel.personId} rel={rel} slotLabel={slotLabel} today={today} />
          }
          const fill = placed[cursor]
          cursor += 1
          if (!fill) return <Quiet key={index} slotLabel={slotLabel} />
          return (
            <OpenSlot
              key={fill.person.id}
              slotLabel={slotLabel}
              fill={fill}
              onAccept={() => acceptIncoming(fill.person.id)}
              onDecline={() => declineIncoming(fill.person.id)}
              onInvite={() => invite(fill.person.id)}
              onCancel={() => cancelInvite(fill.person.id)}
              onSimulate={() => simulateAccept(fill.person.id)}
              onOpen={() => navigate(`/friend/${fill.person.id}`)}
            />
          )
        })}
      </div>
    </div>
  )
}

function Seat({ rel, slotLabel, today }: { rel: Relation; slotLabel: string; today: string }) {
  const { data } = useStore()
  const navigate = useNavigate()
  const person = data.people.find((item) => item.id === rel.personId)
  if (!person) return null

  const cover = latest(data.moments, person.id)
  const statusLine = seatStatus(rel.since, rel.contract, person.pronoun, today)
  const streak = rel.contract.status === 'active' ? streakInfo(rel.contract, today) : null
  const thread = data.messages.filter((m) => m.personId === person.id)
  const lastMsg = thread[thread.length - 1]

  return (
    <article className="seat-row active-seat">
      <div className="seat-header">
        <span className="seat-index">SEAT {slotLabel}</span>
        <span className="seat-status-pill">
          <span className={`status-dot${streak?.todayPeer ? ' live' : ''}`} />
          {statusLine}
          {streak && streak.days > 0 ? ` · 连续 ${streak.days} 天` : ''}
        </span>
      </div>

      <div className="seat-body" onClick={() => navigate(`/friend/${person.id}`)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/friend/${person.id}`) }}>
        <div className="seat-visual">
          <Photo image={cover?.image} alt={person.name} />
          {cover && <span className="seat-photo-time">{formatWhen(cover.createdAt)}</span>}
        </div>

        <div className="seat-info">
          <div className="seat-title-line">
            <h2 className="seat-name">{person.name}</h2>
            <span className="seat-city">{person.city}</span>
          </div>

          {cover?.caption ? (
            <p className="seat-excerpt">“{cover.caption}”</p>
          ) : (
            <p className="seat-excerpt">{person.bio}</p>
          )}

          {lastMsg && (
            <div className="seat-last-msg">
              <span className="msg-label">{lastMsg.from === 'me' ? '我' : person.pronoun}：</span>
              <span className="msg-preview">{lastMsg.text || '分享了一张照片'}</span>
            </div>
          )}

          <div className="seat-quick-bar" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="seat-link" onClick={() => navigate(`/feed/${person.id}`)}>
              看日常
            </button>
            <span className="sep">·</span>
            <button type="button" className="seat-link" onClick={() => navigate(`/chat/${person.id}`)}>
              去对话
            </button>
            <span className="sep">·</span>
            <button type="button" className="seat-link muted" onClick={() => navigate(`/friend/${person.id}`)}>
              关系档案
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

function latest(moments: { authorId: string; createdAt: string; image: string; caption?: string }[], authorId: string) {
  return [...moments].filter((moment) => moment.authorId === authorId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
}

function Quiet({ slotLabel }: { slotLabel: string }) {
  return (
    <article className="seat-row quiet-seat">
      <div className="seat-header">
        <span className="seat-index">SEAT {slotLabel}</span>
        <span className="seat-status-pill">空置</span>
      </div>
      <div className="quiet-inner">
        <p className="quiet-title">留白席位</p>
        <p className="fine">不必急着填满，留给想认真说话的人。</p>
      </div>
    </article>
  )
}

function OpenSlot({
  slotLabel,
  fill,
  onAccept,
  onDecline,
  onInvite,
  onCancel,
  onSimulate,
  onOpen,
}: {
  slotLabel: string
  fill: Fill
  onAccept: () => void
  onDecline: () => void
  onInvite: () => void
  onCancel: () => void
  onSimulate: () => void
  onOpen: () => void
}) {
  const { person } = fill
  const tagText =
    fill.kind === 'incoming'
      ? '收到席位邀请'
      : fill.kind === 'outgoing'
        ? '邀请已发出 · 等待回应'
        : fill.ended
          ? '曾同席 · 可再次邀请'
          : '席位空缺 · 候选人'

  return (
    <article className={`seat-row open-seat kind-${fill.kind}`}>
      <div className="seat-header">
        <span className="seat-index">SEAT {slotLabel}</span>
        <span className="seat-status-pill">{tagText}</span>
      </div>

      <div className="open-seat-main" onClick={onOpen} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') onOpen() }}>
        <Avatar initial={person.initial} tint={person.tint} large />
        <div className="open-seat-copy">
          <div className="seat-title-line">
            <h2 className="seat-name">{person.name}</h2>
            <span className="seat-city">
              {person.city} · {person.languages.join(' / ')}
            </span>
          </div>
          <p className="open-bio">{person.bio}</p>
          {person.interests.length > 0 && (
            <div className="interest-inline">
              {person.interests.map((item) => (
                <span key={item} className="tag-chip">
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="seat-actions">
        {fill.kind === 'incoming' && (
          <>
            <button type="button" className="btn-compact primary" onClick={onAccept}>
              接受席位
            </button>
            <button type="button" className="btn-compact" onClick={onDecline}>
              婉拒
            </button>
            <button type="button" className="btn-compact subtle" onClick={onOpen}>
              查看资料
            </button>
          </>
        )}
        {fill.kind === 'outgoing' && (
          <>
            <button type="button" className="btn-compact primary" onClick={onSimulate}>
              对方同意
            </button>
            <button type="button" className="btn-compact" onClick={onCancel}>
              撤回邀请
            </button>
          </>
        )}
        {fill.kind === 'suggest' && (
          <>
            <button type="button" className="btn-compact primary" onClick={onInvite}>
              邀请入席
            </button>
            <button type="button" className="btn-compact subtle" onClick={onOpen}>
              了解{person.pronoun}
            </button>
          </>
        )}
      </div>
    </article>
  )
}
