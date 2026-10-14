import { useNavigate } from 'react-router-dom'
import { BRAND } from '../brand'
import { formatWhen } from '../logic'
import { useStore } from '../store'
import { Avatar, useTitle } from '../ui'

export function MessagesPage() {
  const { data } = useStore()
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
      return { id, person, rel, last }
    })
    .filter((row) => row.person)
    .sort((a, b) => (b.last?.createdAt ?? b.rel?.since ?? '').localeCompare(a.last?.createdAt ?? a.rel?.since ?? ''))

  return (
    <div className="screen">
      <h1>消息</h1>
      <div className="threads">
        {rows.map((row) => (
          <button key={row.id} type="button" className="thread" onClick={() => navigate(`/chat/${row.id}`)}>
            <Avatar initial={row.person!.initial} />
            <span className="body">
              <strong>
                {row.person!.name}
              </strong>
              <p>{preview(row.last)}</p>
            </span>
            {row.last && <span className="fine">{formatWhen(row.last.createdAt)}</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

function preview(last: { from: 'me' | 'them'; text: string; image?: string; momentId?: string } | undefined) {
  if (!last) return ''
  if (last.text) return last.text
  if (last.momentId || last.image) return ''
  return last.text
}
