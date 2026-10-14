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
        {rows.length === 0 && <p className="footnote">没有消息</p>}
        {rows.map((row) => (
          <button key={row.id} type="button" className="thread" onClick={() => navigate(`/chat/${row.id}`)}>
            <Avatar initial={row.person!.initial} tint={row.person!.tint} />
            <span className="body">
              <strong>
                {row.person!.name}
                {row.rel?.status === 'ended' && <em>关系已结束</em>}
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
  if (!last) return '还没有消息'
  if (last.momentId && last.text) return last.text
  if (last.momentId) return last.from === 'me' ? '你回应了一张日常' : '回应了一张日常'
  if (last.image) return last.from === 'me' ? '你发了一张照片' : '发来一张照片'
  return last.text
}
