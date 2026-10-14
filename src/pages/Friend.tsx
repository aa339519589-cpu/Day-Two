import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BRAND } from '../brand'
import { dayCount, recentDays, streakInfo, todayLine } from '../logic'
import { useStore } from '../store'
import { Avatar, Back, Dialog, Photo, useTitle } from '../ui'

export function FriendPage() {
  const { personId = '' } = useParams()
  const navigate = useNavigate()
  const store = useStore()
  const person = store.data.people.find((item) => item.id === personId)
  const relation = store.data.relations.find((item) => item.personId === personId)
  const [askLeave, setAskLeave] = useState(false)
  const [askEnd, setAskEnd] = useState(false)
  useTitle(person ? `${person.name} · ${BRAND.name}` : BRAND.name)

  if (!person) {
    return (
      <div className="stack page">
        <h1>没有这个人</h1>
        <button type="button" className="btn" onClick={() => navigate('/home')}>
          回首页
        </button>
      </div>
    )
  }

  const cover = [...store.data.moments]
    .filter((moment) => moment.authorId === person.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]

  if (!relation || relation.status === 'incoming' || relation.status === 'outgoing') {
    return (
      <div className="stack">
        <header className="topbar">
          <Back />
          <h1>{person.name}</h1>
        </header>
        <div className="section">
          <Avatar initial={person.initial} tint={person.tint} large />
          <p className="lede">{person.bio}</p>
          <p className="meta-line">
            {person.city} · {person.languages.join('、')}
          </p>
          <div className="stack-btns" style={{ marginTop: 18 }}>
            {relation?.status === 'incoming' && (
              <>
                <button type="button" className="btn" onClick={() => store.acceptIncoming(person.id)}>
                  接受
                </button>
                <button type="button" className="btn ghost" onClick={() => store.declineIncoming(person.id)}>
                  婉拒
                </button>
              </>
            )}
            {relation?.status === 'outgoing' && (
              <>
                <button type="button" className="btn" onClick={() => store.simulateAccept(person.id)}>
                  对方同意
                </button>
                <button type="button" className="btn ghost" onClick={() => store.cancelInvite(person.id)}>
                  撤回
                </button>
              </>
            )}
            {!relation && (
              <button type="button" className="btn" onClick={() => store.invite(person.id)}>
                邀请
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (relation.status === 'ended') {
    return (
      <div className="stack page">
        <Back />
        <h1 style={{ marginTop: 12 }}>{person.name}</h1>
        <p className="lede">已结束</p>
        <div className="stack-btns" style={{ marginTop: 18 }}>
          <button type="button" className="btn" onClick={() => navigate(`/chat/${person.id}`)}>
            聊天记录
          </button>
          <button type="button" className="btn ghost" onClick={() => store.invite(person.id)}>
            再邀请
          </button>
        </div>
      </div>
    )
  }

  const contract = relation.contract
  const streak = streakInfo(contract, store.today)
  const rows = recentDays(contract, store.today)

  return (
    <div className="stack">
      <div className="cover">
        <Photo image={cover?.image} alt="" />
        <span className="cover-veil" />
        <span className="back-float">
          <Back light />
        </span>
        <div className="cover-copy">
          <Avatar initial={person.initial} tint={person.tint} large />
          <div>
            <h1>{person.name}</h1>
            <p>
              第 {dayCount(relation.since)} 天 · {person.city}
            </p>
          </div>
        </div>
      </div>
      <section className="section">
        <p className="prose">{person.bio}</p>
        <p className="meta-line">
          {person.languages.join('、')} · {person.interests.join('、')}
        </p>
      </section>
      <div className="actions">
        <button type="button" className="btn" onClick={() => navigate(`/feed/${person.id}`)}>
          看日常
        </button>
        <button type="button" className="btn ghost" onClick={() => navigate(`/chat/${person.id}`)}>
          发消息
        </button>
      </div>
      <section className="contract">
        {(contract.status === 'off' || contract.status === 'ended') && (
          <button type="button" className="btn ghost" onClick={() => store.inviteContract(person.id)}>
            {contract.status === 'ended' ? '再开每日交流' : '开启每日交流'}
          </button>
        )}
        {contract.status === 'pending' && (
          <div className="row">
            <button type="button" className="btn" onClick={() => store.simulateContract(person.id)}>
              对方同意
            </button>
            <button type="button" className="btn ghost" onClick={() => store.cancelContract(person.id)}>
              撤回
            </button>
          </div>
        )}
        {(contract.status === 'active' || contract.status === 'paused') && (
          <>
            <p className="streak">连续 {streak.days} 天</p>
            <p className="fine">{contract.status === 'paused' ? '已暂停' : todayLine(contract, person.pronoun, store.today)}</p>
            {rows.length > 0 && (
              <ol className="marks">
                {[...rows].reverse().map((row) => (
                  <li key={row.day} className={row.self && row.peer ? 'full' : row.self || row.peer ? 'half' : undefined} />
                ))}
              </ol>
            )}
            <div className="quiet-actions">
              {contract.status === 'active' ? (
                <button type="button" className="btn text" onClick={() => store.pauseContract(person.id)}>
                  暂停
                </button>
              ) : (
                <button type="button" className="btn text" onClick={() => store.resumeContract(person.id)}>
                  恢复
                </button>
              )}
              <button type="button" className="btn text" onClick={() => setAskEnd(true)}>
                结束约定
              </button>
            </div>
          </>
        )}
      </section>
      <div className="leave">
        <button type="button" className="btn text" onClick={() => setAskLeave(true)}>
          退出
        </button>
      </div>
      {askLeave && (
        <Dialog
          title="退出"
          body="席位会空出来。聊天还留着。"
          confirm="退出"
          danger
          onClose={() => setAskLeave(false)}
          onConfirm={() => {
            store.endRelation(person.id)
            setAskLeave(false)
            navigate('/home')
          }}
        />
      )}
      {askEnd && (
        <Dialog
          title="结束约定"
          body="人还在。聊天和照片都还在。"
          confirm="结束约定"
          danger
          onClose={() => setAskEnd(false)}
          onConfirm={() => {
            store.endContract(person.id)
            setAskEnd(false)
          }}
        />
      )}
    </div>
  )
}
