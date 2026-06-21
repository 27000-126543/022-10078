import React, { useMemo, useState } from 'react'
import { useStore } from '../store/StoreContext'
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  CategoryType,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  PriorityType,
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
  Globe,
  Sparkles,
  Utensils,
  BookMarked,
  X,
  BarChart3,
} from 'lucide-react'

type SortType = 'time' | 'words'
type FilterCat = 'all' | CategoryType
type FilterSource = 'all' | string
type FilterPriority = 'all' | PriorityType

interface Props {
  expanded: boolean
  onToggleExpanded: (v: boolean) => void
}

const UpdateRadar: React.FC<Props> = ({ expanded, onToggleExpanded }) => {
  const { state, selectNovel, markNovelReadTo, getUnreadForNovel, batchMarkRead } = useStore()
  const [sortBy, setSortBy] = useState<SortType>('time')
  const [filterCat, setFilterCat] = useState<FilterCat>('all')
  const [filterSource, setFilterSource] = useState<FilterSource>('all')
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('all')
  const [wordFilter, setWordFilter] = useState({ min: 0, max: 99999999 })
  const [onlyUnread, setOnlyUnread] = useState(false)
  const [hideWatch, setHideWatch] = useState(false)
  const [showRecap, setShowRecap] = useState(false)

  const recentChapters = useMemo(() => getRecentChapters(state.chapters, 24), [state.chapters])

  const weeklyChapters = useMemo(
    () => state.chapters.filter((c) => c.publishTime > Date.now() - 7 * 24 * 60 * 60 * 1000),
    [state.chapters]
  )

  const novelMap = useMemo(() => {
    const m: Record<string, Novel> = {}
    for (const n of state.novels) m[n.id] = n
    return m
  }, [state.novels])

  const sourceOptions = useMemo(() => {
    const set = new Set<string>()
    for (const n of state.novels) set.add(n.source)
    return Array.from(set).sort()
  }, [state.novels])

  const recapStats = useMemo(() => {
    const bySource: Record<string, { newCount: number; readCount: number }> = {}
    const byCategory: Record<string, { newCount: number; readCount: number }> = {}
    const byPriority: Record<string, { newCount: number; readCount: number }> = {}

    for (const ch of weeklyChapters) {
      const novel = novelMap[ch.novelId]
      if (!novel) continue

      if (!bySource[novel.source]) bySource[novel.source] = { newCount: 0, readCount: 0 }
      bySource[novel.source].newCount++
      if (ch.isRead) bySource[novel.source].readCount++

      if (!byCategory[novel.category]) byCategory[novel.category] = { newCount: 0, readCount: 0 }
      byCategory[novel.category].newCount++
      if (ch.isRead) byCategory[novel.category].readCount++

      if (!byPriority[novel.priority]) byPriority[novel.priority] = { newCount: 0, readCount: 0 }
      byPriority[novel.priority].newCount++
      if (ch.isRead) byPriority[novel.priority].readCount++
    }

    return { bySource, byCategory, byPriority }
  }, [weeklyChapters, novelMap])

  const filteredChapters = useMemo(() => {
    let list = recentChapters.filter((c) => {
      const novel = novelMap[c.novelId]
      if (!novel) return false
      if (hideWatch && novel.priority === 'watch') return false
      if (onlyUnread && c.isRead) return false
      if (filterPriority !== 'all' && novel.priority !== filterPriority) return false
      if (filterSource !== 'all' && novel.source !== filterSource) return false
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
  }, [
    recentChapters,
    sortBy,
    filterCat,
    filterSource,
    filterPriority,
    wordFilter,
    onlyUnread,
    hideWatch,
    novelMap,
  ])

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

  const priorityOptions: { key: FilterPriority; label: string; color: string; icon: React.ReactNode }[] = [
    { key: 'all', label: '全部', color: '#8b8fa3', icon: <ListFilter className="w-3.5 h-3.5" /> },
    { key: 'must', label: '必看', color: PRIORITY_COLORS.must, icon: <Sparkles className="w-3.5 h-3.5" /> },
    { key: 'feed', label: '养肥', color: PRIORITY_COLORS.feed, icon: <Utensils className="w-3.5 h-3.5" /> },
    { key: 'watch', label: '观察', color: PRIORITY_COLORS.watch, icon: <Eye className="w-3.5 h-3.5" /> },
    { key: 'none', label: '普通', color: PRIORITY_COLORS.none, icon: <BookMarked className="w-3.5 h-3.5" /> },
  ]

  const handleMarkAllRead = () => {
    batchMarkRead(filteredChapters.map((c) => c.id))
  }

  const handleMarkNovelRead = (novelId: string, latestChapter?: number) => {
    if (latestChapter) {
      markNovelReadTo(novelId, latestChapter)
    }
  }

  const hasActiveFilters =
    filterSource !== 'all' ||
    filterPriority !== 'all' ||
    filterCat !== 'all' ||
    onlyUnread ||
    hideWatch ||
    currentWfIdx !== 0

  const clearAllFilters = () => {
    setFilterSource('all')
    setFilterPriority('all')
    setFilterCat('all')
    setOnlyUnread(false)
    setHideWatch(false)
    setWordFilter({ min: 0, max: 99999999 })
  }

  const handleRecapClick = (type: 'source' | 'category' | 'priority', value: string) => {
    if (type === 'source') setFilterSource(value)
    else if (type === 'category') setFilterCat(value as CategoryType)
    else if (type === 'priority') setFilterPriority(value as PriorityType)
    setShowRecap(false)
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
                {hasActiveFilters && (
                  <span className="text-novel-feed ml-1">（已筛选）</span>
                )}
              </span>
            </div>
            <p className="text-xs text-novel-muted mt-0.5">
              实时监控追更列表，支持来源+优先级组合筛选
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
            onClick={() => setShowRecap(!showRecap)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showRecap
                ? 'bg-novel-accent/20 text-novel-accent'
                : 'text-novel-muted hover:text-novel-text hover:bg-white/5'
            }`}
            title="本周复盘"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            复盘
          </button>

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

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-novel-muted hover:text-novel-text hover:bg-white/5 transition-all"
              title="清除所有筛选"
            >
              <X className="w-3.5 h-3.5" />
              清除筛选
            </button>
          )}

          {totalNovels > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 px-3 py-1.5 bg-novel-feed/20 text-novel-feed rounded-lg text-xs font-medium hover:bg-novel-feed/30 transition-colors"
              title="将当前筛选结果全部标记已读"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              批量标读
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
            <div className="flex items-center gap-1">
              <span className="text-xs text-novel-muted mr-1 flex-shrink-0">来源:</span>
              <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1" style={{ scrollbarWidth: 'thin' }}>
                <button
                  onClick={() => setFilterSource('all')}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex-shrink-0 ${
                    filterSource === 'all'
                      ? 'text-white'
                      : 'bg-novel-dark text-novel-muted hover:text-novel-text'
                  }`}
                  style={{
                    backgroundColor: filterSource === 'all' ? '#8b8fa3' : undefined,
                  }}
                >
                  全部
                </button>
                {sourceOptions.map((src) => (
                  <button
                    key={src}
                    onClick={() => setFilterSource(filterSource === src ? 'all' : src)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 flex-shrink-0 ${
                      filterSource === src
                        ? 'text-white'
                        : 'bg-novel-dark text-novel-muted hover:text-novel-text'
                    }`}
                    style={{
                      backgroundColor: filterSource === src ? CATEGORY_COLORS.xuanyi : undefined,
                    }}
                    title={src}
                  >
                    <Globe className="w-3 h-3" />
                    {src.length > 4 ? src.slice(0, 4) + '…' : src}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-xs text-novel-muted mr-1">优先级:</span>
              {priorityOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() =>
                    setFilterPriority(filterPriority === opt.key ? 'all' : opt.key)
                  }
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                    filterPriority === opt.key
                      ? 'text-white'
                      : 'bg-novel-dark text-novel-muted hover:text-novel-text'
                  }`}
                  style={{
                    backgroundColor: filterPriority === opt.key ? opt.color : undefined,
                  }}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

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

          {showRecap && (
            <div className="mb-3 p-4 bg-novel-dark/60 border border-novel-accent/20 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-novel-accent" />
                  本周复盘
                  <span className="text-xs text-novel-muted font-normal">
                    （近7天 · {weeklyChapters.length}章更新）
                  </span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-novel-card/80 rounded-lg p-3">
                  <p className="text-xs font-semibold text-novel-muted mb-2 flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    来源站点
                  </p>
                  <div className="space-y-1.5">
                    {Object.entries(recapStats.bySource)
                      .sort((a, b) => b[1].newCount - a[1].newCount)
                      .map(([src, stats]) => (
                        <button
                          key={src}
                          onClick={() => handleRecapClick('source', src)}
                          className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors text-left"
                        >
                          <span className="text-xs truncate flex-1 mr-2">{src}</span>
                          <span className="text-xs flex items-center gap-2 flex-shrink-0">
                            <span className="text-novel-accent">{stats.newCount}章</span>
                            <span className="text-novel-muted">/</span>
                            <span className="text-novel-feed">{stats.readCount}已读</span>
                          </span>
                        </button>
                      ))}
                  </div>
                </div>

                <div className="bg-novel-card/80 rounded-lg p-3">
                  <p className="text-xs font-semibold text-novel-muted mb-2">分类</p>
                  <div className="space-y-1.5">
                    {Object.entries(recapStats.byCategory)
                      .sort((a, b) => b[1].newCount - a[1].newCount)
                      .map(([cat, stats]) => (
                        <button
                          key={cat}
                          onClick={() => handleRecapClick('category', cat)}
                          className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors text-left"
                        >
                          <span
                            className="text-xs font-medium flex items-center gap-1.5"
                            style={{ color: CATEGORY_COLORS[cat as CategoryType] }}
                          >
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: CATEGORY_COLORS[cat as CategoryType] }}
                            />
                            {CATEGORY_LABELS[cat as CategoryType]}
                          </span>
                          <span className="text-xs flex items-center gap-2 flex-shrink-0">
                            <span className="text-novel-accent">{stats.newCount}章</span>
                            <span className="text-novel-muted">/</span>
                            <span className="text-novel-feed">{stats.readCount}已读</span>
                          </span>
                        </button>
                      ))}
                  </div>
                </div>

                <div className="bg-novel-card/80 rounded-lg p-3">
                  <p className="text-xs font-semibold text-novel-muted mb-2">优先级</p>
                  <div className="space-y-1.5">
                    {Object.entries(recapStats.byPriority)
                      .sort((a, b) => b[1].newCount - a[1].newCount)
                      .map(([pri, stats]) => (
                        <button
                          key={pri}
                          onClick={() => handleRecapClick('priority', pri)}
                          className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors text-left"
                        >
                          <span
                            className="text-xs font-medium flex items-center gap-1.5"
                            style={{ color: PRIORITY_COLORS[pri as PriorityType] }}
                          >
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: PRIORITY_COLORS[pri as PriorityType] }}
                            />
                            {PRIORITY_LABELS[pri as PriorityType]}
                          </span>
                          <span className="text-xs flex items-center gap-2 flex-shrink-0">
                            <span className="text-novel-accent">{stats.newCount}章</span>
                            <span className="text-novel-muted">/</span>
                            <span className="text-novel-feed">{stats.readCount}已读</span>
                          </span>
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {hasActiveFilters && (
            <div className="mb-3 p-2 px-3 bg-novel-accent/10 border border-novel-accent/30 rounded-lg text-xs flex items-center gap-2">
              <ListFilter className="w-3.5 h-3.5 text-novel-accent" />
              <span className="text-novel-muted">当前筛选：</span>
              {filterSource !== 'all' && (
                <span className="tag bg-novel-dark text-novel-text">{filterSource}</span>
              )}
              {filterPriority !== 'all' && (
                <span
                  className="tag"
                  style={{
                    backgroundColor: `${PRIORITY_COLORS[filterPriority]}22`,
                    color: PRIORITY_COLORS[filterPriority],
                  }}
                >
                  {PRIORITY_LABELS[filterPriority]}
                </span>
              )}
              {filterCat !== 'all' && (
                <span
                  className="tag"
                  style={{
                    backgroundColor: `${CATEGORY_COLORS[filterCat]}22`,
                    color: CATEGORY_COLORS[filterCat],
                  }}
                >
                  {CATEGORY_LABELS[filterCat]}
                </span>
              )}
              {onlyUnread && <span className="tag bg-novel-accent/20 text-novel-accent">只看未读</span>}
              {hideWatch && <span className="tag bg-novel-watch/20 text-novel-watch">隐藏观察</span>}
              {currentWfIdx !== 0 && (
                <span className="tag bg-novel-dark text-novel-text">{wordPresets[currentWfIdx].label}</span>
              )}
              <span className="text-novel-accent font-medium ml-auto">
                共 {totalNew} 章 · {totalNovels} 部作品
              </span>
            </div>
          )}

          {filteredChapters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-novel-muted">
              <Radar className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">
                {hasActiveFilters
                  ? '当前筛选条件下无更新，请调整筛选条件'
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
                          <span
                            className="tag flex-shrink-0 text-[10px]"
                            style={{
                              backgroundColor: `${CATEGORY_COLORS[novel.category]}22`,
                              color: CATEGORY_COLORS[novel.category],
                            }}
                          >
                            {CATEGORY_LABELS[novel.category]}
                          </span>
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
