import { useNavigate } from 'react-router-dom'
import { BRAND } from '../brand'
import { formatWhen } from '../logic'
import { useStore } from '../store'
import { useTitle } from '../ui'
import { Icon, PersonAvatar } from '../components/Elements'
export function MessagesPage() {
  const { data } = useStore()
  const navigate = useNavigate()
  useTitle(`消息 · ${BRAND.name}`)
  const ids = new Set([...data.relations.filter(r => r.status === 'active' || r.status === 'ended').map(r => r.personId), ...data.messages.map(m => m.personId)])
  const rows = [...ids].map(id => ({id, person:data.people.find(p => p.id === id), relation:data.relations.find(r => r.personId === id), last:data.messages.filter(m => m.personId === id).sort((a,b) => b.createdAt.localeCompare(a.createdAt))[0]})).filter(r => r.person).sort((a,b) => (b.last?.createdAt || b.relation?.since || '').localeCompare(a.last?.createdAt || a.relation?.since || ''))
  return <section className="screen messages-screen"><header className="page-header"><h1>消息</h1><Icon name="chat" size={25}/></header>
    <div className="threads">{rows.map(({id,person,last,relation}) => <button type="button" className={`thread${relation?.status === 'ended' ? ' is-ended' : ''}`} key={id} onClick={() => navigate(`/chat/${id}`)}><PersonAvatar id={id}/><span className="thread-body"><span className="thread-top"><strong>{person!.name}</strong>{last && <time>{formatWhen(last.createdAt).replace('今天 ', '')}</time>}</span><span className="thread-excerpt">{last ? `${last.from === 'me' ? '我：' : ''}${last.text || '[照片]'}` : '还没有消息'}</span></span></button>)}</div>
    {!rows.length && <div className="empty-state"><p>还没有消息</p><button type="button" className="small-button" onClick={() => navigate('/home')}>去认识朋友</button></div>}
  </section>
}
