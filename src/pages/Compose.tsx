import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { FitViewport, LockScroll, useTitle } from '../ui'
import { BackButton, Icon } from '../components/Elements'
export function ComposePage() {
  const navigate = useNavigate()
  const { addMoment } = useStore()
  const [file,setFile] = useState<File | null>(null)
  const [caption,setCaption] = useState('')
  const [preview,setPreview] = useState('')
  const [error,setError] = useState('')
  const [busy,setBusy] = useState(false)
  const picker = useRef<HTMLInputElement>(null)
  useTitle('分享日常 · Day Two')
  useEffect(() => {if (!file) {setPreview('');return};const url=URL.createObjectURL(file);setPreview(url);return () => URL.revokeObjectURL(url)},[file])
  const choose = (next?: File) => {if (!next) return;if (!next.type.startsWith('image/')) {setError('请选择图片');return};if (next.size > 12*1024*1024) {setError('照片不能超过 12MB');return};setError('');setFile(next)}
  const submit = async () => {if (!file || busy) return;setBusy(true);setError('');try {const id=await addMoment(file,caption);navigate(`/feed/me?m=${id}`,{replace:true})} catch(e) {console.error('Photo upload failed:',String(e));setError(e instanceof Error ? e.message : '上传失败，请重试');setBusy(false)}}
  return <FitViewport><LockScroll/><header className="topbar"><BackButton to="/daily"/><h1>分享日常</h1><button className="text-button accent-text" type="button" disabled={!file || busy} onClick={() => void submit()}>{busy ? '发布中…' : '发布'}</button></header><div className="compose-body"><input ref={picker} className="sr-only" type="file" accept="image/*" aria-label="选择照片" disabled={busy} onChange={e => {choose(e.target.files?.[0]);e.target.value=''}}/>
    <button className={`upload-stage${preview ? ' has-photo' : ''}`} type="button" disabled={busy} onClick={() => picker.current?.click()} aria-label={preview ? '更换照片' : '选择照片'}>{preview ? <img src={preview} alt="待发布的照片"/> : <span><Icon name="plus" size={32}/><strong>选择照片</strong></span>}</button>
    <label className="caption-field"><span className="sr-only">照片描述</span><textarea placeholder="这一刻…" aria-label="照片描述" maxLength={80} rows={2} value={caption} onChange={e => setCaption(e.target.value)}/><small>{caption.length}/80</small></label>{error && <p className="error" role="alert">{error}</p>}</div></FitViewport>
}
