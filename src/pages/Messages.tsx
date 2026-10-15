import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BRAND } from '../brand'
import { dayCount } from '../logic'
import { activePulses, lastMessage, partOfDay, whenShort } from '../pulse'
import { useStore } from '../store'
import { Photo, useTitle } from '../ui'
import { Icon, PersonAvatar, SeatNo } from '../components/Elements'

export function MessagesPage() {
  const { data, today } = useStore()
  const navigate = useNavigate()
  useTitle(`消息 · ${BRAND.name}`)
  const pulses = activePulses(data, today)
  const openers = pulses.filter(p => p.opener)
  const ids = new Set([...data.relations.filter(r => r.status === 'active' || r.status === 'ended').map(r => r.personId), ...data.messages.map(m => m.personId)])
  const rows = [...ids].map(id => ({ id, person: data.people.find(p => p.id === id), relation: data.relations.find(r => r.personId === id), last: lastMessage(data, id), pulse: pulses.find(p => p.person.id === id) }))
    .filter(r => r.person)
    .sort((a, b) => {
      const ea = a.relation?.status === 'ended' ? 1 : 0, eb = b.relation?.status === 'ended' ? 1 : 0
      if (ea !== eb) return ea - eb
      return (b.last?.createdAt || b.relation?.since || '').localeCompare(a.last?.createdAt || a.relation?.since || '')
    })
  const waiting = pulses.filter(p => p.waiting).length
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const shown = q ? rows.filter(r => r.person!.name.toLowerCase().includes(q)) : rows

  return <section className="screen messages-screen">
    <header className="dm-head">
      <div className="dm-title"><h1>消息</h1>{waiting > 0 && <span className="dm-count" aria-label={`${waiting} 个对话在等你回`}>{waiting}</span>}</div>
      {rows.length > 0 && <label className="dm-search"><Icon name="search" size={17}/><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="搜索对话" aria-label="搜索对话"/></label>}
    </header>

    {openers.length > 0 && !q && <section className="openers" aria-label="从照片开始">
      <h2 className="section-label">从照片开始</h2>
      <div className="opener-row">{openers.map(p => <button type="button" className="opener" key={p.person.id} onClick={() => navigate(`/chat/${p.person.id}?moment=${encodeURIComponent(p.opener!.id)}`)}>
        <Photo image={p.opener!.image} alt=""/>
        <span className="opener-copy"><strong>{p.person.name}</strong><small>{partOfDay(p.opener!.createdAt)} · {p.opener!.caption || '一张日常'}</small></span>
        <span className="opener-go" aria-hidden="true"><Icon name="reply" size={16}/></span>
      </button>)}</div>
    </section>}

    {rows.length > 0 && <h2 className="section-label dm-label">对话</h2>}
    <div className="threads">{shown.map(({ id, person, last, relation, pulse }) => {
      const ended = relation?.status === 'ended'
      const meta = ended ? '已结束' : relation?.status === 'active' ? `第 ${dayCount(relation.since)} 天` : ''
      return <button type="button" className={`thread${ended ? ' is-ended' : ''}${pulse?.waiting ? ' is-waiting' : ''}`} key={id} onClick={() => navigate(`/chat/${id}`)}>
        <PersonAvatar id={id} ring={!!pulse?.waiting}/>
        <span className="thread-body">
          <span className="thread-top"><strong>{person!.name}</strong>{relation?.status === 'active' && <SeatNo slot={relation.slot}/>}<em>{meta}</em>{last && <time>{whenShort(last.createdAt, today)}</time>}</span>
          <span className="thread-excerpt">{last ? <>{last.from === 'me' && <span className="you">你：</span>}{last.momentId && <span className="quote-tag">回应照片</span>}{last.text || '[照片]'}</> : '还没有消息'}</span>
        </span>
        {pulse?.waiting ? <span className="thread-dot" aria-label="等你回复"/> : pulse?.opener ? <span className="thread-thumb"><Photo image={pulse.opener.image} alt=""/></span> : null}
      </button>
    })}</div>
    {q && !shown.length && <p className="dm-none">没有找到“{query.trim()}”</p>}
    {!rows.length && <div className="empty-state"><p>还没有消息</p><button type="button" className="pill solid" onClick={() => navigate('/home')}>去认识朋友</button></div>}
  </section>
}
