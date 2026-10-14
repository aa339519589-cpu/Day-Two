import { addDays, todayKey } from './logic'
import { blankContract, type Moment, type Persisted } from './types'

function atDaysAgo(days: number, hour: number, minute: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

export function createSeed(): Persisted {
  const today = todayKey()
  const linSince = atDaysAgo(17, 21, 10)
  const noahSince = atDaysAgo(3, 16, 5)

  const moments: Moment[] = [
    { id: 'p-lin-morning', authorId: 'lin', image: '/photos/lin-morning.jpg', caption: '早上只煮了这些。窗边有一点光。', createdAt: atDaysAgo(0, 8, 12), mine: false },
    { id: 'p-lin-dusk', authorId: 'lin', image: '/photos/lin-dusk.jpg', caption: '天黑之前，从阳台看了一眼。', createdAt: atDaysAgo(1, 18, 40), mine: false },
    { id: 'p-lin-desk', authorId: 'lin', image: '/photos/lin-desk.jpg', caption: '桌子收回去了，水还在。', createdAt: atDaysAgo(3, 15, 20), mine: false },
    { id: 'p-lin-cat', authorId: 'lin', image: '/photos/lin-cat.jpg', caption: '它先睡着了。', createdAt: atDaysAgo(5, 21, 15), mine: false },
    { id: 'p-lin-rain', authorId: 'lin', image: '/photos/lin-rain.jpg', caption: '雨还没停，车先靠在墙边。', createdAt: atDaysAgo(8, 22, 5), mine: false },
    { id: 'p-noah-river', authorId: 'noah', image: '/photos/noah-river.jpg', caption: '骑到河边就停住了。', createdAt: atDaysAgo(1, 17, 5), mine: false },
    { id: 'p-noah-lunch', authorId: 'noah', image: '/photos/noah-lunch.jpg', caption: '公园里的午饭。', createdAt: atDaysAgo(2, 12, 40), mine: false },
    { id: 'p-noah-plant', authorId: 'noah', image: '/photos/noah-plant.jpg', caption: '下雨，它在窗台上。', createdAt: atDaysAgo(4, 10, 12), mine: false },
    { id: 'p-noah-bus', authorId: 'noah', image: '/photos/noah-bus.jpg', caption: '末班车的窗户。', createdAt: atDaysAgo(6, 22, 48), mine: false },
    { id: 'p-me-noodles', authorId: 'me', image: '/photos/me-noodles.jpg', caption: '楼下那碗面。', createdAt: atDaysAgo(2, 19, 10), mine: false },
    { id: 'p-me-path', authorId: 'me', image: '/photos/me-path.jpg', caption: '去学校的路，叶子已经黄了。', createdAt: atDaysAgo(9, 8, 30), mine: false },
    { id: 'p-zhou-books', authorId: 'zhou', image: '/photos/zhou-books.jpg', caption: '夜班开始了，灯只开一盏。', createdAt: atDaysAgo(1, 21, 20), mine: false },
    { id: 'p-zhou-coffee', authorId: 'zhou', image: '/photos/zhou-coffee.jpg', caption: '只喝黑的。', createdAt: atDaysAgo(3, 23, 5), mine: false },
    { id: 'p-zhou-lane', authorId: 'zhou', image: '/photos/zhou-lane.jpg', caption: '回家要经过这条巷子。', createdAt: atDaysAgo(6, 20, 15), mine: false },
    { id: 'p-mina-citrus', authorId: 'mina', image: '/photos/mina-citrus.jpg', caption: '切了一盘，太多了。', createdAt: atDaysAgo(0, 11, 5), mine: false },
    { id: 'p-mina-curtain', authorId: 'mina', image: '/photos/mina-curtain.jpg', caption: '把窗户打开了一会儿。', createdAt: atDaysAgo(4, 9, 40), mine: false },
  ]

  return {
    version: 1,
    onboarded: false,
    me: {
      name: '阿南',
      bio: '还在学着把第二天也说出口。',
      city: '这里',
      languages: ['中文'],
      interests: ['吃饭', '走路'],
      tint: '#6b4a32',
    },
    people: [
      {
        id: 'lin',
        name: '林可',
        pronoun: '她',
        bio: '在杭州念书。喜欢把一天里没什么用的光记下来。',
        city: '杭州',
        languages: ['中文', '英语'],
        interests: ['胶片', '猫', '走路'],
        initial: '可',
        tint: '#8d3d22',
      },
      {
        id: 'noah',
        name: 'Noah',
        pronoun: '他',
        bio: '学平面。话不多，但会把看到的东西留下来。',
        city: '上海',
        languages: ['英语', '中文'],
        interests: ['骑车', '素描', '植物'],
        initial: 'N',
        tint: '#23423d',
      },
      {
        id: 'zhou',
        name: '周予安',
        pronoun: '他',
        bio: '做书店夜班。想找一个可以慢慢说话的人。',
        city: '成都',
        languages: ['中文'],
        interests: ['书', '夜路', '咖啡'],
        initial: '予',
        tint: '#3c3a52',
      },
      {
        id: 'mina',
        name: '米娜',
        pronoun: '她',
        bio: '早上切水果，下午把窗户打开。不太会寒暄。',
        city: '广州',
        languages: ['中文', '粤语'],
        interests: ['水果', '窗', '早晨'],
        initial: '娜',
        tint: '#8a6232',
      },
    ],
    relations: [
      {
        personId: 'lin',
        status: 'active',
        since: linSince,
        slot: 0,
        contract: {
          status: 'active',
          since: linSince,
          selfDays: [1, 2, 3, 4, 5, 6].map((n) => addDays(today, -n)),
          peerMode: 'recent',
        },
      },
      {
        personId: 'noah',
        status: 'active',
        since: noahSince,
        slot: 1,
        contract: blankContract(),
      },
      {
        personId: 'zhou',
        status: 'incoming',
        since: atDaysAgo(1, 9, 0),
        slot: null,
        contract: blankContract(),
      },
    ],
    moments,
    messages: [
      {
        id: 'c-lin-1',
        personId: 'lin',
        from: 'them',
        text: '第二天我还是想跟你说话。刚才那张天，你看见了吗？',
        createdAt: atDaysAgo(1, 18, 46),
      },
      {
        id: 'c-lin-2',
        personId: 'lin',
        from: 'me',
        text: '看见了。那道颜色停了很久。',
        createdAt: atDaysAgo(1, 19, 2),
      },
      {
        id: 'c-lin-3',
        personId: 'lin',
        from: 'them',
        text: '早餐在窗边。你今天可以晚一点回，没关系。',
        momentId: 'p-lin-morning',
        createdAt: atDaysAgo(0, 8, 20),
      },
      {
        id: 'c-noah-1',
        personId: 'noah',
        from: 'them',
        text: '我不太会开场。这是我骑到的地方，先放在这里。',
        momentId: 'p-noah-river',
        createdAt: atDaysAgo(1, 17, 12),
      },
    ],
  }
}
