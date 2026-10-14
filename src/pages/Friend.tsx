import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BRAND } from '../brand'
import { dayCount, dayLabel, dayLine, recentDays, streakInfo, todayLine } from '../logic'
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
        <button type="button" className="btn" style={{ marginTop: 20 }} onClick={() => navigate('/home')}>
          回席位
        </button>
      </div>
    )
  }

  const personMoments = [...store.data.moments]
    .filter((moment) => moment.authorId === person.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const cover = personMoments[0]

  if (!relation || relation.status === 'incoming' || relation.status === 'outgoing' || relation.status === 'ended') {
    const statusLabel =
      relation?.status === 'incoming'
        ? '来信邀请 · 待你回应'
        : relation?.status === 'outgoing'
          ? '已发出邀请 · 等待对方确认'
          : relation?.status === 'ended'
            ? '过往关系 · 已退出席位'
            : '候选席位'

    return (
      <div className="stack friend-screen">
        <header className="topbar">
          <Back />
          <div className="grow">
            <span className="eyebrow" style={{ margin: 0 }}>{statusLabel}</span>
          </div>
        </header>

        <div className="dossier-card">
          <div className="dossier-head">
            <Avatar initial={person.initial} tint={person.tint} large />
            <div className="dossier-title">
              <h1>{person.name}</h1>
              <p className="dossier-meta">
                {person.city} · {person.languages.join(' / ')}
              </p>
            </div>
          </div>

          <p className="dossier-bio">{person.bio}</p>

          {person.interests.length > 0 && (
            <div className="interest-inline">
              {person.interests.map((item) => (
                <span key={item} className="tag-chip">
                  {item}
                </span>
              ))}
            </div>
          )}

          {cover && (
            <div className="dossier-sample">
              <Photo image={cover.image} alt="" />
              {cover.caption && <p className="sample-caption">“{cover.caption}”</p>}
            </div>
          )}

          <div className="stack-btns" style={{ marginTop: 24 }}>
            {relation?.status === 'incoming' && (
              <>
                <button type="button" className="btn" onClick={() => store.acceptIncoming(person.id)}>
                  接受席位
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
                  撤回邀请
                </button>
              </>
            )}
            {relation?.status === 'ended' && (
              <>
                <button type="button" className="btn" onClick={() => navigate(`/chat/${person.id}`)}>
                  聊天记录
                </button>
                <button type="button" className="btn ghost" onClick={() => store.invite(person.id)}>
                  再邀请
                </button>
              </>
            )}
            {!relation && (
              <button type="button" className="btn" onClick={() => store.invite(person.id)}>
                邀请入席
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const contract = relation.contract
  const rows = recentDays(contract, store.today)
  const streak = streakInfo(contract, store.today)
  const totalDays = dayCount(relation.since)

  return (
    <div className="stack friend-screen">
      <div className="cover">
        <Photo image={cover?.image} alt="" />
        <span className="cover-veil" />
        <span className="back-float">
          <Back light />
        </span>
        <div className="cover-copy">
          <Avatar initial={person.initial} tint={person.tint} large />
          <div className="cover-text">
            <span className="cover-kicker">
              已经一起走到第 {totalDays} 天
            </span>
            <h1>{person.name}</h1>
            <p>
              {person.city} · {person.languages.join(' / ')}
            </p>
          </div>
        </div>
      </div>

      <section className="friend-bio-section">
        <p className="friend-bio">{person.bio}</p>
        {person.interests.length > 0 && (
          <div className="interest-inline">
            {person.interests.map((item) => (
              <span key={item} className="tag-chip">
                {item}
              </span>
            ))}
          </div>
        )}
      </section>

      <div className="actions">
        <button type="button" className="btn" onClick={() => navigate(`/feed/${person.id}`)}>
          看日常 ({personMoments.length})
        </button>
        <button type="button" className="btn ghost" onClick={() => navigate(`/chat/${person.id}`)}>
          发消息
        </button>
      </div>

      <section className="contract">
        <div className="contract-head">
          <div>
            <h2>每日约定</h2>
          </div>
          {(contract.status === 'active' || contract.status === 'paused') && (
            <span className="contract-badge">
              {contract.status === 'paused' ? '已暂停' : todayLine(contract, person.pronoun, store.today)}
            </span>
          )}
        </div>

        {(contract.status === 'off' || contract.status === 'ended') && (
          <div className="contract-card">
            <p className="fine">
              每天各自留下一张照片或一句话。没有打卡排名，只确认彼此今天还在。
            </p>
            <button
              type="button"
              className="btn ghost"
              style={{ marginTop: 14 }}
              onClick={() => store.inviteContract(person.id)}
            >
              {contract.status === 'ended' ? '再开每日交流' : '开启每日交流'}
            </button>
          </div>
        )}

        {contract.status === 'pending' && (
          <div className="contract-card">
            <p className="fine">已向 {person.name} 发出每日约定邀请，等待对方回应。</p>
            <div className="row" style={{ marginTop: 14 }}>
              <button type="button" className="btn" onClick={() => store.simulateContract(person.id)}>
                对方同意
              </button>
              <button type="button" className="btn ghost" onClick={() => store.cancelContract(person.id)}>
                撤回
              </button>
            </div>
          </div>
        )}

        {(contract.status === 'active' || contract.status === 'paused') && (
          <div className="contract-card">
            <div className="streak-summary">
              <div className="streak-num">
                <strong>{streak.days}</strong>
                <span>天连续同在</span>
              </div>
              <ol className="marks" aria-label="近期留痕记录">
                {[...rows].reverse().map((row) => (
                  <li
                    key={row.day}
                    title={`${dayLabel(row.day, store.today)}：${dayLine(row.self, row.peer, person.pronoun)}`}
                    className={
                      row.self && row.peer ? 'full' : row.self || row.peer ? 'half' : undefined
                    }
                  />
                ))}
              </ol>
            </div>

            {rows.length > 0 && (
              <ul className="days">
                {rows.slice(0, 5).map((row) => (
                  <li key={row.day}>
                    <strong>{dayLabel(row.day, store.today)}</strong>
                    <span>{dayLine(row.self, row.peer, person.pronoun)}</span>
                  </li>
                ))}
              </ul>
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
          </div>
        )}
      </section>

      <div className="leave">
        <button type="button" className="btn text danger-text" onClick={() => setAskLeave(true)}>
          退出这段席位关系
        </button>
      </div>

      {askLeave && (
        <Dialog
          title="退出席位"
          body={`退出后，${person.name} 将不再占据你的三个席位之一，当前的每日约定也会一并结束。`}
          confirm="确认退出"
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
          title="结束每日约定"
          body="结束后将不再记录双方每日留痕，但你们仍保留席位关系。"
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
