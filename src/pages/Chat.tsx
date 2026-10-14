import { useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { BRAND } from '../brand'
import { dayCount, formatWhen } from '../logic'
import { useStore } from '../store'
import { FitViewport, IconClose, IconImage, LockScroll, Photo, useTitle } from '../ui'
import { BackButton, Icon, PersonAvatar, Sheet } from '../components/Elements'

export function ChatPage() {
  const { personId = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { data, sendText, sendImage, deleteThread } = useStore()
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
  useTitle(person ? `${person.name} · ${BRAND.name}` : BRAND.name)

  useLayoutEffect(() => {
    const node = logRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [messages.length, moment?.id])

  if (!person) {
    return (
      <div className="stack page">
        <h1>没有这个对话</h1>
        <button type="button" className="btn" style={{ marginTop: 20 }} onClick={() => navigate('/messages')}>
          回消息列表
        </button>
      </div>
    )
  }

  const active = relation?.status === 'active'
  const canSend = active
  const subtitle =
    relation?.status === 'active'
      ? `认识 ${dayCount(relation.since)} 天`
      : relation?.status === 'ended'
        ? '已结束'
        : person.city

  const submit = () => {
    if (!canSend || !text.trim()) return
    sendText(personId, text, moment?.id)
    setText('')
    if (moment) setParams({}, { replace: true })
  }

  return (
    <FitViewport>
      <LockScroll />
      <header className="topbar chat-topbar">
        <BackButton to="/messages" />
        <button
          type="button"
          className="chat-peer-head"
          onClick={() => navigate(`/friend/${person.id}`)}
        >
          <PersonAvatar id={person.id} size="small" />
          <div className="chat-peer-meta">
            <h1>{person.name}</h1>
            <p>{subtitle}</p>
          </div>
        </button>
        {messages.length > 0 && (
          <button type="button" className="icon-button" aria-label="聊天选项" onClick={() => setAskDelete(true)}><Icon name="more"/></button>
        )}
      </header>

      <div className="chat-log" ref={logRef}>
        <div className="chat-log-inner">
          {messages.length === 0 ? (
            <div className="chat-empty-note">
              <p className="serif">与 {person.name} 的对话</p>
              
            </div>
          ) : (
            messages.map((message, index) => {
              const previous = messages[index - 1]
              const nextMsg = messages[index + 1]
              const gap =
                !previous ||
                new Date(message.createdAt).getTime() - new Date(previous.createdAt).getTime() > 15 * 60 * 1000
              const sameAsPrev = !gap && previous?.from === message.from
              const sameAsNext =
                nextMsg &&
                nextMsg.from === message.from &&
                new Date(nextMsg.createdAt).getTime() - new Date(message.createdAt).getTime() <= 15 * 60 * 1000
              const quoted = message.momentId
                ? data.moments.find((item) => item.id === message.momentId)
                : undefined

              return (
                <div
                  key={message.id}
                  className={`msg-row ${message.from === 'me' ? 'me' : 'them'}${sameAsPrev ? ' tight' : ''}`}
                >
                  {gap && (
                    <div className="when">
                      <span>{formatWhen(message.createdAt)}</span>
                    </div>
                  )}
                  <article
                    className={`bubble ${message.from === 'me' ? 'me' : 'them'}${sameAsNext ? ' has-next' : ''}`}
                  >
                    {quoted && (
                      <button
                        type="button"
                        className="quote"
                        onClick={() =>
                          active ? navigate(`/feed/${personId}?m=${quoted.id}`) : setLightbox(quoted.image)
                        }
                      >
                        <Photo image={quoted.image} alt="" />
                        <span className="quote-copy">
                          <small>回应日常</small>
                          <span>{quoted.caption || '一张日常照片'}</span>
                        </span>
                      </button>
                    )}
                    {message.image && (
                      <Photo
                        className="shot"
                        image={message.image}
                        alt="聊天照片"
                        onClick={() => setLightbox(message.image!)}
                      />
                    )}
                    {message.text && <p>{message.text}</p>}
                  </article>
                </div>
              )
            })
          )}
        </div>
      </div>

      {moment && canSend && (
        <div className="draft">
          <Photo image={moment.image} alt="" />
          <div className="draft-copy">
            <small>回应 {person.name} 的日常</small>
            <p>{moment.caption || '日常照片'}</p>
          </div>
          <button
            type="button"
            className="icon-btn draft-close"
            aria-label="取消回应"
            onClick={() => setParams({}, { replace: true })}
          >
            <IconClose />
          </button>
        </div>
      )}

      {error && <p className="error" role="alert">{error}</p>}

      {canSend ? (
        <form
          className="composer"
          onSubmit={(event) => {
            event.preventDefault()
            submit()
          }}
        >
          <label className="icon-button file-hit composer-media" aria-label="发送照片">
            <IconImage />
            <input
              type="file"
              accept="image/*"
              disabled={busy}
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                if (!file) return
                setBusy(true)
                setError('')
                sendImage(personId, file)
                  .catch((reason: unknown) =>
                    setError(reason instanceof Error ? reason.message : '照片没有发出去。'),
                  )
                  .finally(() => setBusy(false))
              }}
            />
          </label>
          <input
            type="text"
            value={text}
            maxLength={500}
            placeholder="消息…"
            aria-label="消息"
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter' && (event.nativeEvent.isComposing || event.keyCode === 229)) event.preventDefault() }}
          />
          <button className="send" type="submit" aria-label="发送" disabled={!text.trim() || busy}><Icon name="arrow" size={20}/></button>
        </form>
      ) : (
        <div className="ended-bar">
          <div className="ended-bar-inner">
            <span>当前不能发送消息</span>
            <div className="ended-bar-actions">
              <Link to={relation?.status === 'ended' ? `/friend/${personId}` : '/home'} className="ended-link">
                {relation?.status === 'ended' ? '查看资料' : '返回朋友'}
              </Link>
              {messages.length > 0 && (
                <button type="button" className="ended-delete" onClick={() => setAskDelete(true)}>
                  删除记录
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {askDelete && <Sheet title="聊天记录" onClose={() => setAskDelete(false)}><p className="sheet-note">删除后无法恢复。</p><button type="button" className="settings-row danger-text" onClick={() => {deleteThread(personId);setAskDelete(false)}}>删除全部聊天记录</button></Sheet>}
      {lightbox && <Lightbox image={lightbox} onClose={() => setLightbox(null)} />}
    </FitViewport>
  )
}

function Lightbox({ image, onClose }: { image: string; onClose: () => void }) {
  return (
    <button type="button" className="lightbox" onClick={onClose} aria-label="关闭照片">
      <Photo image={image} alt="放大查看" />
    </button>
  )
}
