import React, { useMemo, useState } from 'react'
import { useStore } from '../store/StoreContext'
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  CategoryType,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  Novel,
  Chapter,
} from '../types'
import { getRecentChapters, formatTime, formatWordCount } from '../lib/storage'
import {
  Radar,
  Zap,
  Clock,
  FileText,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  EyeOff,
  Eye,
  Check,
  ListFilter,
} from 'lucide-react'

type SortType = 'time' | 'words'
type FilterCat = 'all' | CategoryType

interface Props {
  expanded: boolean
  onToggleExpanded: (v: boolean) => void
}

const UpdateRadar: React.FC<Props> = ({ expanded, onToggleExpanded }) => {
  const { state, selectNovel, markNovelReadTo, getUnreadForNovel } = useStore()
  const [sortBy, setSortBy] = useState<SortType>('time')
  const [filterCat, setFilterCat] = useState<FilterCat>('all')
  const [wordFilter, setWordFilter] = useState({ min: 0, max: 99999999 })
  const [onlyUnread, setOnlyUnread] = useState(false)
  const [hideWatch, setHideWatch] = useState(false)

  const recentChapters = useMemo(() => getRecentChapters(state.chapters, 24), [state.chapters])

  const novelMap = useMemo(() => {
    const m: Record<string, Novel> = {}
    for (const n of state.novels) m[n.id] = n
    return m
  }, [state.novels])

  const filteredChapters = useMemo(() => {
    let list = recentChapters.filter((c) => {
      const novel = novelMap[c.novelId]
      if (!novel) return false
      if (hideWatch && novel.priority === 'watch') return false
      if (onlyUnread && c.isRead) return false
      const passesCat = filterCat === 'all' || novel.category === filterCat
      const passesWf = c.wordCount >= wordFilter.min && c.wordCount <= wordFilter.max
      return passesCat && passesWf
    })
    if (sortBy === 'time') {
      list = [...list].sort((a, b) => b.publishTime - a.publishTime)
    } else {
      list = [...list].sort((a, b) => b.wordCount - a.wordCount)
    }
    return list
  }, [recentChapters, sortBy, filterCat, wordFilter, onlyUnread, hideWatch, novelMap])

  const groupedByNovel = useMemo(() => {
    const groups = new Map<string, { novel: Novel; chapters: Chapter[] }>()
    for (const ch of filteredChapters) {
      const novel = novelMap[ch.novelId]
      if (!novel) continue
      if (!groups.has(novel.id)) {
        groups.set(novel.id, { novel, chapters: [] })
      }
      groups.get(novel.id)!.chapters.push(ch)
    }
    return groups
  }, [filteredChapters, novelMap])

  const totalNew = filteredChapters.length
  const totalNovels = groupedByNovel.size
  const unreadOnlyCount = filteredChapters.filter((c) => !c.isRead).length

  const wordPresets = [
    { label: '全部', min: 0, max: 99999999 },
    { label: '短篇<2k', min: 0, max: 2000 },
    { label: '2k-3k', min: 2000, max: 3000 },
    { label: '3k-4k', min: 3000, max: 4000 },
    { label: '4k+', min: 4000, max: 99999999 },
  ]

  const currentWfIdx = wordPresets.findIndex(
    (w) => w.min === wordFilter.min && w.max === wordFilter.max
  )

  const handleMarkAllRead = () => {
    for (const [novelId, { novel }] of groupedByNovel) {
      if (novel.latestChapter) {
        markNovelReadTo(novelId, novel.latestChapter)
      }
    }
  }

  const handleMarkNovelRead = (novelId: string, latestChapter?: number) => {
    if (latestChapter) {
      markNovelReadTo(novelId, latestChapter)
    }
  }

  return (
    <div className="border-b border-novel-border bg-novel-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between px-5 py-3 border-b border-novel-border/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-novel-accent to-novel-must flex items-center justify-center">
              <Radar className="w-5 h-5 animate-pulse-slow" />
            </div>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-novel-must rounded-full text-[9px] font-bold flex items-center justify-center">
              {totalNew}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold">更新雷达</h2>
              <span className="text-xs text-novel-muted">
                最近24小时 · {totalNovels}部作品 · {totalNew}章
                {onlyUnread && <span className="text-novel-accent"> · 未读{unreadOnlyCount}章</span>}
              </span>
            </div>
            <p className="text-xs text-novel-muted mt-0.5">
              实时监控追更列表，一键批量标记已读
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-novel-dark rounded-lg p-1">
            <button
              onClick={() => setSortBy('time')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                sortBy === 'time'
                  ? 'bg-novel-accent text-white'
                  : 'text-novel-muted hover:text-novel-text'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              时间
            </button>
            <button
              onClick={() => setSortBy('words')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                sortBy === 'words'
                  ? 'bg-novel-accent text-white'
                  : 'text-novel-muted hover:text-novel-text'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              字数
            </button>
          </div>

          <div className="h-5 w-px bg-novel-border" />

          <button
            onClick={() => setOnlyUnread(!onlyUnread)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              onlyUnread
                ? 'bg-novel-accent/20 text-novel-accent'
                : 'text-novel-muted hover:text-novel-text hover:bg-white/5'
            }`}
            title="只看未读更新"
          >
            {onlyUnread ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            只看未读
          </button>

          <button
            onClick={() => setHideWatch(!hideWatch)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              hideWatch
                ? 'bg-novel-watch/20 text-novel-watch'
                : 'text-novel-muted hover:text-novel-text hover:bg-white/5'
            }`}
            title="隐藏弃坑观察作品"
          >
            <ListFilter className="w-3.5 h-3.5" />
            隐藏观察
          </button>

          {totalNovels > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 px-3 py-1.5 bg-novel-feed/20 text-novel-feed rounded-lg text-xs font-medium hover:bg-novel-feed/30 transition-colors"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              全部标读
            </button>
          )}

          <button
            onClick={() => onToggleExpanded(!expanded)}
            className="btn-ghost flex items-center gap-1 text-xs"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                收起
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                展开
              </>
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-5 py-3">
          <div className="flex flex-wrap items-center gap-4 mb-3">
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-xs text-novel-muted mr-1">分类:</span>
              {(['all', ...Object.keys(CATEGORY_LABELS)] as FilterCat[]).map((cat) => {
                const label = cat === 'all' ? '全部' : CATEGORY_LABELS[cat as CategoryType]
                const color = cat === 'all' ? '#8b8fa3' : CATEGORY_COLORS[cat as CategoryType]
                return (
                  <button
                    key={cat}
                    onClick={() => setFilterCat(cat)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                      filterCat === cat
                        ? 'text-white'
                        : 'bg-novel-dark text-novel-muted hover:text-novel-text'
                    }`}
                    style={{
                      backgroundColor: filterCat === cat ? color : undefined,
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-xs text-novel-muted mr-1">字数:</span>
              {wordPresets.map((w, idx) => (
                <button
                  key={w.label}
                  onClick={() => setWordFilter({ min: w.min, max: w.max })}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    currentWfIdx === idx
                      ? 'bg-novel-accent text-white'
                      : 'bg-novel-dark text-novel-muted hover:text-novel-text'
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          {filteredChapters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-novel-muted">
              <Radar className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">
                {onlyUnread || hideWatch
                  ? '当前筛选条件下无更新'
                  : '24小时内暂无符合条件的更新'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
              {Array.from(groupedByNovel.entries()).map(([novelId, { novel, chapters }]) => {
                const unreadCount = getUnreadForNovel(novelId)
                return (
                  <div
                    key={novelId}
                    className="card p-3 hover:border-novel-accent/40 transition-all group cursor-pointer"
                    onClick={() => selectNovel(novelId)}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-12 rounded flex-shrink-0 flex items-center justify-center text-xs font-bold"
                        style={{
                          backgroundColor: `${CATEGORY_COLORS[novel.category]}33`,
                          color: CATEGORY_COLORS[novel.category],
                        }}
                      >
                        {novel.title.slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-medium text-sm truncate flex-1" title={novel.title}>
                            {novel.title}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMarkNovelRead(novelId, novel.latestChapter)
                            }}
                            className="flex-shrink-0 p-1 text-novel-muted hover:text-novel-accent hover:bg-novel-accent/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            title="标记全部已读"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {novel.priority !== 'none' && (
                            <span
                              className="tag flex-shrink-0"
                              style={{
                                backgroundColor: `${PRIORITY_COLORS[novel.priority]}22`,
                                color: PRIORITY_COLORS[novel.priority],
                              }}
                            >
                              {PRIORITY_LABELS[novel.priority]}
                            </span>
                          )}
                          {unreadCount > 0 && (
                            <span className="tag bg-novel-must text-white flex-shrink-0">
                              +{unreadCount}
                            </span>
                          )}
                          <span className="text-[11px] text-novel-muted">
                            {novel.source}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {chapters.slice(0, 3).map((ch) => (
                            <div
                              key={ch.id}
                              className={`flex items-center justify-between text-xs py-1 px-2 rounded transition-colors ${
                                ch.isRead
                                  ? 'bg-novel-dark/30 opacity-60'
                                  : 'bg-novel-dark/60 hover:bg-novel-dark'
                              } group/chapter`}
                              onClick={(e) => {
                                e.stopPropagation()
                                if (ch.isRead) return
                                selectNovel(novelId)
                              }}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Zap
                                  className={`w-3 h-3 flex-shrink-0 ${
                                    ch.isRead ? 'text-novel-muted' : 'text-novel-feed'
                                  }`}
                                />
                                <span
                                  className={`truncate ${
                                    ch.isRead ? 'text-novel-muted line-through' : ''
                                  }`}
                                >
                                  {ch.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                <span className="text-novel-muted">
                                  {formatWordCount(ch.wordCount)}
                                </span>
                                <span className="text-novel-muted">·</span>
                                <span className="text-novel-muted">
                                  {formatTime(ch.publishTime)}
                                </span>
                              </div>
                            </div>
                          ))}
                          {chapters.length > 3 && (
                            <p className="text-xs text-novel-accent text-center py-1">
                              还有 {chapters.length - 3} 章更新...
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default UpdateRadar
