import React, { useState, useMemo } from 'react'
import { useStore } from '../store/StoreContext'
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  PRIORITY_COLORS,
  PriorityType,
  Note,
  Chapter,
} from '../types'
import { formatTime, formatWordCount, getFeedProgress } from '../lib/storage'
import {
  BookOpen,
  Star,
  DollarSign,
  Globe,
  Calendar,
  FileText,
  Pen,
  Trash2,
  Check,
  ChevronRight,
  Settings,
  Sparkles,
  Utensils,
  Eye,
  MessageSquare,
  Users,
  BookMarked,
  Edit3,
  X,
  Save,
  Hash,
  Zap,
  Plus,
  BookPlus,
} from 'lucide-react'

interface Props {
  onEditClick: () => void
  onAddChapterClick: (chapter?: number) => void
}

const NovelDetail: React.FC<Props> = ({ onEditClick, onAddChapterClick }) => {
  const {
    getSelectedNovel,
    getChaptersForNovel,
    getNotesForNovel,
    getUnreadForNovel,
    setPriority,
    markChapterRead,
    markNovelReadTo,
    addNote,
    updateNote,
    deleteNote,
  } = useStore()
  const novel = getSelectedNovel()
  const [tab, setTab] = useState<'chapters' | 'notes'>('chapters')
  const [newNoteType, setNewNoteType] = useState<'plot' | 'character' | 'general'>('general')
  const [newNoteContent, setNewNoteContent] = useState('')
  const [newNoteChapter, setNewNoteChapter] = useState<number | ''>('')
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [noteFilterChapter, setNoteFilterChapter] = useState<number | ''>('')
  const [quickNoteFor, setQuickNoteFor] = useState<Chapter | null>(null)

  const chapters = novel ? getChaptersForNovel(novel.id) : []
  const notes = novel ? getNotesForNovel(novel.id) : []
  const unreadCount = novel ? getUnreadForNovel(novel.id) : 0
  const feedProgress = novel ? getFeedProgress(novel, unreadCount) : null

  const unreadChapters = useMemo(() => {
    if (!novel) return []
    return chapters.filter((c) => c.chapterNumber > novel.lastReadChapter && !c.isRead)
  }, [chapters, novel])

  const filteredNotes = useMemo(() => {
    if (noteFilterChapter === '') return notes
    return notes.filter((n) => n.chapterNumber === noteFilterChapter)
  }, [notes, noteFilterChapter])

  const noteChapterOptions = useMemo(() => {
    const set = new Set<number>()
    notes.forEach((n) => n.chapterNumber && set.add(n.chapterNumber))
    return Array.from(set).sort((a, b) => b - a)
  }, [notes])

  if (!novel) {
    return (
      <div className="flex-1 flex items-center justify-center bg-novel-dark">
        <div className="text-center text-novel-muted">
          <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg">选择一本作品查看详情</p>
          <p className="text-sm mt-1">从左侧书架点击或在更新雷达中选择</p>
        </div>
      </div>
    )
  }

  const priorityOptions: {
    key: PriorityType
    label: string
    desc: string
    icon: React.ReactNode
  }[] = [
    { key: 'must', label: '必看', desc: '更新即弹窗提醒', icon: <Sparkles className="w-4 h-4" /> },
    { key: 'feed', label: '养肥', desc: `累计${novel.feedThreshold}章再提醒`, icon: <Utensils className="w-4 h-4" /> },
    { key: 'watch', label: '弃坑观察', desc: '低优先级静默监控', icon: <Eye className="w-4 h-4" /> },
    { key: 'none', label: '普通', desc: '仅在雷达显示更新', icon: <BookMarked className="w-4 h-4" /> },
  ]

  const handleSaveNote = () => {
    if (!newNoteContent.trim()) return
    addNote({
      novelId: novel.id,
      content: newNoteContent.trim(),
      type: newNoteType,
      chapterNumber: newNoteChapter === '' ? undefined : newNoteChapter,
    })
    setNewNoteContent('')
    setNewNoteChapter('')
  }

  const handleQuickNoteSave = () => {
    if (!quickNoteFor || !newNoteContent.trim()) return
    addNote({
      novelId: novel.id,
      content: newNoteContent.trim(),
      type: newNoteType,
      chapterNumber: quickNoteFor.chapterNumber,
    })
    setNewNoteContent('')
    setQuickNoteFor(null)
  }

  const noteTypeLabels: Record<
    Note['type'],
    { label: string; color: string; icon: React.ReactNode }
  > = {
    plot: { label: '剧情', color: '#7c5cff', icon: <Zap className="w-3 h-3" /> },
    character: { label: '角色', color: '#ff6b9d', icon: <Users className="w-3 h-3" /> },
    general: { label: '杂记', color: '#4ecdc4', icon: <MessageSquare className="w-3 h-3" /> },
  }

  return (
    <div className="flex-1 flex flex-col bg-novel-dark overflow-hidden">
      <div className="p-5 border-b border-novel-border bg-novel-card/30">
        <div className="flex items-start gap-5">
          <div
            className="w-24 h-32 rounded-xl flex items-center justify-center text-2xl font-bold flex-shrink-0 shadow-lg"
            style={{
              backgroundColor: `${CATEGORY_COLORS[novel.category]}33`,
              color: CATEGORY_COLORS[novel.category],
              border: `2px solid ${CATEGORY_COLORS[novel.category]}66`,
            }}
          >
            {novel.title.slice(0, 2)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-xl font-bold truncate">{novel.title}</h1>
                  <span
                    className="tag"
                    style={{
                      backgroundColor: `${CATEGORY_COLORS[novel.category]}22`,
                      color: CATEGORY_COLORS[novel.category],
                    }}
                  >
                    {CATEGORY_LABELS[novel.category]}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-wrap text-sm text-novel-muted mb-3">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {novel.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5" />
                    {novel.source}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    追更{formatTime(novel.createdAt)}
                  </span>
                </div>

                <div className="flex items-center gap-4 flex-wrap mb-3">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-novel-muted">期待值:</span>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < novel.expectation
                            ? 'text-novel-feed fill-novel-feed'
                            : 'text-novel-muted/30'
                        }`}
                      />
                    ))}
                  </div>
                  <div
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                      novel.isPaid
                        ? 'bg-novel-feed/20 text-novel-feed'
                        : 'bg-novel-muted/20 text-novel-muted'
                    }`}
                  >
                    <DollarSign className="w-3 h-3" />
                    {novel.isPaid ? '付费订阅' : '免费阅读'}
                  </div>
                  <div className="text-xs text-novel-muted">
                    已读到 <span className="text-novel-text font-medium">第{novel.lastReadChapter}章</span>
                    {novel.latestChapter && (
                      <>
                        {' · '}
                        最新 <span className="text-novel-accent font-medium">第{novel.latestChapter}章</span>
                      </>
                    )}
                    {unreadCount > 0 && (
                      <span className="ml-2 text-novel-must font-bold animate-pulse-slow">
                        未读{unreadCount}章
                      </span>
                    )}
                  </div>
                  {novel.totalWordCount && (
                    <div className="text-xs text-novel-muted">
                      总字数 <span className="text-novel-text">{formatWordCount(novel.totalWordCount)}</span>
                    </div>
                  )}
                </div>

                {novel.description && (
                  <p className="text-sm text-novel-muted leading-relaxed line-clamp-2 mb-3">
                    {novel.description}
                  </p>
                )}

                {novel.tags && novel.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap mb-3">
                    {novel.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 bg-novel-muted/10 text-novel-muted text-xs rounded-full border border-novel-border"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 flex-shrink-0">
                <button
                  onClick={onEditClick}
                  className="btn-ghost flex items-center gap-1.5"
                >
                  <Settings className="w-4 h-4" />
                  编辑作品
                </button>
                <button
                  onClick={() => onAddChapterClick()}
                  className="btn-primary text-xs flex items-center gap-1.5"
                >
                  <BookPlus className="w-3.5 h-3.5" />
                  录入新章节
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {priorityOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setPriority(novel.id, opt.key)}
                  className={`p-3 rounded-xl border text-left transition-all group ${
                    novel.priority === opt.key
                      ? 'border-2'
                      : 'border-novel-border hover:border-novel-muted/50 bg-novel-card/30'
                  }`}
                  style={{
                    borderColor:
                      novel.priority === opt.key ? PRIORITY_COLORS[opt.key] : undefined,
                    backgroundColor:
                      novel.priority === opt.key
                        ? `${PRIORITY_COLORS[opt.key]}18`
                        : undefined,
                  }}
                >
                  <div
                    className="flex items-center gap-1.5 mb-1 text-sm font-medium"
                    style={{ color: PRIORITY_COLORS[opt.key] }}
                  >
                    {opt.icon}
                    {opt.label}
                  </div>
                  <p className="text-xs text-novel-muted">{opt.desc}</p>

                  {opt.key === 'feed' && feedProgress && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-novel-muted">养肥进度</span>
                        <span
                          className={
                            feedProgress.ready
                              ? 'text-novel-feed font-bold animate-pulse-slow'
                              : 'text-novel-muted'
                          }
                        >
                          {feedProgress.current}/{feedProgress.threshold}
                          {feedProgress.ready && ' ✅可宰'}
                        </span>
                      </div>
                      <div className="h-1.5 bg-novel-dark rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(
                              100,
                              (feedProgress.current / feedProgress.threshold) * 100
                            )}%`,
                            backgroundColor: PRIORITY_COLORS.feed,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex border-b border-novel-border bg-novel-card/20">
          <button
            onClick={() => setTab('chapters')}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              tab === 'chapters'
                ? 'border-novel-accent text-novel-accent'
                : 'border-transparent text-novel-muted hover:text-novel-text'
            }`}
          >
            <FileText className="w-4 h-4" />
            章节列表
            {unreadCount > 0 && (
              <span className="bg-novel-must text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('notes')}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              tab === 'notes'
                ? 'border-novel-accent text-novel-accent'
                : 'border-transparent text-novel-muted hover:text-novel-text'
            }`}
          >
            <Pen className="w-4 h-4" />
            追更笔记
            {notes.length > 0 && (
              <span className="bg-novel-accent/30 text-novel-accent text-[10px] px-1.5 py-0.5 rounded-full">
                {notes.length}
              </span>
            )}
          </button>
          <div className="flex-1" />
          {tab === 'chapters' && unreadChapters.length > 0 && (
            <button
              onClick={() => {
                if (novel.latestChapter) markNovelReadTo(novel.id, novel.latestChapter)
              }}
              className="px-4 py-3 text-xs text-novel-muted hover:text-novel-accent flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              一键读完所有更新
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'chapters' ? (
            <div className="space-y-1">
              {chapters.length === 0 ? (
                <div className="text-center py-12 text-novel-muted">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>暂无章节记录</p>
                  <button
                    onClick={() => onAddChapterClick()}
                    className="mt-4 text-xs text-novel-accent hover:underline flex items-center gap-1 mx-auto"
                  >
                    <Plus className="w-3 h-3" />
                    录入第一章
                  </button>
                </div>
              ) : (
                chapters.map((ch) => {
                  const isUnread =
                    ch.chapterNumber > novel.lastReadChapter && !ch.isRead
                  const hasNote = notes.some((n) => n.chapterNumber === ch.chapterNumber)
                  const isQuickNote = quickNoteFor?.id === ch.id
                  return (
                    <div key={ch.id}>
                      <div
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          isUnread
                            ? 'bg-novel-accent/5 border-novel-accent/30 hover:bg-novel-accent/10'
                            : 'border-transparent hover:bg-white/5'
                        }`}
                      >
                        <button
                          onClick={() => markChapterRead(ch.id)}
                          disabled={ch.isRead}
                          className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            ch.isRead
                              ? 'bg-novel-muted/20 border-novel-muted/30 text-novel-muted'
                              : isUnread
                              ? 'border-novel-accent hover:bg-novel-accent text-white'
                              : 'border-novel-muted/30 hover:border-novel-muted text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-novel-muted font-mono">
                              <Hash className="w-3 h-3 inline -mt-0.5" />
                              {ch.chapterNumber}
                            </span>
                            <p
                              className={`text-sm font-medium truncate ${
                                isUnread ? '' : ch.isRead ? 'text-novel-muted line-through' : ''
                              }`}
                            >
                              {ch.title}
                            </p>
                            {isUnread && (
                              <span className="tag bg-novel-must/20 text-novel-must text-[10px]">
                                NEW
                              </span>
                            )}
                            {hasNote && (
                              <span className="tag bg-novel-accent/20 text-novel-accent text-[10px]">
                                📝 有笔记
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-novel-muted mt-1">
                            <span>{formatWordCount(ch.wordCount)}字</span>
                            <span>·</span>
                            <span>{formatTime(ch.publishTime)}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setQuickNoteFor(isQuickNote ? null : ch)
                            setNewNoteType('plot')
                            setNewNoteContent('')
                            if (!isQuickNote) setTab('notes')
                          }}
                          className={`p-2 rounded-lg flex-shrink-0 transition-colors ${
                            isQuickNote
                              ? 'bg-novel-accent/20 text-novel-accent'
                              : 'text-novel-muted hover:text-novel-accent hover:bg-white/5'
                          }`}
                          title="记笔记"
                        >
                          <Pen className="w-4 h-4" />
                        </button>

                        <ChevronRight className="w-4 h-4 text-novel-muted/50 flex-shrink-0" />
                      </div>

                      {isQuickNote && (
                        <div className="ml-9 mr-3 mb-2 p-3 bg-novel-card border border-novel-border rounded-xl -mt-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-novel-muted">
                              快速笔记 · 第{ch.chapterNumber}章
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mb-2">
                            {Object.entries(noteTypeLabels).map(([key, val]) => (
                              <button
                                key={key}
                                onClick={() => setNewNoteType(key as Note['type'])}
                                className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium transition-all ${
                                  newNoteType === key
                                    ? 'text-white'
                                    : 'bg-novel-dark text-novel-muted hover:text-novel-text'
                                }`}
                                style={{
                                  backgroundColor:
                                    newNoteType === key ? val.color : undefined,
                                }}
                              >
                                {val.icon}
                                {val.label}
                              </button>
                            ))}
                          </div>
                          <textarea
                            autoFocus
                            value={newNoteContent}
                            onChange={(e) => setNewNoteContent(e.target.value)}
                            placeholder="快速记录剧情进展或角色关系..."
                            className="w-full input-field min-h-[60px] resize-y text-sm mb-2"
                          />
                          <div className="flex justify-between items-center">
                            <button
                              onClick={() => setQuickNoteFor(null)}
                              className="text-xs text-novel-muted hover:text-novel-text"
                            >
                              取消
                            </button>
                            <button
                              onClick={handleQuickNoteSave}
                              disabled={!newNoteContent.trim()}
                              className="btn-primary text-xs flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Save className="w-3.5 h-3.5" />
                              保存笔记
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">新建笔记</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-novel-muted">关联章节:</span>
                    <select
                      value={newNoteChapter}
                      onChange={(e) =>
                        setNewNoteChapter(
                          e.target.value === '' ? '' : parseInt(e.target.value)
                        )
                      }
                      className="input-field text-xs py-1 px-2 w-28"
                    >
                      <option value="">不关联</option>
                      {chapters
                        .slice(0, 50)
                        .map((c) => (
                          <option key={c.id} value={c.chapterNumber}>
                            第{c.chapterNumber}章
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mb-3">
                  {Object.entries(noteTypeLabels).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={() => setNewNoteType(key as Note['type'])}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                        newNoteType === key
                          ? 'text-white'
                          : 'bg-novel-dark text-novel-muted hover:text-novel-text'
                      }`}
                      style={{
                        backgroundColor: newNoteType === key ? val.color : undefined,
                      }}
                    >
                      {val.icon}
                      {val.label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="写下剧情进展、角色关系或你的感想..."
                  className="w-full input-field min-h-[80px] resize-y mb-3 text-sm"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveNote}
                    disabled={!newNoteContent.trim()}
                    className="btn-primary text-sm flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    保存笔记
                  </button>
                </div>
              </div>

              {noteChapterOptions.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-novel-muted">按章节筛选:</span>
                  <button
                    onClick={() => setNoteFilterChapter('')}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                      noteFilterChapter === ''
                        ? 'bg-novel-accent text-white'
                        : 'bg-novel-dark text-novel-muted hover:text-novel-text'
                    }`}
                  >
                    全部
                  </button>
                  {noteChapterOptions.map((chNum) => (
                    <button
                      key={chNum}
                      onClick={() =>
                        setNoteFilterChapter(
                          noteFilterChapter === chNum ? '' : chNum
                        )
                      }
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                        noteFilterChapter === chNum
                          ? 'bg-novel-accent text-white'
                          : 'bg-novel-dark text-novel-muted hover:text-novel-text'
                      }`}
                    >
                      第{chNum}章
                    </button>
                  ))}
                </div>
              )}

              {filteredNotes.length === 0 ? (
                <div className="text-center py-12 text-novel-muted">
                  <Pen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>
                    {noteFilterChapter !== ''
                      ? '该章节暂无笔记'
                      : '还没有笔记，记录一下你的想法吧'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredNotes.map((note) => {
                    const isEditing = editingNoteId === note.id
                    const typeInfo = noteTypeLabels[note.type]
                    return (
                      <div key={note.id} className="card p-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="tag"
                              style={{
                                backgroundColor: `${typeInfo.color}22`,
                                color: typeInfo.color,
                              }}
                            >
                              {typeInfo.icon}
                              {typeInfo.label}
                            </span>
                            {note.chapterNumber && (
                              <span className="tag bg-novel-accent/15 text-novel-accent">
                                📖 第{note.chapterNumber}章
                              </span>
                            )}
                            <span className="text-xs text-novel-muted">
                              {formatTime(note.updatedAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => {
                                    if (!editContent.trim()) return
                                    updateNote({ ...note, content: editContent.trim() })
                                    setEditingNoteId(null)
                                  }}
                                  className="p-1.5 hover:bg-novel-accent/20 text-novel-accent rounded-lg"
                                  title="保存"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setEditingNoteId(null)}
                                  className="p-1.5 hover:bg-white/10 text-novel-muted rounded-lg"
                                  title="取消"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingNoteId(note.id)
                                    setEditContent(note.content)
                                  }}
                                  className="p-1.5 hover:bg-white/10 text-novel-muted hover:text-novel-text rounded-lg"
                                  title="编辑"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteNote(note.id)}
                                  className="p-1.5 hover:bg-novel-must/20 text-novel-muted hover:text-novel-must rounded-lg"
                                  title="删除"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        {isEditing ? (
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full input-field min-h-[80px] resize-y text-sm"
                          />
                        ) : (
                          <p className="text-sm text-novel-text whitespace-pre-wrap leading-relaxed">
                            {note.content}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default NovelDetail
