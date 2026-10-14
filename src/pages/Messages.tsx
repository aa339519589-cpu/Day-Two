import { useNavigate } from 'react-router-dom'
import { BRAND } from '../brand'
import { dayCount, formatWhen, todayLine } from '../logic'
import { useStore } from '../store'
import { Avatar, useTitle } from '../ui'

export function MessagesPage() {
  const { data, today } = useStore()
  const navigate = useNavigate()
  useTitle(`消息 · ${BRAND.name}`)

  const ids = new Set<string>()
  for (const rel of data.relations) {
    if (rel.status === 'active' || rel.status === 'ended') ids.add(rel.personId)
  }
  for (const message of data.messages) ids.add(message.personId)

  const rows = [...ids]
    .map((id) => {
      const person = data.people.find((item) => item.id === id)
      const rel = data.relations.find((item) => item.personId === id)
      const thread = data.messages.filter((item) => item.personId === id)
      const last = thread[thread.length - 1]
      return { id, person, rel, last, count: thread.length }
    })
    .filter((row) => row.person)
    .sort((a, b) =>
      (b.last?.createdAt ?? b.rel?.since ?? '').localeCompare(a.last?.createdAt ?? a.rel?.since ?? ''),
    )

  return (
    <div className="screen messages-screen">
      <header className="page-masthead">
        <span className="eyebrow">CORRESPONDENCE</span>
        <h1>来往</h1>
      </header>

      {rows.length === 0 ? (
        <div className="empty-panel">
          <p className="serif">还没有信件往来</p>
          <span className="fine">当你在席位中与朋友开始交谈，对话会留在这里。</span>
        </div>
      ) : (
        <div className="threads">
          {rows.map((row) => {
            const person = row.person!
            const rel = row.rel
            const isEnded = rel?.status === 'ended'
            const badge =
              rel?.status === 'active'
                ? rel.contract.status === 'active'
                  ? todayLine(rel.contract, person.pronoun, today)
                  : `第 ${dayCount(rel.since)} 天`
                : isEnded
                  ? '已结束'
                  : ''

            return (
              <button
                key={row.id}
                type="button"
                className={`thread${isEnded ? ' is-ended' : ''}`}
                onClick={() => navigate(`/chat/${row.id}`)}
              >
                <Avatar initial={person.initial} tint={person.tint} />
                <span className="body">
                  <span className="thread-top">
                    <span className="thread-name-group">
                      <strong>{person.name}</strong>
                      {badge && <em className="thread-badge">{badge}</em>}
                    </span>
                    {row.last && <time className="thread-time">{formatWhen(row.last.createdAt)}</time>}
                  </span>
                  <p className="thread-excerpt">{preview(row.last, person.pronoun)}</p>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function preview(
  last: { from: 'me' | 'them'; text: string; image?: string; momentId?: string } | undefined,
  pronoun: string,
) {
  if (!last) return '还没有开始对话'
  const prefix = last.from === 'me' ? '我：' : ''
  if (last.text) return `${prefix}${last.text}`
  if (last.image) return `${prefix}[照片]`
  if (last.momentId) return `${prefix}回应了${last.from === 'me' ? pronoun : '我'}的日常`
  return '还没有开始对话'
}
