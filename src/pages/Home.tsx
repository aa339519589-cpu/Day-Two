import { useNavigate } from 'react-router-dom'
import { BRAND } from '../brand'
import { dayCount, dayKeyFromIso } from '../logic'
import { useStore } from '../store'
import { Photo, useTitle } from '../ui'
import { Icon, Mark, PersonAvatar } from '../components/Elements'
export function HomePage() {
  const { data, today, acceptIncoming, declineIncoming, invite, cancelInvite, simulateAccept } = useStore()
  const navigate = useNavigate()
  useTitle(BRAND.name)
  const active = data.relations.filter(r => r.status === 'active').sort((a,b) => (a.slot ?? 0) - (b.slot ?? 0))
  const candidates = data.people.filter(p => !active.some(r => r.personId === p.id)).slice(0, 3 - active.length)
  const latest = (id: string) => data.moments.filter(m => m.authorId === id).sort((a,b) => b.createdAt.localeCompare(a.createdAt))[0]
  const mine = latest('me')
  const now = new Date()
  return <section className="home screen">
    <header className="brand-header"><div className="wordmark"><Mark/><span>第二天</span></div><button type="button" className="icon-button publish-button" aria-label="分享日常" onClick={() => navigate('/compose')}><Icon name="plus"/></button></header>
    <div className="home-heading"><h1>朋友<span className="seat-count">{active.length}<i>/ 3</i></span></h1><time>{now.getMonth()+1}月{now.getDate()}日</time></div>
    <div className={`friend-gallery count-${active.length}`}>
      {active.map(rel => {
        const person = data.people.find(p => p.id === rel.personId)
        if (!person) return null
        const cover = latest(person.id)
        const fresh = cover && dayKeyFromIso(cover.createdAt) === today
        return <article key={person.id} className="friend-window">
          <button type="button" className="friend-portrait" aria-label={`看${person.name}的日常`} onClick={() => navigate(`/feed/${person.id}`)}>
            <Photo image={cover?.image} alt={cover?.caption || person.name}/>
            {fresh && <span className="photo-status">今日更新</span>}
            {cover?.caption && <span className="portrait-caption">{cover.caption}</span>}
          </button>
          <div className="friend-caption"><button type="button" className="friend-name" onClick={() => navigate(`/friend/${person.id}`)}><strong>{person.name}</strong><span>认识 {dayCount(rel.since)} 天</span></button><button type="button" className="icon-button" aria-label={`给${person.name}发消息`} onClick={() => navigate(`/chat/${person.id}`)}><Icon name="chat" size={21}/></button></div>
        </article>
      })}
    </div>
    {candidates.map(person => {
      const rel = data.relations.find(r => r.personId === person.id)
      const incoming = rel?.status === 'incoming'
      const outgoing = rel?.status === 'outgoing'
      return <div className="invitation" key={person.id}>
        <button type="button" className="invitation-person" onClick={() => navigate(`/friend/${person.id}`)}><PersonAvatar id={person.id}/><span><strong>{person.name}</strong><small>{incoming ? '想和你成为朋友' : outgoing ? '邀请已发出' : person.city}</small></span></button>
        <div className="invitation-actions">{incoming ? <><button type="button" className="icon-button muted" aria-label={`婉拒${person.name}`} onClick={() => declineIncoming(person.id)}><Icon name="close" size={18}/></button><button type="button" className="small-button" onClick={() => acceptIncoming(person.id)}>接受</button></> : outgoing ? <><button type="button" className="text-button" onClick={() => cancelInvite(person.id)}>撤回</button><button type="button" className="small-button" onClick={() => simulateAccept(person.id)}>模拟同意</button></> : <button type="button" className="small-button" onClick={() => invite(person.id)}>邀请</button>}</div>
      </div>
    })}
    <div className="my-today"><button type="button" className="my-today-preview" onClick={() => navigate('/feed/me')}><span className="today-mini"><Photo image={mine?.image} alt=""/></span><span><strong>我的日常</strong><small>{mine && dayKeyFromIso(mine.createdAt) === today ? '今天已分享' : '今天'}</small></span></button><button className="icon-button" type="button" aria-label="添加日常照片" onClick={() => navigate('/compose')}><Icon name="camera"/></button></div>
  </section>
}
