import { useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { BRAND } from '../brand'
import { dayCount, dayKeyFromIso, dayLabel, streakInfo } from '../logic'
import { latestMoment, partOfDay } from '../pulse'
import { useStore } from '../store'
import { FitViewport, LockScroll, Photo, useTitle } from '../ui'
import { BackButton, Icon, PersonAvatar, Sheet } from '../components/Elements'

const hm = (iso: string) => { const d = new Date(iso); return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}` }

export function ChatPage() {
  const { personId = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { data, today, sendText, sendImage, deleteThread } = useStore()
  const person = data.people.find((item) => item.id === personId)
  const relation = data.relations.find((item) => item.personId === personId)
  const messages = data.messages.filter((item) => item.personId === personId)
  const momentId = params.get('moment') ?? undefined
  const moment = data.moments.find((item) => item.id === momentId && item.authorId === personId)
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [askDelete, setAskDelete] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  useTitle(person ? `${person.name} · ${BRAND.name}` : BRAND.name)

  useLayoutEffect(() => {
    const node = logRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [messages.length, moment?.id])

  if (!person) {
    return <div className="stack page missing"><h1>没有这个对话</h1><button type="button" className="pill solid" onClick={() => navigate('/messages')}>回消息列表</button></div>
  }

  const active = relation?.status === 'active'
  const canSend = active
  const contract = relation?.contract
  const streak = contract && (contract.status === 'active' || contract.status === 'paused') ? streakInfo(contract, today).days : null
  const subtitle = relation?.status === 'active'
    ? `认识第 ${dayCount(relation.since)} 天${streak ? ` · 连续交流 ${streak} 天` : ''}${contract?.status === 'paused' ? ' · 约定暂停' : ''}`
    : relation?.status === 'ended' ? '关系已结束' : person.city
  const latest = latestMoment(data, person.id)

  const submit = () => {
    if (!canSend || !text.trim()) return
    sendText(personId, text, moment?.id)
    setText('')
    if (moment) setParams({}, { replace: true })
  }

  return (
    <FitViewport>
      <LockScroll />
      <header className="chat-topbar">
        <BackButton to="/messages" />
        <button type="button" className="chat-peer-head" onClick={() => navigate(`/friend/${person.id}`)}>
          <PersonAvatar id={person.id} size="small" />
          <span className="chat-peer-meta"><h1>{person.name}</h1><p>{subtitle}</p></span>
        </button>
        {active ? <button type="button" className="icon-button" aria-label={`看${person.name}的日常`} onClick={() => navigate(`/feed/${person.id}`)}><Icon name="photo" size={21}/></button> : null}
        {messages.length > 0 && <button type="button" className="icon-button" aria-label="聊天选项" onClick={() => setAskDelete(true)}><Icon name="more"/></button>}
      </header>

      <div className="chat-log" ref={logRef}>
        <div className="chat-log-inner">
          {messages.length === 0 ? (
            <div className="chat-empty-note">
              <PersonAvatar id={person.id} size="large" />
              <p className="chat-empty-title">{person.name}</p>
              <p className="chat-empty-meta">{[person.city, subtitle !== person.city ? subtitle : ''].filter(Boolean).join(' · ')}</p>
              {person.bio && <p className="chat-empty-sub">{person.bio}</p>}
              <button type="button" className="pill ghost chat-empty-profile" onClick={() => navigate(`/friend/${person.id}`)}>查看资料</button>
              {latest && canSend && !moment && <button type="button" className="chat-starter" onClick={() => setParams({ moment: latest.id }, { replace: true })}>
                <Photo image={latest.image} alt="" />
                <span><small>从{person.pronoun}{partOfDay(latest.createdAt)}的照片开始</small><strong>{latest.caption || '一张日常'}</strong></span>
                <Icon name="reply" size={18}/>
              </button>}
            </div>
          ) : (
            messages.map((message, index) => {
              const previous = messages[index - 1]
              const nextMsg = messages[index + 1]
              const day = dayKeyFromIso(message.createdAt)
              const newDay = !previous || dayKeyFromIso(previous.createdAt) !== day
              const gap = !newDay && new Date(message.createdAt).getTime() - new Date(previous.createdAt).getTime() > 15 * 60 * 1000
              const sameAsPrev = !newDay && !gap && previous?.from === message.from
              const sameAsNext = nextMsg && nextMsg.from === message.from && dayKeyFromIso(nextMsg.createdAt) === day &&
                new Date(nextMsg.createdAt).getTime() - new Date(message.createdAt).getTime() <= 15 * 60 * 1000
              const quoted = message.momentId ? data.moments.find((item) => item.id === message.momentId) : undefined
              const quoteAuthor = quoted?.authorId === 'me' ? '你' : quoted ? person.name : ''
              return (
                <div key={message.id} className={`msg-row ${message.from === 'me' ? 'me' : 'them'}${sameAsPrev ? ' tight' : ''}`}>
                  {newDay && <div className="day-rule"><span>{dayLabel(day, today)}</span></div>}
                  {(gap || newDay) && <div className="when"><span>{hm(message.createdAt)}</span></div>}
                  <div className="msg-line">
                  {message.from !== 'me' && <span className="msg-avatar">{!sameAsNext && <PersonAvatar id={person.id} size="tiny" />}</span>}
                  <article className={`bubble ${message.from === 'me' ? 'me' : 'them'}${sameAsNext ? ' has-next' : ''}${quoted ? ' has-quote' : ''}${message.image && !message.text ? ' only-image' : ''}`}>
                    {quoted && (
                      <button type="button" className="quote" onClick={() => active ? navigate(`/feed/${quoted.authorId === 'me' ? 'me' : personId}?m=${quoted.id}`) : setLightbox(quoted.image)}>
                        <Photo image={quoted.image} alt="" />
                        <span className="quote-copy"><small>{quoteAuthor}的日常</small><span>{quoted.caption || '一张日常照片'}</span></span>
                      </button>
                    )}
                    {message.image && <Photo className="shot" image={message.image} alt="聊天照片" onClick={() => setLightbox(message.image!)} />}
                    {message.text && <p>{message.text}</p>}
                  </article>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {moment && canSend && (
        <div className="draft">
          <Photo image={moment.image} alt="" />
          <div className="draft-copy"><small>回应{person.name}的日常</small><p>{moment.caption || '日常照片'}</p></div>
          <button type="button" className="icon-button draft-close" aria-label="取消回应" onClick={() => setParams({}, { replace: true })}><Icon name="close" size={17}/></button>
        </div>
      )}

      {error && <p className="error" role="alert">{error}</p>}

      {canSend ? (
        <form className="composer" onSubmit={(event) => { event.preventDefault(); submit(); inputRef.current?.focus() }}>
          <label className="icon-button file-hit composer-media" aria-label="发送照片">
            <Icon name="image" size={22}/>
            <input type="file" accept="image/*" disabled={busy} onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              if (!file) return
              setBusy(true)
              setError('')
              sendImage(personId, file)
                .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : '照片没有发出去。'))
                .finally(() => setBusy(false))
            }} />
          </label>
          <div className="composer-field">
            <input ref={inputRef} type="text" value={text} maxLength={500} enterKeyHint="send" placeholder={moment ? `说说这张…` : `写给${person.name}…`} aria-label="消息"
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter' && (event.nativeEvent.isComposing || event.keyCode === 229)) event.preventDefault() }} />
            <button className="send" type="submit" aria-label="发送" disabled={!text.trim() || busy}><Icon name="send" size={19} stroke={2.2}/></button>
          </div>
        </form>
      ) : (
        <div className="ended-bar">
          <span>{relation?.status === 'ended' ? '你们已经结束关系，聊天记录保留在这里' : '成为朋友后才能发消息'}</span>
          <div className="ended-bar-actions">
            <Link to={relation?.status === 'ended' ? `/friend/${personId}` : '/home'} className="pill solid">{relation?.status === 'ended' ? '查看资料' : '返回朋友'}</Link>
            {messages.length > 0 && <button type="button" className="pill ghost" onClick={() => setAskDelete(true)}>删除记录</button>}
          </div>
        </div>
      )}

      {askDelete && <Sheet title="聊天记录" onClose={() => setAskDelete(false)}><p className="sheet-note">删除后无法恢复。好友关系不受影响。</p><button type="button" className="settings-row danger-text" onClick={() => { deleteThread(personId); setAskDelete(false) }}>删除全部聊天记录</button></Sheet>}
      {lightbox && <button type="button" className="lightbox" onClick={() => setLightbox(null)} aria-label="关闭照片"><Photo image={lightbox} alt="放大查看" /></button>}
    </FitViewport>
  )
}
