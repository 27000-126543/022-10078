import React, { useState, useEffect } from 'react'
import { useStore } from '../store/StoreContext'
import {
  CategoryType,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  Novel,
  PriorityType,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
} from '../types'
import { X, Plus, Save } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  editingNovel?: Novel | null
}

const NovelDialog: React.FC<Props> = ({ open, onClose, editingNovel }) => {
  const { addNovel, updateNovel, deleteNovel, fillMissingChapters, selectNovel } =
    useStore()

  const [form, setForm] = useState({
    title: '',
    author: '',
    category: 'xuanhuan' as CategoryType,
    source: '起点中文网',
    lastReadChapter: 0,
    expectation: 4,
    isPaid: false,
    priority: 'none' as PriorityType,
    feedThreshold: 10,
    description: '',
    latestChapter: 0,
    totalWordCount: 0,
    tags: '' as string,
  })

  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (editingNovel) {
      setForm({
        title: editingNovel.title,
        author: editingNovel.author,
        category: editingNovel.category,
        source: editingNovel.source,
        lastReadChapter: editingNovel.lastReadChapter,
        expectation: editingNovel.expectation,
        isPaid: editingNovel.isPaid,
        priority: editingNovel.priority,
        feedThreshold: editingNovel.feedThreshold,
        description: editingNovel.description || '',
        latestChapter: editingNovel.latestChapter || 0,
        totalWordCount: editingNovel.totalWordCount || 0,
        tags: (editingNovel.tags || []).join(', '),
      })
    } else {
      setForm({
        title: '',
        author: '',
        category: 'xuanhuan',
        source: '起点中文网',
        lastReadChapter: 0,
        expectation: 4,
        isPaid: false,
        priority: 'none',
        feedThreshold: 10,
        description: '',
        latestChapter: 0,
        totalWordCount: 0,
        tags: '',
      })
    }
    setConfirmDelete(false)
  }, [editingNovel, open])

  if (!open) return null

  const isEdit = !!editingNovel

  const handleSubmit = () => {
    if (!form.title.trim() || !form.author.trim()) return
    const tags = form.tags
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean)

    let novelId: string
    if (isEdit && editingNovel) {
      updateNovel({
        ...editingNovel,
        ...form,
        tags,
      })
      novelId = editingNovel.id
    } else {
      novelId = addNovel({
        ...form,
        tags,
      })
      selectNovel(novelId)
    }

    if (form.latestChapter > form.lastReadChapter) {
      setTimeout(() => {
        fillMissingChapters(novelId, form.latestChapter)
      }, 0)
    }

    onClose()
  }

  const handleDelete = () => {
    if (editingNovel) {
      deleteNovel(editingNovel.id)
      onClose()
    }
  }

  const commonSources = [
    '起点中文网',
    '晋江文学城',
    '长佩文学',
    '番茄小说',
    '七猫免费小说',
    '书旗小说',
    '纵横中文网',
    '红袖添香',
    '其他',
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] bg-novel-card border border-novel-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-novel-border">
          <h2 className="text-lg font-bold flex items-center gap-2">
            {isEdit ? (
              <Save className="w-5 h-5 text-novel-accent" />
            ) : (
              <Plus className="w-5 h-5 text-novel-accent" />
            )}
            {isEdit ? '编辑作品' : '添加追更作品'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg text-novel-muted hover:text-novel-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-novel-muted mb-1.5">作品名 *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="例如：诡秘之主"
                className="w-full input-field"
              />
            </div>
            <div>
              <label className="block text-xs text-novel-muted mb-1.5">作者 *</label>
              <input
                type="text"
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                placeholder="例如：爱潜水的乌贼"
                className="w-full input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-novel-muted mb-1.5">分类</label>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(CATEGORY_LABELS) as CategoryType[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setForm({ ...form, category: cat })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      form.category === cat
                        ? 'text-white'
                        : 'bg-novel-dark text-novel-muted hover:text-novel-text border border-novel-border'
                    }`}
                    style={{
                      backgroundColor:
                        form.category === cat ? CATEGORY_COLORS[cat] : undefined,
                    }}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-novel-muted mb-1.5">来源站点</label>
              <select
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="w-full input-field appearance-none"
              >
                {commonSources.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {form.source === '其他' && (
                <input
                  type="text"
                  value={form.source === '其他' ? '' : form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  placeholder="自定义站点"
                  className="w-full input-field mt-2 text-sm"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-novel-muted mb-1.5">上次读到</label>
              <input
                type="number"
                min={0}
                value={form.lastReadChapter}
                onChange={(e) =>
                  setForm({ ...form, lastReadChapter: parseInt(e.target.value) || 0 })
                }
                className="w-full input-field"
              />
            </div>
            <div>
              <label className="block text-xs text-novel-muted mb-1.5">最新章节</label>
              <input
                type="number"
                min={0}
                value={form.latestChapter}
                onChange={(e) =>
                  setForm({ ...form, latestChapter: parseInt(e.target.value) || 0 })
                }
                className="w-full input-field"
              />
            </div>
            <div>
              <label className="block text-xs text-novel-muted mb-1.5">总字数（可选）</label>
              <input
                type="number"
                min={0}
                value={form.totalWordCount}
                onChange={(e) =>
                  setForm({ ...form, totalWordCount: parseInt(e.target.value) || 0 })
                }
                className="w-full input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-novel-muted mb-1.5">
              期待值（{form.expectation}/5星）
            </label>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setForm({ ...form, expectation: i + 1 })}
                  className="p-1"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className={`w-7 h-7 transition-colors ${
                      i < form.expectation
                        ? 'text-novel-feed fill-novel-feed'
                        : 'text-novel-muted/30'
                    }`}
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-novel-muted mb-1.5">追更优先级</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(Object.keys(PRIORITY_LABELS) as PriorityType[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setForm({ ...form, priority: p })}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                    form.priority === p
                      ? 'border-2'
                      : 'border-novel-border bg-novel-dark/50 text-novel-muted hover:text-novel-text'
                  }`}
                  style={{
                    borderColor:
                      form.priority === p ? PRIORITY_COLORS[p] : undefined,
                    backgroundColor:
                      form.priority === p ? `${PRIORITY_COLORS[p]}18` : undefined,
                    color: form.priority === p ? PRIORITY_COLORS[p] : undefined,
                  }}
                >
                  {PRIORITY_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          {form.priority === 'feed' && (
            <div>
              <label className="block text-xs text-novel-muted mb-1.5">
                养肥阈值：累计
                <span className="text-novel-feed font-bold mx-1">
                  {form.feedThreshold}
                </span>
                章未读时提醒
              </label>
              <input
                type="range"
                min={3}
                max={100}
                value={form.feedThreshold}
                onChange={(e) =>
                  setForm({ ...form, feedThreshold: parseInt(e.target.value) })
                }
                className="w-full accent-novel-feed"
              />
              <div className="flex justify-between text-[10px] text-novel-muted mt-1">
                <span>3章</span>
                <span>20章</span>
                <span>50章</span>
                <span>100章</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, isPaid: !form.isPaid })}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                form.isPaid
                  ? 'border-novel-feed bg-novel-feed/15 text-novel-feed'
                  : 'border-novel-border bg-novel-dark/50 text-novel-muted hover:text-novel-text'
              }`}
            >
              <div
                className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                  form.isPaid
                    ? 'border-novel-feed bg-novel-feed'
                    : 'border-novel-muted/50'
                }`}
              >
                {form.isPaid && (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="w-3 h-3 text-white"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              付费订阅
            </button>
          </div>

          <div>
            <label className="block text-xs text-novel-muted mb-1.5">
              标签（用逗号分隔）
            </label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="例如：克苏鲁, 蒸汽朋克, 塔罗牌"
              className="w-full input-field"
            />
          </div>

          <div>
            <label className="block text-xs text-novel-muted mb-1.5">作品简介</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="简单描述一下这本书..."
              className="w-full input-field min-h-[80px] resize-y"
            />
          </div>

          {isEdit && (
            <div className="pt-2 border-t border-novel-border">
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="text-sm text-novel-muted hover:text-novel-must flex items-center gap-1.5"
                >
                  删除此作品
                </button>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-novel-must/10 rounded-xl border border-novel-must/30">
                  <span className="text-sm text-novel-must flex-1">
                    确认要删除《{editingNovel?.title}》吗？所有章节和笔记也将被删除。
                  </span>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-3 py-1.5 text-xs bg-novel-muted/20 text-novel-muted rounded-lg hover:bg-novel-muted/30"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1.5 text-xs bg-novel-must text-white rounded-lg hover:bg-opacity-90"
                  >
                    确认删除
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-novel-border bg-novel-dark/30">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-novel-muted hover:text-novel-text hover:bg-white/5 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.title.trim() || !form.author.trim()}
            className="btn-primary text-sm flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {isEdit ? '保存修改' : '添加到书架'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default NovelDialog
