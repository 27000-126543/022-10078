import { AppState, Novel, Chapter, Note, CategoryType } from '../types'

const STORAGE_KEY = 'novel-tracker-state-v1'

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AppState
      if (parsed.novels && parsed.novels.length > 0) {
        return parsed
      }
    }
  } catch (e) {
    console.error('Failed to load state:', e)
  }
  return createInitialState()
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.error('Failed to save state:', e)
  }
}

export function formatTime(ts: number): string {
  const date = new Date(ts)
  const now = Date.now()
  const diff = now - ts

  if (diff < 60 * 1000) return '刚刚'
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}分钟前`
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}小时前`
  if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`

  return `${date.getMonth() + 1}/${date.getDate()}`
}

export function formatWordCount(count: number): string {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}万`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`
  return count.toString()
}

function createInitialState(): AppState {
  const now = Date.now()
  const novels: Novel[] = [
    {
      id: 'n1',
      title: '诡秘之主2：宿命之环',
      author: '爱潜水的乌贼',
      category: 'xuanhuan',
      source: '起点中文网',
      lastReadChapter: 234,
      lastReadTime: now - 3 * 60 * 60 * 1000,
      expectation: 5,
      isPaid: true,
      priority: 'must',
      feedThreshold: 10,
      latestChapter: 256,
      totalWordCount: 3280000,
      tags: ['克苏鲁', '蒸汽朋克', '塔罗牌'],
      createdAt: now - 180 * 24 * 60 * 60 * 1000,
      updatedAt: now,
      description: '延续诡秘之主世界观的第二部，讲述外神入侵之后的故事。',
    },
    {
      id: 'n2',
      title: '深海余烬',
      author: '远瞳',
      category: 'xuanhuan',
      source: '起点中文网',
      lastReadChapter: 412,
      lastReadTime: now - 5 * 60 * 60 * 1000,
      expectation: 4,
      isPaid: true,
      priority: 'must',
      feedThreshold: 5,
      latestChapter: 415,
      totalWordCount: 4120000,
      tags: ['科幻', '末日', '舰船'],
      createdAt: now - 365 * 24 * 60 * 60 * 1000,
      updatedAt: now,
      description: '末日之后的深海探索，寻找人类文明的余烬。',
    },
    {
      id: 'n3',
      title: '黎明之剑',
      author: '远瞳',
      category: 'xuanhuan',
      source: '起点中文网',
      lastReadChapter: 680,
      expectation: 4,
      isPaid: true,
      priority: 'feed',
      feedThreshold: 20,
      lastNotifiedFeedChapters: 0,
      latestChapter: 720,
      totalWordCount: 5800000,
      tags: ['科幻', '种田', '异界'],
      createdAt: now - 500 * 24 * 60 * 60 * 1000,
      updatedAt: now - 2 * 60 * 60 * 1000,
      description: '高文穿越异界，带着卫星AI和星际文明遗产种田的故事。',
    },
    {
      id: 'n4',
      title: '我有一座恐怖屋',
      author: '我会修空调',
      category: 'xuanyi',
      source: '起点中文网',
      lastReadChapter: 1200,
      expectation: 5,
      isPaid: false,
      priority: 'watch',
      feedThreshold: 50,
      latestChapter: 1250,
      totalWordCount: 3500000,
      tags: ['灵异', '恐怖', '经营'],
      createdAt: now - 700 * 24 * 60 * 60 * 1000,
      updatedAt: now - 10 * 60 * 60 * 1000,
      description: '继承一座恐怖屋，用厉鬼打造真正的恐怖体验。',
    },
    {
      id: 'n5',
      title: '我的治愈系游戏',
      author: '我会修空调',
      category: 'xuanyi',
      source: '起点中文网',
      lastReadChapter: 310,
      lastReadTime: now - 8 * 60 * 60 * 1000,
      expectation: 4,
      isPaid: true,
      priority: 'must',
      feedThreshold: 8,
      latestChapter: 328,
      totalWordCount: 1890000,
      tags: ['灵异', '游戏', '治愈'],
      createdAt: now - 90 * 24 * 60 * 60 * 1000,
      updatedAt: now,
      description: '名为治愈系的恐怖游戏，每一个NPC背后都有一个悲惨的故事。',
    },
    {
      id: 'n6',
      title: '知否？知否？应是绿肥红瘦',
      author: '关心则乱',
      category: 'yanqing',
      source: '晋江文学城',
      lastReadChapter: 200,
      expectation: 4,
      isPaid: true,
      priority: 'none',
      feedThreshold: 30,
      latestChapter: 200,
      totalWordCount: 1380000,
      tags: ['古代', '宅斗', '种田'],
      createdAt: now - 2 * 365 * 24 * 60 * 60 * 1000,
      updatedAt: now - 50 * 24 * 60 * 60 * 1000,
      description: '盛家六姑娘明兰的古代生活日常。',
    },
    {
      id: 'n7',
      title: '星汉灿烂，幸甚至哉',
      author: '关心则乱',
      category: 'yanqing',
      source: '晋江文学城',
      lastReadChapter: 88,
      lastReadTime: now - 20 * 60 * 60 * 1000,
      expectation: 4,
      isPaid: true,
      priority: 'feed',
      feedThreshold: 15,
      lastNotifiedFeedChapters: 0,
      latestChapter: 132,
      totalWordCount: 980000,
      tags: ['古代', '穿越', '甜宠'],
      createdAt: now - 60 * 24 * 60 * 60 * 1000,
      updatedAt: now - 5 * 60 * 60 * 1000,
      description: '穿越成被父母留下的留守少女，与少年将军的故事。',
    },
    {
      id: 'n8',
      title: '我磕了对家x我的CP',
      author: 'pepa',
      category: 'tongren',
      source: '长佩文学',
      lastReadChapter: 56,
      expectation: 4,
      isPaid: false,
      priority: 'must',
      feedThreshold: 3,
      latestChapter: 58,
      totalWordCount: 220000,
      tags: ['娱乐圈', '甜宠', '爆笑'],
      createdAt: now - 15 * 24 * 60 * 60 * 1000,
      updatedAt: now,
      description: '两位娱乐圈对家的CP粉丝文学成真了。',
    },
    {
      id: 'n9',
      title: '诡秘之主之倒吊人',
      author: '同人作者',
      category: 'tongren',
      source: '起点中文网',
      lastReadChapter: 45,
      expectation: 3,
      isPaid: false,
      priority: 'watch',
      feedThreshold: 25,
      latestChapter: 89,
      totalWordCount: 450000,
      tags: ['诡秘同人', '原创男主'],
      createdAt: now - 30 * 24 * 60 * 60 * 1000,
      updatedAt: now - 12 * 60 * 60 * 1000,
      description: '穿越诡秘世界成为倒吊人途径的故事。',
    },
    {
      id: 'n10',
      title: '民调局异闻录',
      author: '耳东水寿',
      category: 'xuanyi',
      source: '起点中文网',
      lastReadChapter: 500,
      expectation: 4,
      isPaid: false,
      priority: 'none',
      feedThreshold: 50,
      latestChapter: 620,
      totalWordCount: 2800000,
      tags: ['灵异', '悬疑', '民俗'],
      createdAt: now - 400 * 24 * 60 * 60 * 1000,
      updatedAt: now - 20 * 60 * 60 * 1000,
      description: '民俗调查局处理各种神秘事件。',
    },
    {
      id: 'n11',
      title: '择天记',
      author: '猫腻',
      category: 'xuanhuan',
      source: '起点中文网',
      lastReadChapter: 800,
      expectation: 4,
      isPaid: true,
      priority: 'none',
      feedThreshold: 100,
      latestChapter: 1000,
      totalWordCount: 3200000,
      tags: ['玄幻', '热血', '修仙'],
      createdAt: now - 3 * 365 * 24 * 60 * 60 * 1000,
      updatedAt: now - 60 * 24 * 60 * 60 * 1000,
      description: '陈长生逆天改命的故事。',
    },
    {
      id: 'n12',
      title: '庆余年',
      author: '猫腻',
      category: 'qita',
      source: '起点中文网',
      lastReadChapter: 0,
      expectation: 5,
      isPaid: false,
      priority: 'feed',
      feedThreshold: 50,
      lastNotifiedFeedChapters: 0,
      latestChapter: 780,
      totalWordCount: 2600000,
      tags: ['穿越', '权谋', '历史'],
      createdAt: now - 10 * 24 * 60 * 60 * 1000,
      updatedAt: now - 8 * 60 * 60 * 1000,
      description: '范闲从庆国开始的传奇人生。',
    },
  ]

  const chapters: Chapter[] = [
    ...generateChapters('n1', 235, 256, now, 3500, '起点中文网'),
    ...generateChapters('n2', 413, 415, now, 4200, '起点中文网'),
    ...generateChapters('n3', 681, 720, now - 3 * 60 * 60 * 1000, 3800, '起点中文网'),
    ...generateChapters('n4', 1201, 1250, now - 12 * 60 * 60 * 1000, 3200, '起点中文网'),
    ...generateChapters('n5', 311, 328, now - 1 * 60 * 60 * 1000, 4000, '起点中文网'),
    ...generateChapters('n7', 89, 132, now - 6 * 60 * 60 * 1000, 3600, '晋江文学城'),
    ...generateChapters('n8', 57, 58, now - 30 * 60 * 1000, 3800, '长佩文学'),
    ...generateChapters('n9', 46, 89, now - 14 * 60 * 60 * 1000, 3400, '起点中文网'),
    ...generateChapters('n10', 501, 620, now - 22 * 60 * 60 * 1000, 2800, '起点中文网'),
    ...generateChapters('n12', 1, 780, now - 9 * 60 * 60 * 1000, 3200, '起点中文网'),
  ]

  const notes: Note[] = [
    {
      id: 'note1',
      novelId: 'n1',
      chapterNumber: 230,
      content: '宿命之环的真实能力终于揭露了，是能够看到所有可能的未来然后选择最好的一条？感觉和克莱恩的错误途径有某种联系，而且外神和旧日之间好像不是铁板一块，有缝隙可以利用。',
      createdAt: now - 4 * 24 * 60 * 60 * 1000,
      updatedAt: now - 4 * 24 * 60 * 60 * 1000,
      type: 'plot',
    },
    {
      id: 'note2',
      novelId: 'n1',
      chapterNumber: 210,
      content: '主角团当前战力：\n- 卤面：宿命之环序列3 + 猎人途径半神\n- 奥萝拉：魔女途径序列4\n- 塔罗会众人：基本序列2-3水平\n\n感觉对抗外神还是不够，应该需要愚者先生苏醒。',
      createdAt: now - 10 * 24 * 60 * 60 * 1000,
      updatedAt: now - 5 * 24 * 60 * 60 * 1000,
      type: 'character',
    },
    {
      id: 'note3',
      novelId: 'n5',
      chapterNumber: 305,
      content: '恐怖屋老板陈歌在本作中登场了！虽然只是客串，但两个世界观确实是连通的。陈歌现在是什么级别？感觉至少是红衣厉鬼级别的boss了。',
      createdAt: now - 2 * 24 * 60 * 60 * 1000,
      updatedAt: now - 2 * 24 * 60 * 60 * 1000,
      type: 'plot',
    },
    {
      id: 'note4',
      novelId: 'n2',
      chapterNumber: 400,
      content: '新的深渊区域探索开始，发现了失落文明的遗迹。这里的"神明"好像和旧时代的人工智能有关？远瞳一贯的科幻+神明设定。',
      createdAt: now - 1 * 24 * 60 * 60 * 1000,
      updatedAt: now - 1 * 24 * 60 * 60 * 1000,
      type: 'general',
    },
  ]

  return {
    novels,
    chapters,
    notes,
    selectedNovelId: 'n1',
    lastRadarCheck: now,
  }
}

function generateChapters(
  novelId: string,
  start: number,
  end: number,
  baseTime: number,
  avgWords: number,
  _source: string
): Chapter[] {
  const chapters: Chapter[] = []
  for (let i = start; i <= end; i++) {
    const timeAgo = (end - i) * 2 * 60 * 60 * 1000 + Math.random() * 60 * 60 * 1000
    chapters.push({
      id: `${novelId}-c${i}`,
      novelId,
      title: generateChapterTitle(i),
      wordCount: Math.floor(avgWords + (Math.random() - 0.5) * avgWords * 0.4),
      publishTime: baseTime - timeAgo,
      isRead: false,
      chapterNumber: i,
    })
  }
  return chapters
}

function generateChapterTitle(num: number): string {
  const titles = [
    `第${num}章 风雨欲来`,
    `第${num}章 暗流涌动`,
    `第${num}章 惊鸿一瞥`,
    `第${num}章 柳暗花明`,
    `第${num}章 山雨欲来`,
    `第${num}章 风起云涌`,
    `第${num}章 月下独酌`,
    `第${num}章 真相初现`,
    `第${num}章 迷雾重重`,
    `第${num}章 破茧成蝶`,
  ]
  return titles[num % titles.length]
}

export function getNovelsByCategory(novels: Novel[]): Record<CategoryType, Novel[]> {
  const result: Record<string, Novel[]> = {
    xuanhuan: [],
    yanqing: [],
    xuanyi: [],
    tongren: [],
    qita: [],
  }
  for (const n of novels) {
    result[n.category].push(n)
  }
  return result as Record<CategoryType, Novel[]>
}

export function getRecentChapters(
  chapters: Chapter[],
  hours: number = 24
): Chapter[] {
  const cutoff = Date.now() - hours * 60 * 60 * 1000
  return chapters
    .filter((c) => c.publishTime >= cutoff)
    .sort((a, b) => b.publishTime - a.publishTime)
}

export function getUnreadCountByNovelId(
  chapters: Chapter[],
  novelId: string,
  lastRead: number
): number {
  return chapters.filter(
    (c) => c.novelId === novelId && c.chapterNumber > lastRead && !c.isRead
  ).length
}

export function getFeedProgress(
  novel: Novel,
  unreadCount: number
): { current: number; threshold: number; ready: boolean } {
  return {
    current: unreadCount,
    threshold: novel.feedThreshold,
    ready: unreadCount >= novel.feedThreshold,
  }
}
