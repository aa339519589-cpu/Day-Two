import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { dayCount, dayLabel, dayLine, recentDays, streakInfo, todayLine } from '../logic'
import { useStore } from '../store'
import { Photo, useTitle } from '../ui'
import { BackButton, Icon, PersonAvatar, SeatNo, Sheet, SeatMeter } from '../components/Elements'

const WEEK = ['日', '一', '二', '三', '四', '五', '六']

export function FriendPage() {
  const { personId = '' } = useParams()
  const navigate = useNavigate()
  const store = useStore()
  const person = store.data.people.find(p => p.id === personId)
  const relation = store.data.relations.find(r => r.personId === personId)
  const [confirm, setConfirm] = useState<'leave' | 'contract' | null>(null)
  useTitle(`${person?.name || '朋友'} · Day Two`)
  if (!person) return <div className="stack missing"><header className="chat-topbar"><BackButton/></header><div className="empty-state">没有找到这位朋友</div></div>
  const moments = store.data.moments.filter(m => m.authorId === person.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const active = relation?.status === 'active'
  const contract = relation?.contract
  const rows = contract ? recentDays(contract, store.today, 7).reverse() : []
  const streak = contract ? streakInfo(contract, store.today) : null
  const status = relation?.status === 'incoming' ? `${person.pronoun}想成为你的朋友` : relation?.status === 'outgoing' ? '邀请已发出，等待同意' : relation?.status === 'ended' ? '关系已结束' : active ? `认识第 ${dayCount(relation.since)} 天` : '还不是朋友'
  const contractLabel = contract?.status === 'paused' ? '已暂停' : contract?.status === 'active' ? todayLine(contract, person.pronoun, store.today) : contract?.status === 'pending' ? '等待同意' : '未开启'

  return <main className="stack friend-page">
    <div className="friend-cover">
      <Photo image={moments[0]?.image} alt=""/>
      <div className="cover-shade"/>
      <header className="friend-cover-nav"><BackButton/>{active && <button type="button" className="icon-button glass" aria-label="好友选项" onClick={() => setConfirm('leave')}><Icon name="more"/></button>}</header>
      <div className="cover-title">
        {active && <SeatNo slot={relation.slot}/>}
        <h1>{person.name}</h1>
        <p>{status} · {person.city}</p>
      </div>
    </div>

    <div className="friend-detail">
      <div className="friend-intro">
        <PersonAvatar id={personId} size="normal"/>
        <p className="friend-bio">{person.bio}</p>
      </div>
      <div className="profile-interests">{[...person.interests, ...person.languages.map(l => `说${l}`)].map(t => <span key={t}>{t}</span>)}</div>

      {active ? <div className="friend-buttons">
        <button className="pill solid grow" type="button" onClick={() => navigate(`/chat/${personId}`)}><Icon name="chat" size={18}/>发消息</button>
        <button className="pill ghost grow" type="button" onClick={() => navigate(`/feed/${personId}`)}><Icon name="photo" size={18}/>看日常</button>
      </div> : <div className="friend-buttons">{relation?.status === 'incoming' ? <>
        <button className="pill solid grow" type="button" onClick={() => store.acceptIncoming(personId)}>接受邀请</button>
        <button className="pill ghost grow" type="button" onClick={() => { store.declineIncoming(personId); navigate('/home') }}>婉拒</button>
      </> : relation?.status === 'outgoing' ? <>
        <button className="pill solid grow" type="button" onClick={() => store.simulateAccept(personId)}>模拟对方同意</button>
        <button className="pill ghost grow" type="button" onClick={() => store.cancelInvite(personId)}>撤回</button>
      </> : <>
        <button className="pill solid grow" type="button" onClick={() => store.invite(personId)}>邀请</button>
        {relation?.status === 'ended' && <button className="pill ghost grow" type="button" onClick={() => navigate(`/chat/${personId}`)}>聊天记录</button>}
      </>}</div>}

      {!active && <section className="seat-note">
        <SeatMeter used={store.data.relations.filter(r => r.status === 'active').length} pending={0}/>
        <p>{store.data.relations.filter(r => r.status === 'active').length >= 3 ? '三个席位都满了。要留给新的人，需要先结束一段关系。' : `成为朋友会占用一个席位。你还剩 ${3 - store.data.relations.filter(r => r.status === 'active').length} 个，只留给愿意继续聊下去的人。`}</p>
      </section>}

      {active && contract && <section className="daily-contract">
        <div className="section-heading"><h2>每日约定</h2><span className={`chip${contract.status === 'active' ? ' live' : ''}`}>{contractLabel}</span></div>
        {contract.status === 'active' || contract.status === 'paused' ? <>
          <div className="contract-progress"><strong className="num">{streak?.days}</strong><span>天<br/>连续交流</span></div>
          <div className="contract-week">{rows.map(row => {
            const [y, m, d] = row.day.split('-').map(Number)
            const wd = WEEK[new Date(y, m - 1, d).getDay()]
            return <span key={row.day} className={row.self && row.peer ? 'complete' : row.self || row.peer ? 'partial' : ''} title={dayLine(row.self, row.peer, person.pronoun)}>
              <i>{row.self && row.peer ? <Icon name="check" size={15} stroke={2.2}/> : row.self || row.peer ? <b/> : null}</i>
              <small>{row.day === store.today ? '今' : wd}</small>
            </span>
          })}</div>
          <p className="contract-legend">{rows.length ? dayLine(rows[rows.length - 1].self, rows[rows.length - 1].peer, person.pronoun) : ''}{rows.length ? ` · ${dayLabel(rows[rows.length - 1].day, store.today)}` : ''}</p>
          <div className="contract-actions">
            <button className="pill ghost" type="button" onClick={() => contract.status === 'active' ? store.pauseContract(personId) : store.resumeContract(personId)}><Icon name={contract.status === 'active' ? 'pause' : 'play'} size={15}/>{contract.status === 'active' ? '暂停约定' : '恢复约定'}</button>
            <button className="text-button muted" type="button" onClick={() => setConfirm('contract')}>结束约定</button>
          </div>
        </> : contract.status === 'pending' ? <div className="contract-pending">
          <p>邀请已发出。{person.pronoun}同意后，每天你们都在，就会连成一条线。</p>
          <div className="friend-buttons"><button className="pill solid" type="button" onClick={() => store.simulateContract(personId)}>模拟对方同意</button><button className="pill ghost" type="button" onClick={() => store.cancelContract(personId)}>撤回</button></div>
        </div> : <button className="contract-invite" type="button" onClick={() => store.inviteContract(personId)}>
          <span><strong>邀请每天交流</strong><small>每天都说一句，连续的天数会记下来</small></span><Icon name="plus" size={20}/>
        </button>}
      </section>}

      {active && moments.length > 0 && <section className="friend-moments">
        <div className="block-head"><h2 className="section-label">{person.pronoun}的日常</h2><span className="num-muted">{moments.length}</span></div>
        <div className="mini-grid">{moments.slice(0, 6).map(m => <button type="button" key={m.id} onClick={() => navigate(`/feed/${personId}?m=${encodeURIComponent(m.id)}`)} aria-label={m.caption || '日常照片'}><Photo image={m.image} alt=""/></button>)}</div>
      </section>}
    </div>
    {confirm && <Sheet title={confirm === 'leave' ? '结束好友关系？' : '结束每日约定？'} onClose={() => setConfirm(null)}><p className="sheet-note">{confirm === 'leave' ? '席位会空出来。聊天记录保留，每日约定同时结束。' : '好友关系和聊天记录保留。'}</p><button className="settings-row danger-text" type="button" onClick={() => { if (confirm === 'leave') { store.endRelation(personId); navigate('/home') } else store.endContract(personId); setConfirm(null) }}>确认结束</button></Sheet>}
  </main>
}
