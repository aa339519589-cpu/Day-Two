export type ContractStatus = 'off' | 'pending' | 'active' | 'paused' | 'ended'
export type RelationStatus = 'incoming' | 'outgoing' | 'active' | 'ended'
export type ThemeMode = 'system' | 'light' | 'dark'
export type PeerMode = 'none' | 'recent'

export type Contract = {
  status: ContractStatus
  since?: string
  selfDays: string[]
  /** Demo script. `recent` means this person "shared" each of the last 7 days on this device only. */
  peerMode: PeerMode
}

export type Person = {
  id: string
  name: string
  pronoun: '她' | '他'
  bio: string
  city: string
  languages: string[]
  interests: string[]
  initial: string
  tint: string
}

export type Me = {
  name: string
  bio: string
  city: string
  languages: string[]
  interests: string[]
  tint: string
}

export type Relation = {
  personId: string
  status: RelationStatus
  since: string
  endedAt?: string
  slot: number | null
  contract: Contract
}

export type Moment = {
  id: string
  authorId: string
  image: string
  caption: string
  createdAt: string
  /** True only for photos the local user added on this device. */
  mine: boolean
}

export type Message = {
  id: string
  personId: string
  from: 'me' | 'them'
  text: string
  image?: string
  momentId?: string
  createdAt: string
}

export type Persisted = {
  version: 1
  onboarded: boolean
  me: Me
  people: Person[]
  relations: Relation[]
  moments: Moment[]
  messages: Message[]
}

export function blankContract(): Contract {
  return { status: 'off', selfDays: [], peerMode: 'none' }
}
