import React, { useMemo, useState } from 'react'
import { useStore } from '../store/StoreContext'
import { Novel, Chapter } from '../types'
import { CATEGORY_COLORS, CATEGORY_LABELS, PRIORITY_COLORS } from '../types'
import { formatWordCount, getUnreadCountByNovelId } from '../lib/storage'
import { Sparkles, X, ChevronRight, Bell, Utensils, Check } from 'lucide-react'

interface MustReadAlert {
  novel: Novel
  unreadChapters: Chapter[]
}

const PriorityAlert: React.FC = () => {
  const {
    state,
    selectNovel,
    markNovelReadTo,
    dismissMustAlert,
    dismissFeedAlert,
    getChaptersForNovel,
  } = useStore()
  const [currentIndex, setCurrentIndex] = useState(0)

  const allAlerts = useMemo(() => {
    const mustAlerts: MustReadAlert[] = []
    const feedAlerts: MustReadAlert[] = []

    for (const novel of state.novels) {
      const totalUnread = getUnreadCountByNovelId(
        state.chapters,
        novel.id,
        novel.lastReadChapter
      )

      if (totalUnread === 0) continue

      if (novel.priority === 'must') {
        if (state.dismissedMustAlerts.includes(novel.id)) continue
        const chapters = getChaptersForNovel(novel.id).filter(
          (c) => c.chapterNumber > novel.lastReadChapter && !c.isRead
        )
        if (chapters.length > 0) {
          mustAlerts.push({ novel, unreadChapters: chapters })
        }
      } else if (novel.priority === 'feed') {
        if (totalUnread < novel.feedThreshold) continue
        const lastDismissed = state.dismissedFeedAlerts[novel.id]
        if (lastDismissed !== undefined && totalUnread <= lastDismissed) continue

        const chapters = getChaptersForNovel(novel.id).filter(
          (c) => c.chapterNumber > novel.lastReadChapter && !c.isRead
        )
        if (chapters.length > 0) {
          feedAlerts.push({ novel, unreadChapters: chapters })
        }
      }
    }

    return [...mustAlerts, ...feedAlerts]
  }, [state, getChaptersForNovel])

  const currentAlert = allAlerts[currentIndex]

  if (!currentAlert) return null

  const { novel, unreadChapters } = currentAlert
  const isMust = novel.priority === 'must'
  const iconColor = PRIORITY_COLORS[novel.priority]
  const totalUnread = unreadChapters.length

  const dismissCurrent = () => {
    if (isMust) {
      dismissMustAlert(novel.id)
    } else {
      dismissFeedAlert(novel.id, totalUnread)
    }
    if (currentIndex < allAlerts.length - 1) {
      setCurrentIndex((i) => Math.min(i, allAlerts.length - 2))
    }
  }

  const next = () => {
    if (currentIndex < allAlerts.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const dismissAll = () => {
    for (const a of allAlerts) {
      if (a.novel.priority === 'must') {
        dismissMustAlert(a.novel.id)
      } else {
        const count = a.unreadChapters.length
        dismissFeedAlert(a.novel.id, count)
      }
    }
  }

  const goToNovel = () => {
    selectNovel(novel.id)
    dismissCurrent()
  }

  const markAllRead = () => {
    if (novel.latestChapter) {
      markNovelReadTo(novel.id, novel.latestChapter)
    }
    dismissCurrent()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-lg bg-novel-card border-2 rounded-2xl shadow-2xl overflow-hidden"
        style={{ borderColor: iconColor }}
      >
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{
            background: `linear-gradient(90deg, ${iconColor}33 0%, transparent 100%)`,
            borderBottom: `1px solid ${iconColor}44`,
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: iconColor }}
            >
              {isMust ? (
                <Sparkles className="w-4 h-4 text-white" />
              ) : (
                <Utensils className="w-4 h-4 text-white" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm" style={{ color: iconColor }}>
                {isMust ? '必看作品更新提醒' : '养肥作品已成熟'}
              </h3>
              <p className="text-[11px] text-novel-muted">
                {currentIndex + 1} / {allAlerts.length} 条提醒
              </p>
            </div>
          </div>
          <button
            onClick={dismissAll}
            className="p-2 hover:bg-white/10 rounded-lg text-novel-muted hover:text-novel-text"
            title="全部关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <div className="flex items-start gap-4 mb-4">
            <div
              className="w-16 h-20 rounded-xl flex items-center justify-center text-xl font-bold flex-shrink-0"
              style={{
                backgroundColor: `${CATEGORY_COLORS[novel.category]}33`,
                color: CATEGORY_COLORS[novel.category],
                border: `2px solid ${CATEGORY_COLORS[novel.category]}66`,
              }}
            >
              {novel.title.slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-lg font-bold mb-1 truncate">{novel.title}</h4>
              <div className="flex items-center gap-2 text-xs text-novel-muted mb-2">
                <span>{novel.author}</span>
                <span>·</span>
                <span
                  className="px-1.5 py-0.5 rounded text-[10px]"
                  style={{
                    backgroundColor: `${CATEGORY_COLORS[novel.category]}22`,
                    color: CATEGORY_COLORS[novel.category],
                  }}
                >
                  {CATEGORY_LABELS[novel.category]}
                </span>
                <span>·</span>
                <span>{novel.source}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                  style={{ backgroundColor: `${iconColor}18`, color: iconColor }}
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span className="font-bold">{totalUnread}章未读</span>
                </div>
                {!isMust && (
                  <div className="text-xs text-novel-muted">
                    阈值 {novel.feedThreshold}章 ·{' '}
                    <span className="text-novel-feed font-bold">可宰了</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1 mb-4 pr-1">
            {unreadChapters.slice(0, 8).map((ch) => (
              <div
                key={ch.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-novel-dark/60 text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-novel-muted font-mono text-xs w-10 flex-shrink-0">
                    #{ch.chapterNumber}
                  </span>
                  <span className="truncate">{ch.title}</span>
                </div>
                <span className="text-xs text-novel-muted flex-shrink-0 ml-2">
                  {formatWordCount(ch.wordCount)}
                </span>
              </div>
            ))}
            {unreadChapters.length > 8 && (
              <p className="text-center text-xs text-novel-muted py-1">
                ...还有 {unreadChapters.length - 8} 章
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={dismissCurrent}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm text-novel-muted bg-novel-dark hover:bg-white/5 hover:text-novel-text transition-colors"
            >
              稍后再看
            </button>
            <button
              onClick={markAllRead}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-novel-muted/20 text-novel-text hover:bg-novel-muted/30 transition-colors flex items-center justify-center gap-1"
            >
              <Check className="w-4 h-4" />
              全部已读
            </button>
            <button
              onClick={goToNovel}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white font-medium flex items-center justify-center gap-1 transition-all hover:brightness-110"
              style={{ backgroundColor: iconColor }}
            >
              立即阅读
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {allAlerts.length > 1 && (
          <div className="px-5 pb-4 flex items-center justify-center gap-1.5">
            {allAlerts.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentIndex ? 'w-6' : 'w-1.5'
                }`}
                style={{
                  backgroundColor: i === currentIndex ? iconColor : '#3a3e4b',
                }}
              />
            ))}
            <button
              onClick={next}
              className="ml-2 text-xs text-novel-muted hover:text-novel-accent flex items-center gap-0.5"
            >
              下一条
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default PriorityAlert
