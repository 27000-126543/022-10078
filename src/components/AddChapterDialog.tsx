import React, { useState, useEffect } from 'react'
import { useStore } from '../store/StoreContext'
import { Novel, Chapter } from '../types'
import { X, Save, BookMarked, Plus, Hash, Clock, FileText, List, Settings } from 'lucide-react'

type Mode = 'single' | 'batch' | 'bulkEdit'

interface Props {
  open: boolean
  onClose: () => void
  novel: Novel | undefined
  defaultChapter?: number
}

const AddChapterDialog: React.FC<Props> = ({ open, onClose, novel, defaultChapter }) => {
  const { addChapter, getChaptersForNovel, upsertChapters, batchUpdateChapters } = useStore()
  const [mode, setMode] = useState<Mode>('single')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkWc, setBulkWc] = useState<number | ''>('')
  const [bulkTime, setBulkTime] = useState('')

  const [form, setForm] = useState({
    chapterNumber: 1,
    title: '',
    wordCount: 3000,
    publishTime: '',
  })

  const [batchForm, setBatchForm] = useState({
    startChapter: 1,
    endChapter: 10,
    baseWordCount: 3000,
    timeMode: 'now' as 'now' | 'interval' | 'custom',
    customTime: '',
    intervalHours: 6,
    titlePrefix: '第',
    titleSuffix: '章',
    markPlaceholder: true,
  })

  const novelChapters = novel ? getChaptersForNovel(novel.id) : []
  const sortedChapters = [...novelChapters].sort((a, b) => b.chapterNumber - a.chapterNumber)

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

      setBatchForm((prev) => ({
        ...prev,
        startChapter: nextChapter,
        endChapter: nextChapter + 9,
        customTime: dateStr,
      }))
      setSelectedIds(new Set())
      setBulkWc('')
      setBulkTime('')
    }
  }, [open, novel, defaultChapter, getChaptersForNovel])

  if (!open || !novel) return null

  const handleSubmitSingle = () => {
    if (!form.title.trim() || form.chapterNumber <= 0) return
    const publishTs = form.publishTime ? new Date(form.publishTime).getTime() : Date.now()
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

  const handleSubmitBatch = () => {
    const { startChapter, endChapter, baseWordCount, timeMode, customTime, intervalHours, titlePrefix, titleSuffix, markPlaceholder } = batchForm
    if (startChapter > endChapter || startChapter <= 0) return

    const chapters: Omit<Chapter, 'id'>[] = []
    const now = Date.now()
    const baseTime = customTime ? new Date(customTime).getTime() : now

    for (let i = startChapter; i <= endChapter; i++) {
      let publishTime: number
      if (timeMode === 'now') {
        publishTime = now
      } else if (timeMode === 'interval') {
        publishTime = baseTime - (endChapter - i) * intervalHours * 60 * 60 * 1000
      } else {
        publishTime = baseTime
      }

      let wordCount = baseWordCount
      if (markPlaceholder) {
        wordCount = Math.max(1, Math.floor(baseWordCount * (0.7 + Math.random() * 0.6)))
      }

      chapters.push({
        novelId: novel.id,
        title: markPlaceholder
          ? `${titlePrefix}${i}${titleSuffix} (占位)`
          : `${titlePrefix}${i}${titleSuffix}`,
        wordCount,
        publishTime,
        isRead: i <= novel.lastReadChapter,
        chapterNumber: i,
      })
    }

    upsertChapters(novel.id, chapters)
    onClose()
  }

  const handleBulkEdit = () => {
    if (selectedIds.size === 0) return
    const updates: Array<{ id: string; wordCount?: number; publishTime?: number }> = []
    const bulkWcNum = typeof bulkWc === 'number' ? bulkWc : null
    const bulkTimeTs = bulkTime ? new Date(bulkTime).getTime() : null

    for (const id of selectedIds) {
      const upd: { id: string; wordCount?: number; publishTime?: number } = { id }
      if (bulkWcNum !== null) upd.wordCount = bulkWcNum
      if (bulkTimeTs) upd.publishTime = bulkTimeTs
      updates.push(upd)
    }

    if (updates.length > 0) {
      batchUpdateChapters(novel.id, updates)
    }
    onClose()
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedChapters.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(sortedChapters.map((c) => c.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const modeOptions: { key: Mode; label: string; icon: React.ReactNode }[] = [
    { key: 'single', label: '单章录入', icon: <Plus className="w-4 h-4" /> },
    { key: 'batch', label: '批量补区间', icon: <List className="w-4 h-4" /> },
    { key: 'bulkEdit', label: '批量调整', icon: <Settings className="w-4 h-4" /> },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] bg-novel-card border border-novel-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-novel-border">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-novel-accent" />
              章节维护台账
            </h2>
            <div className="flex items-center gap-1 bg-novel-dark rounded-lg p-1">
              {modeOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setMode(opt.key)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    mode === opt.key
                      ? 'bg-novel-accent text-white'
                      : 'text-novel-muted hover:text-novel-text'
                  }`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg text-novel-muted hover:text-novel-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 bg-novel-dark/40 border-b border-novel-border">
          <p className="text-xs text-novel-muted">
            作品：<span className="text-novel-text font-medium">{novel.title}</span>
            {' · '}
            当前最新：<span className="text-novel-accent">第{novel.latestChapter || 0}章</span>
            {' · '}
            已读到：<span className="text-novel-text">第{novel.lastReadChapter}章</span>
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {mode === 'single' && (
            <div className="space-y-4">
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
                    onChange={(e) => setForm({ ...form, wordCount: parseInt(e.target.value) || 0 })}
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
                <p>💡 保存后将自动联动书架未读数、更新雷达、必看弹窗</p>
              </div>
            </div>
          )}

          {mode === 'batch' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-novel-muted mb-1.5 flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    起始章节 *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={batchForm.startChapter}
                    onChange={(e) =>
                      setBatchForm({ ...batchForm, startChapter: parseInt(e.target.value) || 0 })
                    }
                    className="w-full input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs text-novel-muted mb-1.5 flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    结束章节 *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={batchForm.endChapter}
                    onChange={(e) =>
                      setBatchForm({ ...batchForm, endChapter: parseInt(e.target.value) || 0 })
                    }
                    className="w-full input-field"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-novel-muted mb-1.5 flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    基准字数
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={batchForm.baseWordCount}
                    onChange={(e) =>
                      setBatchForm({
                        ...batchForm,
                        baseWordCount: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs text-novel-muted mb-1.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    时间模式
                  </label>
                  <select
                    value={batchForm.timeMode}
                    onChange={(e) =>
                      setBatchForm({
                        ...batchForm,
                        timeMode: e.target.value as 'now' | 'interval' | 'custom',
                      })
                    }
                    className="w-full input-field"
                  >
                    <option value="now">全部设为当前时间</option>
                    <option value="interval">间隔倒推</option>
                    <option value="custom">统一指定时间</option>
                  </select>
                </div>
              </div>
              {batchForm.timeMode === 'interval' && (
                <div>
                  <label className="block text-xs text-novel-muted mb-1.5">
                    更新间隔（小时）
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={batchForm.intervalHours}
                    onChange={(e) =>
                      setBatchForm({
                        ...batchForm,
                        intervalHours: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full input-field"
                  />
                  <p className="text-[10px] text-novel-muted mt-1">
                    从结束章节倒推，如间隔6小时则每章时间差6小时
                  </p>
                </div>
              )}
              {batchForm.timeMode === 'custom' && (
                <div>
                  <label className="block text-xs text-novel-muted mb-1.5">统一发布时间</label>
                  <input
                    type="datetime-local"
                    value={batchForm.customTime}
                    onChange={(e) => setBatchForm({ ...batchForm, customTime: e.target.value })}
                    className="w-full input-field"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-novel-muted mb-1.5">标题前缀</label>
                  <input
                    type="text"
                    value={batchForm.titlePrefix}
                    onChange={(e) => setBatchForm({ ...batchForm, titlePrefix: e.target.value })}
                    className="w-full input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs text-novel-muted mb-1.5">标题后缀</label>
                  <input
                    type="text"
                    value={batchForm.titleSuffix}
                    onChange={(e) => setBatchForm({ ...batchForm, titleSuffix: e.target.value })}
                    className="w-full input-field"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={batchForm.markPlaceholder}
                  onChange={(e) => setBatchForm({ ...batchForm, markPlaceholder: e.target.checked })}
                  className="w-4 h-4 rounded border-novel-border bg-novel-dark"
                />
                <span className="text-sm text-novel-muted">
                  标记为占位章节（标题加「(占位)」、字数随机波动）
                </span>
              </label>
              {batchForm.startChapter > 0 && batchForm.endChapter >= batchForm.startChapter && (
                <div className="p-3 bg-novel-dark rounded-xl text-xs">
                  <p className="text-novel-accent font-medium mb-1">
                    即将生成 {batchForm.endChapter - batchForm.startChapter + 1} 章
                  </p>
                  <p className="text-novel-muted">
                    {batchForm.titlePrefix}
                    {batchForm.startChapter}
                    {batchForm.titleSuffix} → {batchForm.titlePrefix}
                    {batchForm.endChapter}
                    {batchForm.titleSuffix}
                    {batchForm.markPlaceholder && ' (占位)'}
                  </p>
                </div>
              )}
            </div>
          )}

          {mode === 'bulkEdit' && (
            <div className="space-y-4">
              <div className="p-3 bg-novel-dark rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-novel-muted">
                    选择要调整的章节：已选 <span className="text-novel-accent font-medium">{selectedIds.size}</span> / {sortedChapters.length}
                  </p>
                  <button
                    onClick={toggleSelectAll}
                    className="text-xs text-novel-accent hover:underline"
                  >
                    {selectedIds.size === sortedChapters.length ? '取消全选' : '全选'}
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                  {sortedChapters.map((ch) => (
                    <label
                      key={ch.id}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedIds.has(ch.id) ? 'bg-novel-accent/15' : 'hover:bg-white/5'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(ch.id)}
                        onChange={() => toggleSelect(ch.id)}
                        className="w-4 h-4 rounded border-novel-border bg-novel-dark"
                      />
                      <span className="text-xs text-novel-muted font-mono w-12">
                        #{ch.chapterNumber}
                      </span>
                      <span className="text-sm flex-1 truncate">{ch.title}</span>
                      <span className="text-xs text-novel-muted">{ch.wordCount}字</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-novel-muted mb-1.5">
                    统一设置字数（留空不修改）
                  </label>
                  <div className="relative">
                    <Plus className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-novel-muted" />
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={bulkWc}
                      onChange={(e) =>
                        setBulkWc(e.target.value === '' ? '' : parseInt(e.target.value) || 0)
                      }
                      placeholder="例如：3000"
                      className="w-full input-field pl-8"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-novel-muted mb-1.5">
                    统一设置发布时间（留空不修改）
                  </label>
                  <input
                    type="datetime-local"
                    value={bulkTime}
                    onChange={(e) => setBulkTime(e.target.value)}
                    className="w-full input-field"
                  />
                </div>
              </div>

              {selectedIds.size > 0 && (bulkWc !== '' || bulkTime) && (
                <div className="p-3 bg-novel-feed/10 border border-novel-feed/30 rounded-xl text-xs">
                  <p className="text-novel-feed font-medium">
                    将对 {selectedIds.size} 章执行批量调整：
                  </p>
                  {bulkWc !== '' && <p className="text-novel-muted mt-1">· 字数统一设为 {bulkWc} 字</p>}
                  {bulkTime && <p className="text-novel-muted mt-1">· 发布时间统一设为 {bulkTime}</p>}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-3.5 border-t border-novel-border bg-novel-dark/30">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-novel-muted hover:text-novel-text hover:bg-white/5 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={
              mode === 'single'
                ? handleSubmitSingle
                : mode === 'batch'
                ? handleSubmitBatch
                : handleBulkEdit
            }
            disabled={
              mode === 'single'
                ? !form.title.trim() || form.chapterNumber <= 0
                : mode === 'batch'
                ? batchForm.startChapter <= 0 || batchForm.endChapter < batchForm.startChapter
                : selectedIds.size === 0 || (bulkWc === '' && !bulkTime)
            }
            className="btn-primary text-sm flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {mode === 'single'
              ? '保存章节'
              : mode === 'batch'
              ? `生成 ${Math.max(0, batchForm.endChapter - batchForm.startChapter + 1)} 章`
              : '应用调整'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddChapterDialog
