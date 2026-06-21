import React, { useState, useEffect } from 'react'
import { useStore } from '../store/StoreContext'
import { Novel } from '../types'
import { X, Save, BookMarked } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  novel: Novel | undefined
  defaultChapter?: number
}

const AddChapterDialog: React.FC<Props> = ({ open, onClose, novel, defaultChapter }) => {
  const { addChapter, getChaptersForNovel } = useStore()

  const [form, setForm] = useState({
    chapterNumber: 1,
    title: '',
    wordCount: 3000,
    publishTime: '',
  })

  useEffect(() => {
    if (open && novel) {
      const chapters = getChaptersForNovel(novel.id)
      const nextChapter = defaultChapter
        ? defaultChapter
        : novel.latestChapter
        ? novel.latestChapter + 1
        : chapters.length > 0
        ? Math.max(...chapters.map((c) => c.chapterNumber)) + 1
        : 1
      const now = new Date()
      const pad = (n: number) => n.toString().padStart(2, '0')
      const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`

      setForm({
        chapterNumber: nextChapter,
        title: `第${nextChapter}章`,
        wordCount: 3000,
        publishTime: dateStr,
      })
    }
  }, [open, novel, defaultChapter, getChaptersForNovel])

  if (!open || !novel) return null

  const handleSubmit = () => {
    if (!form.title.trim() || form.chapterNumber <= 0) return
    const publishTs = form.publishTime
      ? new Date(form.publishTime).getTime()
      : Date.now()

    addChapter({
      novelId: novel.id,
      title: form.title.trim(),
      wordCount: form.wordCount,
      publishTime: publishTs || Date.now(),
      isRead: false,
      chapterNumber: form.chapterNumber,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-novel-card border border-novel-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-novel-border">
          <h2 className="text-base font-bold flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-novel-accent" />
            录入新章节
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg text-novel-muted hover:text-novel-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-3 bg-novel-dark rounded-xl text-sm">
            <span className="text-novel-muted">作品：</span>
            <span className="text-novel-text font-medium">{novel.title}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-novel-muted mb-1.5">章节号 *</label>
              <input
                type="number"
                min={1}
                value={form.chapterNumber}
                onChange={(e) => {
                  const num = parseInt(e.target.value) || 0
                  setForm({ ...form, chapterNumber: num, title: `第${num}章` })
                }}
                className="w-full input-field"
              />
            </div>
            <div>
              <label className="block text-xs text-novel-muted mb-1.5">字数</label>
              <input
                type="number"
                min={0}
                step={100}
                value={form.wordCount}
                onChange={(e) =>
                  setForm({ ...form, wordCount: parseInt(e.target.value) || 0 })
                }
                className="w-full input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-novel-muted mb-1.5">章节标题</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="例如：第100章 风起云涌"
              className="w-full input-field"
            />
          </div>

          <div>
            <label className="block text-xs text-novel-muted mb-1.5">发布时间</label>
            <input
              type="datetime-local"
              value={form.publishTime}
              onChange={(e) => setForm({ ...form, publishTime: e.target.value })}
              className="w-full input-field"
            />
          </div>

          <div className="text-xs text-novel-muted pt-2">
            <p>💡 保存后将自动联动：</p>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              <li>书架未读章数 +1</li>
              <li>更新雷达新增一条记录</li>
              {novel.priority === 'must' && <li>必看弹窗重新提醒</li>}
              {novel.priority === 'feed' && <li>养肥进度重新计算</li>}
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-3.5 border-t border-novel-border bg-novel-dark/30">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-novel-muted hover:text-novel-text hover:bg-white/5 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.title.trim() || form.chapterNumber <= 0}
            className="btn-primary text-sm flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            保存章节
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddChapterDialog
