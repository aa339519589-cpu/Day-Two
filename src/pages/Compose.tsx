import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { FitViewport, LockScroll, useTitle } from '../ui'
import { BackButton, Icon } from '../components/Elements'

export function ComposePage() {
  const navigate = useNavigate()
  const { addMoment, data } = useStore()
  const [file, setFile] = useState<File | null>(null)
  const [caption, setCaption] = useState('')
  const [preview, setPreview] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const picker = useRef<HTMLInputElement>(null)
  useTitle('分享日常 · Day Two')
  useEffect(() => { if (!file) { setPreview(''); return }; const url = URL.createObjectURL(file); setPreview(url); return () => URL.revokeObjectURL(url) }, [file])
  const choose = (next?: File) => { if (!next) return; if (!next.type.startsWith('image/')) { setError('请选择图片'); return }; if (next.size > 12 * 1024 * 1024) { setError('照片不能超过 12MB'); return }; setError(''); setFile(next) }
  const submit = async () => { if (!file || busy) return; setBusy(true); setError(''); try { const id = await addMoment(file, caption); navigate(`/feed/me?m=${id}`, { replace: true }) } catch (e) { console.error('Photo upload failed:', String(e)); setError(e instanceof Error ? e.message : '上传失败，请重试'); setBusy(false) } }
  const friends = data.relations.filter(r => r.status === 'active').map(r => data.people.find(p => p.id === r.personId)?.name).filter(Boolean)
  const now = new Date()
  return <FitViewport><LockScroll/>
    <header className="chat-topbar compose-top"><BackButton to="/daily"/><h1>今天的日常</h1><button className="pill solid small" type="button" disabled={!file || busy} onClick={() => void submit()}>{busy ? '发布中…' : '发布'}</button></header>
    <div className="compose-body">
      <input ref={picker} className="sr-only" type="file" accept="image/*" aria-label="选择照片" disabled={busy} onChange={e => { choose(e.target.files?.[0]); e.target.value = '' }}/>
      <button className={`upload-stage${preview ? ' has-photo' : ''}`} type="button" disabled={busy} onClick={() => picker.current?.click()} aria-label={preview ? '更换照片' : '选择照片'}>
        {preview ? <><img src={preview} alt="待发布的照片"/><span className="upload-swap"><Icon name="image" size={16}/>换一张</span></> : <span className="upload-empty"><span className="upload-ring"><Icon name="camera" size={30}/></span><strong>选一张今天的照片</strong><small>不用好看，真实就行</small></span>}
      </button>
      <label className="caption-field"><span className="caption-date">{now.getMonth() + 1}月{now.getDate()}日 {now.getHours()}:{String(now.getMinutes()).padStart(2, '0')}</span><textarea placeholder="写一句，这一刻…" aria-label="照片描述" maxLength={80} rows={2} value={caption} onChange={e => setCaption(e.target.value)}/><small>{caption.length}/80</small></label>
      {error && <p className="error" role="alert">{error}</p>}
      <p className="compose-audience"><Icon name="friends" size={16}/>{friends.length ? `${friends.join('、')} 能看到，并可以从它开始聊` : '成为朋友后，对方才能看到'}</p>
    </div>
  </FitViewport>
}
