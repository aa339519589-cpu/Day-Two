import { useNavigate } from 'react-router-dom'
import { BRAND } from '../brand'
import { dayKeyFromIso } from '../logic'
import { activePulses, latestMoment, type Pulse } from '../pulse'
import { useStore } from '../store'
import { Photo, useTitle } from '../ui'
import { Icon, PersonAvatar, SeatMeter, Wordmark } from '../components/Elements'

function SeatCard({ pulse, today }: { pulse: Pulse; today: string }) {
  const navigate = useNavigate()
  const { person, relation, latest, opener, tone, line, days, streak } = pulse
  const fresh = latest && dayKeyFromIso(latest.createdAt) === today
  const toChat = () => navigate(opener && !pulse.waiting ? `/chat/${person.id}?moment=${encodeURIComponent(opener.id)}` : `/chat/${person.id}`)
  const action = pulse.waiting ? '回复' : opener ? '回应这张' : '聊聊'
  return <article className={`friend-window post tone-${tone}`}>
    <header className="post-head">
      <button type="button" className="post-who" onClick={() => navigate(`/friend/${person.id}`)}>
        <PersonAvatar id={person.id} size="small" ring={pulse.waiting || !!opener}/>
        <span className="post-who-text"><strong>{person.name}</strong><small>席位 {['一', '二', '三'][relation.slot ?? 0]} · 认识 {days} 天{streak ? ` · 连续 ${streak} 天` : ''}</small></span>
      </button>
      {fresh && <span className="post-new">今日</span>}
    </header>
    {latest ? <button type="button" className="seat-photo" aria-label={`看${person.name}的日常`} onClick={() => navigate(`/feed/${person.id}`)}>
      <Photo image={latest.image} alt={latest.caption || person.name}/>
    </button> : <div className="seat-photo is-empty"><Icon name="photo" size={28}/><span>{person.name}还没有分享日常</span></div>}
    <div className="post-bar">
      <button type="button" className={`post-cta${pulse.waiting || opener ? ' hot' : ''}`} aria-label={`${action}：${person.name}`} onClick={toChat}>
        <Icon name={opener && !pulse.waiting ? 'reply' : 'chat'} size={20}/>{action}
      </button>
      <span className="post-status"><i aria-hidden="true"/>{line}</span>
    </div>
    {latest?.caption && <p className="post-caption"><b>{person.name}</b>{latest.caption}</p>}
  </article>
}

export function HomePage() {
  const { data, today, acceptIncoming, declineIncoming, invite, cancelInvite, simulateAccept } = useStore()
  const navigate = useNavigate()
  useTitle(BRAND.name)
  const pulses = activePulses(data, today)
  const active = pulses.length
  const candidates = data.people.filter(p => !data.relations.some(r => r.personId === p.id && r.status === 'active')).slice(0, 3 - active)
  const empty = Array.from({ length: 3 - active }, (_, i) => candidates[i] ?? null)
  const mine = latestMoment(data, 'me')
  const sharedToday = !!mine && dayKeyFromIso(mine.createdAt) === today
  const waiting = pulses.filter(p => p.waiting).length

  return <section className="home screen">
    <header className="app-top home-top"><Wordmark/><span className="top-actions">
      <button type="button" className="icon-button" aria-label="分享日常" onClick={() => navigate('/compose')}><Icon name="plus"/></button>
      <button type="button" className="icon-button" aria-label="打开消息" onClick={() => navigate('/messages')}><Icon name="chat"/>{waiting > 0 && <i className="dot-badge" aria-hidden="true">{waiting}</i>}</button>
    </span></header>

    <div className="story-row" aria-label="三个席位">
      <button type="button" className="story" aria-label="添加日常照片" onClick={() => navigate(sharedToday ? '/feed/me' : '/compose')}>
        <span className={`story-ring${sharedToday ? ' seen' : ' mine'}`}><PersonAvatar id="me" size="normal"/>{!sharedToday && <i className="story-plus"><Icon name="plus" size={12} stroke={2.6}/></i>}</span>
        <small>{sharedToday ? '我的日常' : '拍一张'}</small>
      </button>
      {pulses.map(p => <button type="button" className="story" key={p.person.id} onClick={() => navigate(`/feed/${p.person.id}`)} aria-label={`${p.person.name}的日常`}>
        <span className={`story-ring${p.latest && dayKeyFromIso(p.latest.createdAt) === today ? '' : ' seen'}`}><PersonAvatar id={p.person.id} size="normal"/></span>
        <small>{p.person.name}</small>
      </button>)}
      {Array.from({ length: 3 - active }, (_, i) => <span className="story empty" key={`s${i}`}><span className="story-ring empty"><Icon name="plus" size={20}/></span><small>空席位</small></span>)}
      <span className="story-meta"><SeatMeter used={active} pending={0}/><small>{active}/3 席</small></span>
    </div>

    <div className={`friend-gallery count-${active}`}>
      {pulses.map(p => <SeatCard key={p.person.id} pulse={p} today={today}/>)}
    </div>

    {empty.some(Boolean) && <section className="requests">
      <h2 className="section-label">{data.relations.some(r => r.status === 'incoming') ? '好友请求' : '可以邀请'}</h2>
      {empty.map((person, i) => {
        if (!person) return null
        const rel = data.relations.find(r => r.personId === person.id)
        const incoming = rel?.status === 'incoming'
        const outgoing = rel?.status === 'outgoing'
        return <div className={`empty-seat invitation${incoming ? ' is-incoming' : ''}`} key={person.id}>
          <button type="button" className="invitation-person" onClick={() => navigate(`/friend/${person.id}`)}>
            <PersonAvatar id={person.id}/>
            <span><strong>{person.name}</strong><small>{incoming ? `想成为你的第 ${active + i + 1} 位朋友` : outgoing ? '邀请已发出' : person.bio}</small></span>
          </button>
          <div className="invitation-actions">{incoming ? <>
            <button type="button" className="pill solid" onClick={() => acceptIncoming(person.id)}>接受</button>
            <button type="button" className="pill" aria-label={`婉拒${person.name}`} onClick={() => declineIncoming(person.id)}>婉拒</button>
          </> : outgoing ? <>
            <button type="button" className="pill solid" onClick={() => simulateAccept(person.id)}>模拟同意</button>
            <button type="button" className="pill" onClick={() => cancelInvite(person.id)}>撤回</button>
          </> : <button type="button" className="pill solid" onClick={() => invite(person.id)}>邀请</button>}</div>
        </div>
      })}
    </section>}
    {active === 0 && <p className="home-empty">三个席位都空着。接受一个请求，或邀请一个想继续聊下去的人。</p>}
  </section>
}
