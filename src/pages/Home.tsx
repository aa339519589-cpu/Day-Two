import { useNavigate } from 'react-router-dom'
import { BRAND } from '../brand'
import { useStore } from '../store'
import type { Person, Relation } from '../types'
import { Photo, useTitle } from '../ui'

type Fill =
  | { kind: 'incoming' | 'outgoing'; person: Person; ended?: false }
  | { kind: 'suggest'; person: Person; ended: boolean }

export function HomePage() {
  const { data, acceptIncoming, declineIncoming, invite, cancelInvite, simulateAccept } = useStore()
  const navigate = useNavigate()
  useTitle(BRAND.name)

  const active = [0, 1, 2].map((slot) => data.relations.find((rel) => rel.status === 'active' && rel.slot === slot) ?? null)
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
  const emptyCount = active.filter((item) => !item).length
  const placed = queue.slice(0, emptyCount)
  let cursor = 0

  return (
    <div className="home">
      <div className="seats">
        {active.map((rel, index) => {
          if (rel) return <Seat key={rel.personId} rel={rel} />
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

function Seat({ rel }: { rel: Relation }) {
  const { data } = useStore()
  const navigate = useNavigate()
  const person = data.people.find((item) => item.id === rel.personId)
  if (!person) return null
  const cover = latest(data.moments, person.id)
  return (
    <button type="button" className="seat" onClick={() => navigate(`/friend/${person.id}`)} aria-label={person.name}>
      <Photo image={cover?.image} alt="" />
      <span className="seat-veil" />
      <span className="seat-meta">
        <span className="seat-name">{person.name}</span>
      </span>
    </button>
  )
}

function latest(moments: { authorId: string; createdAt: string; image: string }[], authorId: string) {
  return [...moments].filter((moment) => moment.authorId === authorId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
}

function Quiet() {
  return <article className="seat quiet">空席位</article>
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
  const { data } = useStore()
  const { person } = fill
  const cover = latest(data.moments, person.id)

  return (
    <article className="seat request">
      <Photo image={cover?.image} alt="" />
      <span className="seat-veil" />
      <button type="button" className="seat-hit" aria-label={person.name} onClick={onOpen} />
      <span className="seat-meta">
        <span className="seat-name">{person.name}</span>
      </span>
      <div className="seat-actions">
        {fill.kind === 'incoming' && (
          <>
            <button type="button" onClick={onAccept}>
              接受
            </button>
            <button type="button" className="dim" onClick={onDecline}>
              婉拒
            </button>
          </>
        )}
        {fill.kind === 'outgoing' && (
          <>
            <button type="button" onClick={onSimulate}>
              对方同意
            </button>
            <button type="button" className="dim" onClick={onCancel}>
              撤回
            </button>
          </>
        )}
        {fill.kind === 'suggest' && (
          <button type="button" onClick={onInvite}>
            邀请
          </button>
        )}
      </div>
    </article>
  )
}
