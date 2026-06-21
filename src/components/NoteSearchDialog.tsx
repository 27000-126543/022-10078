import React, { useState, useMemo } from 'react'
import { useStore } from '../store/StoreContext'
import { Note } from '../types'
import { PRIORITY_COLORS, CATEGORY_COLORS } from '../types'
import { formatTime } from '../lib/storage'
import {
  Search,
  X,
  Hash,
  Zap,
  Users,
  MessageSquare,
  BookOpen,
  ChevronRight,
  Filter,
  ListFilter,
} from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
}

const NoteSearchDialog: React.FC<Props> = ({ open, onClose }) => {
  const { getAllNotes, getAllNovels, selectNovel } = useStore()
  const [keyword, setKeyword] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | Note['type']>('all')
  const [minChapter, setMinChapter] = useState<number | ''>('')
  const [maxChapter, setMaxChapter] = useState<number | ''>('')

  const allNotes = getAllNotes()
  const allNovels = getAllNovels()

  const novelMap = useMemo(() => {
    const m: Record<string, (typeof allNovels)[0]> = {}
    for (const n of allNovels) m[n.id] = n
    return m
  }, [allNovels])

  const filteredNotes = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return allNotes.filter((note) => {
      if (kw && !note.content.toLowerCase().includes(kw)) return false
      if (typeFilter !== 'all' && note.type !== typeFilter) return false
      if (minChapter !== '' && (!note.chapterNumber || note.chapterNumber < minChapter))
        return false
      if (maxChapter !== '' && (!note.chapterNumber || note.chapterNumber > maxChapter))
        return false
      return true
    })
  }, [allNotes, keyword, typeFilter, minChapter, maxChapter])

  const noteTypeLabels: Record<
    Note['type'],
    { label: string; color: string; icon: React.ReactNode }
  > = {
    plot: { label: '剧情', color: '#7c5cff', icon: <Zap className="w-3 h-3" /> },
    character: { label: '角色', color: '#ff6b9d', icon: <Users className="w-3 h-3" /> },
    general: { label: '杂记', color: '#4ecdc4', icon: <MessageSquare className="w-3 h-3" /> },
  }

  const handleJumpToNote = (note: Note) => {
    selectNovel(note.novelId)
    onClose()
  }

  if (!open) return null

  const hasFilters =
    typeFilter !== 'all' || minChapter !== '' || maxChapter !== '' || keyword.trim() !== ''

  const clearFilters = () => {
    setKeyword('')
    setTypeFilter('all')
    setMinChapter('')
    setMaxChapter('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[85vh] bg-novel-card border border-novel-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-novel-border">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Search className="w-5 h-5 text-novel-accent" />
              追更笔记检索
            </h2>
            <span className="text-xs text-novel-muted">
              共 {allNotes.length} 条笔记 · 匹配 {filteredNotes.length} 条
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg text-novel-muted hover:text-novel-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-novel-border bg-novel-dark/40">
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-novel-muted" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索笔记内容关键词..."
              className="w-full input-field pl-9"
              autoFocus
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-novel-muted flex items-center gap-1">
                <Filter className="w-3 h-3" />
                类型:
              </span>
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-2 py-1 rounded-full text-[11px] font-medium transition-all ${
                  typeFilter === 'all'
                    ? 'bg-novel-accent text-white'
                    : 'bg-novel-dark text-novel-muted hover:text-novel-text'
                }`}
              >
                全部
              </button>
              {Object.entries(noteTypeLabels).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() =>
                    setTypeFilter(typeFilter === key ? 'all' : (key as Note['type']))
                  }
                  className={`px-2 py-1 rounded-full text-[11px] font-medium transition-all flex items-center gap-1 ${
                    typeFilter === key
                      ? 'text-white'
                      : 'bg-novel-dark text-novel-muted hover:text-novel-text'
                  }`}
                  style={{
                    backgroundColor: typeFilter === key ? val.color : undefined,
                  }}
                >
                  {val.icon}
                  {val.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-novel-muted flex items-center gap-1">
                <Hash className="w-3 h-3" />
                章节:
              </span>
              <input
                type="number"
                min={1}
                value={minChapter}
                onChange={(e) =>
                  setMinChapter(e.target.value === '' ? '' : parseInt(e.target.value) || '')
                }
                placeholder="最小"
                className="w-16 input-field text-xs py-1.5"
              />
              <span className="text-novel-muted text-xs">~</span>
              <input
                type="number"
                min={1}
                value={maxChapter}
                onChange={(e) =>
                  setMaxChapter(e.target.value === '' ? '' : parseInt(e.target.value) || '')
                }
                placeholder="最大"
                className="w-16 input-field text-xs py-1.5"
              />
            </div>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-novel-muted hover:text-novel-accent ml-auto flex items-center gap-1"
              >
                <ListFilter className="w-3 h-3" />
                清除筛选
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-novel-muted">
              <BookOpen className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">
                {hasFilters ? '没有找到匹配的笔记' : '还没有任何笔记记录'}
              </p>
              <p className="text-xs mt-1">
                {hasFilters ? '试试调整筛选条件或关键词' : '在作品详情页可以记录追更笔记'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredNotes.map((note) => {
                const novel = novelMap[note.novelId]
                if (!novel) return null
                const typeInfo = noteTypeLabels[note.type]

                return (
                  <div
                    key={note.id}
                    className="p-3 rounded-xl bg-novel-dark/60 border border-novel-border hover:border-novel-accent/40 transition-all cursor-pointer group"
                    onClick={() => handleJumpToNote(note)}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0"
                          style={{
                            backgroundColor: `${CATEGORY_COLORS[novel.category]}22`,
                            color: CATEGORY_COLORS[novel.category],
                          }}
                        >
                          {novel.title.slice(0, 6)}
                        </span>
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-0.5 flex-shrink-0"
                          style={{
                            backgroundColor: `${typeInfo.color}22`,
                            color: typeInfo.color,
                          }}
                        >
                          {typeInfo.icon}
                          {typeInfo.label}
                        </span>
                        {note.chapterNumber && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-novel-accent/20 text-novel-accent flex-shrink-0">
                            第{note.chapterNumber}章
                          </span>
                        )}
                        {novel.priority !== 'none' && (
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0"
                            style={{
                              backgroundColor: `${PRIORITY_COLORS[novel.priority]}22`,
                              color: PRIORITY_COLORS[novel.priority],
                            }}
                          >
                            {novel.priority === 'must' ? '必看' : novel.priority === 'feed' ? '养肥' : '观察'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] text-novel-muted">
                          {formatTime(note.updatedAt)}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-novel-muted/50 group-hover:text-novel-accent transition-colors" />
                      </div>
                    </div>
                    <p className="text-sm text-novel-text line-clamp-2 leading-relaxed">
                      {note.content}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-novel-border bg-novel-dark/30 flex items-center justify-between">
          <p className="text-xs text-novel-muted">
            提示：点击笔记可跳转到对应作品详情页
          </p>
          <button
            onClick={onClose}
            className="btn-ghost text-xs"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}

export default NoteSearchDialog
