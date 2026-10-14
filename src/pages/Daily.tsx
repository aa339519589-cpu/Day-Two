import { useNavigate } from 'react-router-dom'
import { BRAND } from '../brand'
import { useStore } from '../store'
import { Photo, useTitle } from '../ui'

export function DailyPage() {
  const { data } = useStore()
  const navigate = useNavigate()
  useTitle(`日常 · ${BRAND.name}`)
  const friends = data.relations.filter((rel) => rel.status === 'active')
  const mine = latest(data.moments, 'me')

  return (
    <div className="screen">
      <div className="headrow">
        <h1>日常</h1>
        <button type="button" className="btn text" onClick={() => navigate('/compose')}>
          记下
        </button>
      </div>
      <div className="entries">
        <button type="button" className="entry" onClick={() => (mine ? navigate('/feed/me') : navigate('/compose'))}>
          {mine ? (
            <div className="frame">
              <Photo image={mine.image} alt="" />
              <span className="frame-veil" />
              <span className="frame-meta">
                <strong>我</strong>
              </span>
            </div>
          ) : (
            <div className="plain-frame">
              <strong>记下今天</strong>
            </div>
          )}
        </button>
        {friends.map((rel) => {
          const person = data.people.find((item) => item.id === rel.personId)
          const cover = person ? latest(data.moments, person.id) : undefined
          if (!person) return null
          return (
            <button key={person.id} type="button" className="entry" onClick={() => navigate(`/feed/${person.id}`)}>
              <div className="frame">
                <Photo image={cover?.image} alt="" />
                <span className="frame-veil" />
                <span className="frame-meta">
                  <strong>{person.name}</strong>
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function latest(moments: { authorId: string; createdAt: string; image: string }[], authorId: string) {
  return moments.filter((moment) => moment.authorId === authorId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
}


