import { addDays, dayCount, dayKeyFromIso, streakInfo } from './logic'
import type { Message, Moment, Persisted, Person, Relation } from './types'

export type Pulse = {
  person: Person
  relation: Relation
  days: number
  latest?: Moment
  /** A recent photo from them (today or yesterday) that I have not answered yet. */
  opener?: Moment
  last?: Message
  waiting: boolean
  streak: number | null
  tone: 'waiting' | 'opener' | 'sent' | 'quiet' | 'new'
  line: string
}

export function latestMoment(data: Persisted, authorId: string) {
  return data.moments.filter(m => m.authorId === authorId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
}

export function lastMessage(data: Persisted, personId: string) {
  return data.messages.filter(m => m.personId === personId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
}

export function whenShort(iso: string, today: string) {
  const day = dayKeyFromIso(iso)
  const d = new Date(iso)
  const hm = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
  if (day === today) return hm
  if (day === addDays(today, -1)) return '昨天'
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export function partOfDay(iso: string) {
  const h = new Date(iso).getHours()
  if (h < 5) return '深夜'
  if (h < 11) return '早上'
  if (h < 14) return '中午'
  if (h < 18) return '下午'
  if (h < 23) return '晚上'
  return '深夜'
}

export function pulseOf(data: Persisted, relation: Relation, today: string): Pulse | null {
  const person = data.people.find(p => p.id === relation.personId)
  if (!person) return null
  const latest = latestMoment(data, person.id)
  const last = lastMessage(data, person.id)
  const answered = new Set(data.messages.filter(m => m.personId === person.id && m.from === 'me' && m.momentId).map(m => m.momentId))
  const recentLimit = addDays(today, -1)
  const opener = data.moments
    .filter(m => m.authorId === person.id && dayKeyFromIso(m.createdAt) >= recentLimit && !answered.has(m.id))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  const waiting = last?.from === 'them'
  const c = relation.contract
  const streak = c.status === 'active' || c.status === 'paused' ? streakInfo(c, today).days : null
  const p = person.pronoun
  let tone: Pulse['tone'] = 'quiet'
  let line = '还没开始聊'
  if (waiting) { tone = 'waiting'; line = `${p}在等你回` }
  else if (opener) { tone = 'opener'; line = `${dayKeyFromIso(opener.createdAt) === today ? '今天' : '昨天'}${partOfDay(opener.createdAt)}，${p}分享了一张` }
  else if (last) { tone = 'sent'; line = `轮到${p}了` }
  else if (relation.status === 'active' && dayCount(relation.since) <= 3) { tone = 'new'; line = '刚成为朋友' }
  return { person, relation, days: dayCount(relation.since), latest, opener, last, waiting, streak, tone, line }
}

export function activePulses(data: Persisted, today: string) {
  return data.relations
    .filter(r => r.status === 'active')
    .sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0))
    .map(r => pulseOf(data, r, today))
    .filter((p): p is Pulse => !!p)
}
