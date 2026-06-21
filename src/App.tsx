import { useState, useEffect } from 'react'
import { StoreProvider, useStore } from './store/StoreContext'
import NovelList from './components/NovelList'
import UpdateRadar from './components/UpdateRadar'
import NovelDetail from './components/NovelDetail'
import NovelDialog from './components/NovelDialog'
import PriorityAlert from './components/PriorityAlert'
import AddChapterDialog from './components/AddChapterDialog'
import NoteSearchDialog from './components/NoteSearchDialog'
import { Note } from './types'
import { Signal, Cpu, Search, Pen } from 'lucide-react'

function AppContent() {
  const { state, selectNovel } = useStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [addChapterOpen, setAddChapterOpen] = useState(false)
  const [addChapterDefault, setAddChapterDefault] = useState<number | undefined>(undefined)
  const [noteSearchOpen, setNoteSearchOpen] = useState(false)
  const [radarExpanded, setRadarExpanded] = useState(true)
  const [showAlertOnLaunch] = useState(true)
  const [highlightChapter, setHighlightChapter] = useState<number | null>(null)
  const [highlightNoteId, setHighlightNoteId] = useState<string | null>(null)

  const selectedNovel = state.novels.find((n) => n.id === state.selectedNovelId)
  const totalNotes = state.notes.length

  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const pad = (n: number) => n.toString().padStart(2, '0')
  const timeStr = `${pad(currentTime.getHours())}:${pad(currentTime.getMinutes())}`

  const handleAddChapter = (chapter?: number) => {
    setAddChapterDefault(chapter)
    setAddChapterOpen(true)
  }

  const handleJumpToNote = (note: Note) => {
    selectNovel(note.novelId)
    setHighlightChapter(note.chapterNumber ?? null)
    setHighlightNoteId(note.id)
    setTimeout(() => {
      setHighlightChapter(null)
      setHighlightNoteId(null)
    }, 5000)
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-novel-dark">
      <div className="flex items-center justify-between px-5 py-2 bg-novel-card border-b border-novel-border flex-shrink-0 select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-novel-accent to-novel-must flex items-center justify-center">
              <Signal className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight">追更控制台</h1>
              <p className="text-[10px] text-novel-muted leading-tight">
                Novel Tracker Console
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setNoteSearchOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-novel-muted hover:text-novel-accent hover:bg-white/5 transition-colors"
            title="搜索追更笔记"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">笔记检索</span>
            {totalNotes > 0 && (
              <span className="bg-novel-accent/20 text-novel-accent text-[9px] px-1.5 py-0.5 rounded-full">
                {totalNotes}
              </span>
            )}
          </button>
          <div className="h-4 w-px bg-novel-border" />
          <div className="flex items-center gap-1">
            <Pen className="w-3 h-3 text-novel-accent" />
            <span className="text-[10px] text-novel-muted">
              {totalNotes} 条笔记
            </span>
          </div>
          <div className="h-4 w-px bg-novel-border" />
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-novel-muted">
              {timeStr}
            </span>
          </div>
          <div className="h-4 w-px bg-novel-border" />
          <div className="flex items-center gap-1 text-[10px] text-novel-muted">
            <Cpu className="w-3 h-3" />
            监控 {state.novels.length} 部作品
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <NovelList onAddClick={() => setDialogOpen(true)} />

        <div className="flex-1 flex flex-col overflow-hidden">
          <UpdateRadar
            expanded={radarExpanded}
            onToggleExpanded={setRadarExpanded}
          />
          <NovelDetail
            onEditClick={() => setDialogOpen(true)}
            onAddChapterClick={handleAddChapter}
            highlightChapter={highlightChapter}
            highlightNoteId={highlightNoteId}
          />
        </div>
      </div>

      <NovelDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        editingNovel={
          dialogOpen ? selectedNovel || null : null
        }
      />

      <AddChapterDialog
        open={addChapterOpen}
        onClose={() => setAddChapterOpen(false)}
        novel={selectedNovel}
        defaultChapter={addChapterDefault}
      />

      <NoteSearchDialog
        open={noteSearchOpen}
        onClose={() => setNoteSearchOpen(false)}
        onJumpToNote={handleJumpToNote}
      />

      {showAlertOnLaunch && <PriorityAlert />}
    </div>
  )
}

function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  )
}

export default App
