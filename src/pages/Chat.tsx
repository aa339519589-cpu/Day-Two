import { useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { BRAND } from '../brand'
import { dayCount, formatWhen } from '../logic'
import { useStore } from '../store'
import { Avatar, Back, Dialog, FitViewport, IconImage, LockScroll, Photo, useTitle } from '../ui'

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
        <button type="button" className="btn" onClick={() => navigate('/messages')}>
          回消息
        </button>
      </div>
    )
  }

  const active = relation?.status === 'active'
  const canSend = active

  const submit = () => {
    if (!canSend || !text.trim()) return
    sendText(personId, text, moment?.id)
    setText('')
    if (moment) setParams({}, { replace: true })
  }

  return (
    <FitViewport>
      <LockScroll />
      <header className="topbar">
        <Back fallback="/messages" />
        <Avatar initial={person.initial} tint={person.tint} />
        <div className="grow">
          <h1>{person.name}</h1>
          <p>
            {relation?.status === 'active' && `第 ${dayCount(relation.since)} 天`}
            {relation?.status === 'ended' && '关系已结束'}
            {relation?.status === 'incoming' && '还没坐进席位'}
            {relation?.status === 'outgoing' && '等待对方同意'}
            {!relation && '还不是好友'}
          </p>
        </div>
        {messages.length > 0 && (
          <button type="button" className="btn text" onClick={() => setAskDelete(true)}>
            删除
          </button>
        )}
      </header>
      <div className="chat-log" ref={logRef}>
        <div className="chat-log-inner">
        {messages.length === 0 && <p className="note">还没有消息</p>}
        {messages.map((message, index) => {
          const previous = messages[index - 1]
          const gap = !previous || new Date(message.createdAt).getTime() - new Date(previous.createdAt).getTime() > 15 * 60 * 1000
          const quoted = message.momentId ? data.moments.find((item) => item.id === message.momentId) : undefined
          return (
            <div key={message.id} style={{ display: 'contents' }}>
              {gap && <div className="when">{formatWhen(message.createdAt)}</div>}
              <article className={`bubble ${message.from === 'me' ? 'me' : 'them'}`}>
                {quoted && (
                  <button
                    type="button"
                    className="quote"
                    onClick={() => (active ? navigate(`/feed/${personId}?m=${quoted.id}`) : setLightbox(quoted.image))}
                  >
                    <Photo image={quoted.image} alt="" />
                    <span>{quoted.caption || '一张日常'}</span>
                  </button>
                )}
                {message.image && <Photo className="shot" image={message.image} alt="聊天照片" onClick={() => setLightbox(message.image!)} />}
                {message.text && <p>{message.text}</p>}
              </article>
            </div>
          )
        })}
        </div>
      </div>
      {moment && canSend && (
        <div className="draft">
          <Photo image={moment.image} alt="" />
          <div className="grow">
            <small>回应这张日常</small>
            <p>{moment.caption || '没有配文'}</p>
          </div>
          <button type="button" className="icon-btn" aria-label="取消回应" onClick={() => setParams({}, { replace: true })}>
            ×
          </button>
        </div>
      )}
      {error && <p className="error">{error}</p>}
      {canSend ? (
        <form
          className="composer"
          onSubmit={(event) => {
            event.preventDefault()
            submit()
          }}
        >
          <label className="icon-btn file-hit" aria-label="发送照片">
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
                  .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : '照片没有发出去。'))
                  .finally(() => setBusy(false))
              }}
            />
          </label>
          <input
            type="text"
            value={text}
            maxLength={500}
            placeholder={busy ? '正在处理照片…' : '写一句就好'}
            onChange={(event) => setText(event.target.value)}
          />
          <button className="send" type="submit" disabled={!text.trim() || busy}>
            发送
          </button>
        </form>
      ) : (
        <div className="ended-bar">
          {relation?.status === 'ended' ? '已结束' : '还不能发送'}
          <Link to={relation?.status === 'ended' ? `/friend/${personId}` : '/home'} className="fine">
            {relation?.status === 'ended' ? '这段关系' : '席位'}
          </Link>
          {messages.length > 0 && (
            <button type="button" className="btn ghost" onClick={() => setAskDelete(true)}>
              删除聊天记录
            </button>
          )}
        </div>
      )}
      {askDelete && (
        <Dialog
          title="删除聊天"
          body="关系和照片都还在。"
          confirm="删除"
          danger
          onClose={() => setAskDelete(false)}
          onConfirm={() => {
            deleteThread(personId)
            setAskDelete(false)
          }}
        />
      )}
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

