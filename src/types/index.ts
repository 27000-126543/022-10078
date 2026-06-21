export type CategoryType = 'xuanhuan' | 'yanqing' | 'xuanyi' | 'tongren' | 'qita'

export const CATEGORY_LABELS: Record<CategoryType, string> = {
  xuanhuan: '玄幻',
  yanqing: '言情',
  xuanyi: '悬疑',
  tongren: '同人',
  qita: '其他',
}

export const CATEGORY_COLORS: Record<CategoryType, string> = {
  xuanhuan: '#7c5cff',
  yanqing: '#ff6b9d',
  xuanyi: '#4ecdc4',
  tongren: '#f5a623',
  qita: '#8b8fa3',
}

export type PriorityType = 'must' | 'feed' | 'watch' | 'none'

export const PRIORITY_LABELS: Record<PriorityType, string> = {
  must: '必看',
  feed: '养肥',
  watch: '弃坑观察',
  none: '普通',
}

export const PRIORITY_COLORS: Record<PriorityType, string> = {
  must: '#ff5c7c',
  feed: '#f5a623',
  watch: '#4ecdc4',
  none: '#8b8fa3',
}

export interface Chapter {
  id: string
  novelId: string
  title: string
  wordCount: number
  publishTime: number
  isRead: boolean
  chapterNumber: number
}

export interface Note {
  id: string
  novelId: string
  chapterNumber?: number
  content: string
  createdAt: number
  updatedAt: number
  type: 'plot' | 'character' | 'general'
}

export interface Novel {
  id: string
  title: string
  author: string
  category: CategoryType
  source: string
  cover?: string
  lastReadChapter: number
  lastReadTime?: number
  expectation: number
  isPaid: boolean
  priority: PriorityType
  feedThreshold: number
  lastNotifiedFeedChapters?: number
  description?: string
  latestChapter?: number
  totalWordCount?: number
  tags?: string[]
  createdAt: number
  updatedAt: number
}

export interface AppState {
  novels: Novel[]
  chapters: Chapter[]
  notes: Note[]
  selectedNovelId: string | null
  lastRadarCheck: number
}
