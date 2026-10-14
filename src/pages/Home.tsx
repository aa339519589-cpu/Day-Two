import { useNavigate } from 'react-router-dom'
import { BRAND } from '../brand'
import { dayKeyFromIso, formatWhen, seatStatus, streakInfo } from '../logic'
import { useStore } from '../store'
import type { Moment, Person, Relation } from '../types'
import { Avatar, Photo, useTitle } from '../ui'

type Fill =
  | { kind: 'incoming' | 'outgoing'; person: Person; ended?: false }
  | { kind: 'suggest'; person: Person; ended: boolean }

function greeting(now: Date) {
  const h = now.getHours()
  if (h < 5) return '夜深了'
  if (h < 11) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
}

function latest(moments: Moment[], authorId: string): Moment | undefined {
  return [...moments].filter((moment) => moment.authorId === authorId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
}

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

  // 今天有多少人留下了新的东西、或在等你回一句
  let waiting = 0
  for (const rel of active) {
    if (!rel) continue
    const person = data.people.find((item) => item.id === rel.personId)
    if (!person) continue
    const cover = latest(data.moments, person.id)
    const thread = data.messages.filter((m) => m.personId === person.id)
    const last = thread[thread.length - 1]
    const postedToday = cover ? dayKeyFromIso(cover.createdAt) === today : false
    if (postedToday || last?.from === 'them') waiting += 1
  }

  return (
    <div className="home">
      <header className="home-hero">
        <p className="home-greeting">
          {greeting(new Date())}，{data.me.name || '朋友'}
        </p>
        {activeCount > 0 ? (
          <>
            <h1 className="home-lede">
              {waiting > 0 ? (
                <>
                  有 {waiting} 个人
                  <br />
                  在等你说句话
                </>
              ) : (
                <>
                  今天，
                  <br />
                  有人想听你说两句
                </>
              )}
            </h1>
            <p className="home-sub">不用寒暄，也不必秒回。想说的时候，回应一句，就够了。</p>
          </>
        ) : (
          <>
            <h1 className="home-lede">
              三个席位，
              <br />
              还留着空位
            </h1>
            <p className="home-sub">邀请一个想说得上话的人，把往后的每一天都留给彼此。</p>
          </>
        )}
      </header>

      <div className="seats">
        {active.map((rel, index) => {
          if (rel) return <Seat key={rel.personId} rel={rel} today={today} />
          const fill = placed[cursor]
          cursor += 1
          if (!fill) return <Quiet key={index} />
          return (
            <OpenSlot
              key={fill.person.id}
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

function Seat({ rel, today }: { rel: Relation; today: string }) {
  const { data } = useStore()
  const navigate = useNavigate()
  const person = data.people.find((item) => item.id === rel.personId)
  if (!person) return null

  const cover = latest(data.moments, person.id)
  const statusLine = seatStatus(rel.since, rel.contract, person.pronoun, today)
  const streak = rel.contract.status === 'active' ? streakInfo(rel.contract, today) : null
  const thread = data.messages.filter((m) => m.personId === person.id)
  const lastMsg = thread[thread.length - 1]

  const postedToday = cover ? dayKeyFromIso(cover.createdAt) === today : false
  const waitingReply = lastMsg?.from === 'them'
  const flagText = postedToday ? '今天的新日常' : waitingReply ? '在等你回应' : ''

  const respondTo = cover ? `/chat/${person.id}?moment=${cover.id}` : `/chat/${person.id}`

  const lead = cover?.caption ? `“${cover.caption}”` : lastMsg?.text ? `“${lastMsg.text}”` : person.bio

  const openFeed = () => navigate(`/feed/${person.id}`)

  return (
    <article className={`seat-card${flagText ? ' is-fresh' : ''}`}>
      <button type="button" className="seat-cover" onClick={openFeed}>
        <Photo image={cover?.image} alt={person.name} />
        {flagText && <span className="seat-flag">{flagText}</span>}
        {cover && <span className="seat-cover-time">{formatWhen(cover.createdAt)}</span>}
      </button>

      <div className="seat-foot">
        <div className="seat-id">
          <Avatar initial={person.initial} tint={person.tint} />
          <div className="seat-id-text">
            <strong>{person.name}</strong>
            <span>
              {statusLine}
              {streak && streak.days > 0 ? ` · 已连续 ${streak.days} 天` : ''}
            </span>
          </div>
        </div>

        <p className="seat-lead">{lead}</p>

        <div className="seat-cta">
          <button type="button" className="btn btn-respond" onClick={() => navigate(respondTo)}>
            回应{person.name}
          </button>
          <button type="button" className="seat-more" onClick={() => navigate(`/friend/${person.id}`)}>
            关系
          </button>
        </div>
      </div>
    </article>
  )
}

function Quiet() {
  return (
    <article className="quiet-seat">
      <p className="quiet-title">这里还留着空位</p>
      <p className="fine">不必急着填满，留给那个你想认真说话的人。</p>
    </article>
  )
}

function OpenSlot({
  fill,
  onAccept,
  onDecline,
  onInvite,
  onCancel,
  onSimulate,
  onOpen,
}: {
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
      ? '收到一个席位邀请'
      : fill.kind === 'outgoing'
        ? '邀请已发出 · 等对方回应'
        : fill.ended
          ? '曾经同席 · 可以再邀一次'
          : '席位空着 · 可以邀请'

  return (
    <article className={`open-seat kind-${fill.kind}`}>
      <span className="open-seat-tag">{tagText}</span>

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
              接受邀请
            </button>
            <button type="button" className="btn-compact" onClick={onDecline}>
              婉拒
            </button>
            <button type="button" className="btn-compact subtle" onClick={onOpen}>
              先看看{person.pronoun}
            </button>
          </>
        )}
        {fill.kind === 'outgoing' && (
          <>
            <button type="button" className="btn-compact primary" onClick={onSimulate}>
              模拟对方同意
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
              先了解{person.pronoun}
            </button>
          </>
        )}
      </div>
    </article>
  )
}
