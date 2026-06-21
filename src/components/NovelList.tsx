import React, { useMemo, useState } from 'react'
import { useStore } from '../store/StoreContext'
import { CATEGORY_LABELS, CATEGORY_COLORS, CategoryType, PRIORITY_COLORS, PRIORITY_LABELS } from '../types'
import { getNovelsByCategory } from '../lib/storage'
import { Book, ChevronDown, ChevronRight, Search, Plus, Star, Filter, X } from 'lucide-react'

interface Props {
  onAddClick: () => void
}

type FilterPriority = 'all' | 'must' | 'feed' | 'watch' | 'none'

const NovelList: React.FC<Props> = ({ onAddClick }) => {
  const { state, selectNovel, getUnreadForNovel } = useStore()
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Record<CategoryType, boolean>>({
    xuanhuan: true,
    yanqing: true,
    xuanyi: true,
    tongren: true,
    qita: true,
  })
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>('all')
  const [showFilters, setShowFilters] = useState(false)

  const novelsByCategory = useMemo(() => getNovelsByCategory(state.novels), [state.novels])

  const filteredNovels = useMemo(() => {
    const result: Record<string, typeof state.novels> = {}
    for (const cat of Object.keys(novelsByCategory) as CategoryType[]) {
      result[cat] = novelsByCategory[cat].filter((n) => {
        const matchesSearch =
          search.trim() === '' ||
          n.title.toLowerCase().includes(search.toLowerCase()) ||
          n.author.toLowerCase().includes(search.toLowerCase())
        const matchesPriority = priorityFilter === 'all' || n.priority === priorityFilter
        return matchesSearch && matchesPriority
      })
    }
    return result as Record<CategoryType, typeof state.novels>
  }, [novelsByCategory, search, priorityFilter])

  const toggleCategory = (cat: CategoryType) => {
    setExpanded((prev) => ({ ...prev, [cat]: !prev[cat] }))
  }

  const totalUnread = state.novels.reduce((sum, n) => sum + getUnreadForNovel(n.id), 0)
  const mustCount = state.novels.filter((n) => n.priority === 'must').length
  const feedCount = state.novels.filter((n) => n.priority === 'feed').length
  const watchCount = state.novels.filter((n) => n.priority === 'watch').length

  const priorityFilters: { key: FilterPriority; label: string; count: number; color: string }[] = [
    { key: 'all', label: '全部', count: state.novels.length, color: '#8b8fa3' },
    { key: 'must', label: '必看', count: mustCount, color: PRIORITY_COLORS.must },
    { key: 'feed', label: '养肥', count: feedCount, color: PRIORITY_COLORS.feed },
    { key: 'watch', label: '观察', count: watchCount, color: PRIORITY_COLORS.watch },
    { key: 'none', label: '普通', count: state.novels.length - mustCount - feedCount - watchCount, color: PRIORITY_COLORS.none },
  ]

  return (
    <div className="flex flex-col h-full bg-novel-card border-r border-novel-border w-80 flex-shrink-0">
      <div className="p-4 border-b border-novel-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Book className="w-5 h-5 text-novel-accent" />
            <h1 className="text-lg font-bold">追更书架</h1>
            <span className="text-xs text-novel-muted">
              {state.novels.length}本 · 未读{totalUnread}章
            </span>
          </div>
          <button
            onClick={onAddClick}
            className="p-2 bg-novel-accent hover:bg-opacity-90 rounded-lg transition-colors"
            title="添加作品"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-novel-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索书名、作者..."
            className="w-full input-field pl-9 pr-8 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded"
            >
              <X className="w-3 h-3 text-novel-muted" />
            </button>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 text-xs text-novel-muted hover:text-novel-text"
            >
              <Filter className="w-3 h-3" />
              <span>优先级筛选</span>
              {showFilters ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
          </div>
          {showFilters && (
            <div className="flex flex-wrap gap-1.5">
              {priorityFilters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setPriorityFilter(priorityFilter === f.key ? 'all' : f.key)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    priorityFilter === f.key
                      ? 'text-white'
                      : 'bg-novel-dark text-novel-muted hover:text-novel-text'
                  }`}
                  style={{
                    backgroundColor: priorityFilter === f.key ? f.color : undefined,
                  }}
                >
                  {f.label}
                  <span className="ml-1 opacity-75">{f.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {(Object.keys(CATEGORY_LABELS) as CategoryType[]).map((cat) => {
          const novels = filteredNovels[cat]
          if (novels.length === 0) return null
          const catTotalUnread = novels.reduce((s, n) => s + getUnreadForNovel(n.id), 0)
          return (
            <div key={cat} className="rounded-lg overflow-hidden">
              <button
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors text-left"
              >
                {expanded[cat] ? (
                  <ChevronDown className="w-4 h-4 text-novel-muted flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-novel-muted flex-shrink-0" />
                )}
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                />
                <span className="text-sm font-medium flex-1">
                  {CATEGORY_LABELS[cat]}
                </span>
                <span className="text-xs text-novel-muted">
                  {novels.length}本
                  {catTotalUnread > 0 && (
                    <span className="ml-1 text-novel-must font-medium">
                      {catTotalUnread}新
                    </span>
                  )}
                </span>
              </button>
              {expanded[cat] && (
                <div className="ml-2 space-y-0.5 border-l border-novel-border pl-2">
                  {novels.map((novel) => {
                    const unread = getUnreadForNovel(novel.id)
                    const isSelected = state.selectedNovelId === novel.id
                    return (
                      <button
                        key={novel.id}
                        onClick={() => selectNovel(novel.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-all group ${
                          isSelected
                            ? 'bg-novel-accent/20 border border-novel-accent/40'
                            : 'hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div
                            className="w-8 h-11 rounded flex-shrink-0 flex items-center justify-center text-xs font-bold"
                            style={{
                              backgroundColor: `${CATEGORY_COLORS[novel.category]}22`,
                              color: CATEGORY_COLORS[novel.category],
                            }}
                          >
                            {novel.title.slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p
                                className={`text-sm font-medium truncate ${
                                  isSelected ? 'text-novel-accent' : ''
                                }`}
                                title={novel.title}
                              >
                                {novel.title}
                              </p>
                              {novel.isPaid && (
                                <span className="flex-shrink-0 text-[10px] px-1 py-0.5 bg-novel-feed/20 text-novel-feed rounded">
                                  VIP
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-novel-muted truncate mt-0.5">
                              {novel.author}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              {novel.priority !== 'none' && (
                                <span
                                  className="tag"
                                  style={{
                                    backgroundColor: `${PRIORITY_COLORS[novel.priority]}22`,
                                    color: PRIORITY_COLORS[novel.priority],
                                  }}
                                >
                                  {PRIORITY_LABELS[novel.priority]}
                                </span>
                              )}
                              <span className="flex items-center gap-0.5 text-[10px] text-novel-muted">
                                <Star className="w-2.5 h-2.5 text-novel-feed" />
                                {novel.expectation}
                              </span>
                              {unread > 0 && (
                                <span className="tag bg-novel-must text-white animate-pulse-slow">
                                  +{unread}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default NovelList
