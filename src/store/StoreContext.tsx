import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react'
import { AppState, Novel, Chapter, Note, PriorityType } from '../types'
import {
  loadState,
  saveState,
  generateId,
  getUnreadCountByNovelId,
  generatePlaceholderChapters,
} from '../lib/storage'

type Action =
  | { type: 'SELECT_NOVEL'; payload: string | null }
  | { type: 'ADD_NOVEL'; payload: Novel }
  | { type: 'UPDATE_NOVEL'; payload: Novel }
  | { type: 'DELETE_NOVEL'; payload: string }
  | { type: 'SET_PRIORITY'; payload: { id: string; priority: PriorityType } }
  | { type: 'MARK_CHAPTER_READ'; payload: string }
  | { type: 'MARK_NOVEL_READ_TO'; payload: { novelId: string; chapter: number } }
  | { type: 'ADD_NOTE'; payload: Note }
  | { type: 'UPDATE_NOTE'; payload: Note }
  | { type: 'DELETE_NOTE'; payload: string }
  | { type: 'ADD_CHAPTERS'; payload: Chapter[] }
  | { type: 'ADD_CHAPTER'; payload: Chapter }
  | { type: 'FILL_MISSING_CHAPTERS'; payload: { novelId: string; chapters: Chapter[] } }
  | { type: 'UPDATE_RADAR_CHECK'; payload: number }
  | { type: 'DISMISS_MUST_ALERT'; payload: string }
  | { type: 'DISMISS_FEED_ALERT'; payload: { novelId: string; unreadCount: number } }
  | { type: 'RESET_MUST_ALERT'; payload: string }
  | { type: 'RESET_FEED_ALERT'; payload: string }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SELECT_NOVEL':
      return { ...state, selectedNovelId: action.payload }
    case 'ADD_NOVEL':
      return { ...state, novels: [action.payload, ...state.novels] }
    case 'UPDATE_NOVEL':
      return {
        ...state,
        novels: state.novels.map((n) =>
          n.id === action.payload.id ? { ...action.payload, updatedAt: Date.now() } : n
        ),
      }
    case 'DELETE_NOVEL': {
      const newFeedAlerts = { ...state.dismissedFeedAlerts }
      delete newFeedAlerts[action.payload]
      return {
        ...state,
        novels: state.novels.filter((n) => n.id !== action.payload),
        chapters: state.chapters.filter((c) => c.novelId !== action.payload),
        notes: state.notes.filter((n) => n.novelId !== action.payload),
        selectedNovelId:
          state.selectedNovelId === action.payload ? null : state.selectedNovelId,
        dismissedMustAlerts: state.dismissedMustAlerts.filter((id) => id !== action.payload),
        dismissedFeedAlerts: newFeedAlerts,
      }
    }
    case 'SET_PRIORITY':
      return {
        ...state,
        novels: state.novels.map((n) =>
          n.id === action.payload.id
            ? { ...n, priority: action.payload.priority, updatedAt: Date.now() }
            : n
        ),
      }
    case 'MARK_CHAPTER_READ': {
      const chapter = state.chapters.find((c) => c.id === action.payload)
      if (!chapter) return state
      const novel = state.novels.find((n) => n.id === chapter.novelId)
      const newLastRead = novel && chapter.chapterNumber > novel.lastReadChapter
        ? chapter.chapterNumber
        : novel?.lastReadChapter ?? 0
      const newFeedAlerts = { ...state.dismissedFeedAlerts }
      delete newFeedAlerts[chapter.novelId]
      return {
        ...state,
        chapters: state.chapters.map((c) =>
          c.id === action.payload ? { ...c, isRead: true } : c
        ),
        novels: state.novels.map((n) =>
          n.id === chapter.novelId
            ? { ...n, lastReadChapter: newLastRead, lastReadTime: Date.now(), updatedAt: Date.now() }
            : n
        ),
        dismissedFeedAlerts: newFeedAlerts,
      }
    }
    case 'MARK_NOVEL_READ_TO': {
      const { novelId, chapter } = action.payload
      const newFeedAlerts = { ...state.dismissedFeedAlerts }
      delete newFeedAlerts[novelId]
      return {
        ...state,
        chapters: state.chapters.map((c) =>
          c.novelId === novelId && c.chapterNumber <= chapter
            ? { ...c, isRead: true }
            : c
        ),
        novels: state.novels.map((n) =>
          n.id === novelId
            ? { ...n, lastReadChapter: chapter, lastReadTime: Date.now(), updatedAt: Date.now() }
            : n
        ),
        dismissedFeedAlerts: newFeedAlerts,
      }
    }
    case 'ADD_NOTE':
      return { ...state, notes: [...state.notes, action.payload] }
    case 'UPDATE_NOTE':
      return {
        ...state,
        notes: state.notes.map((n) =>
          n.id === action.payload.id
            ? { ...action.payload, updatedAt: Date.now() }
            : n
        ),
      }
    case 'DELETE_NOTE':
      return { ...state, notes: state.notes.filter((n) => n.id !== action.payload) }
    case 'ADD_CHAPTERS':
      return { ...state, chapters: [...state.chapters, ...action.payload] }
    case 'ADD_CHAPTER': {
      const chapter = action.payload
      const novel = state.novels.find((n) => n.id === chapter.novelId)
      const newLatest =
        novel && (!novel.latestChapter || chapter.chapterNumber > novel.latestChapter)
          ? chapter.chapterNumber
          : novel?.latestChapter
      const newFeedAlerts = { ...state.dismissedFeedAlerts }
      if (novel?.priority === 'must') {
        const newMust = state.dismissedMustAlerts.filter((id) => id !== novel.id)
        return {
          ...state,
          chapters: [...state.chapters, chapter],
          novels: state.novels.map((n) =>
            n.id === chapter.novelId
              ? { ...n, latestChapter: newLatest, updatedAt: Date.now() }
              : n
          ),
          dismissedMustAlerts: newMust,
        }
      }
      if (novel?.priority === 'feed') {
        delete newFeedAlerts[novel.id]
      }
      return {
        ...state,
        chapters: [...state.chapters, chapter],
        novels: state.novels.map((n) =>
          n.id === chapter.novelId
            ? { ...n, latestChapter: newLatest, updatedAt: Date.now() }
            : n
        ),
        dismissedFeedAlerts: newFeedAlerts,
      }
    }
    case 'FILL_MISSING_CHAPTERS': {
      const { novelId, chapters } = action.payload
      const existingNums = new Set(
        state.chapters.filter((c) => c.novelId === novelId).map((c) => c.chapterNumber)
      )
      const newChapters = chapters.filter((c) => !existingNums.has(c.chapterNumber))
      if (newChapters.length === 0) return state
      const maxNum = Math.max(...newChapters.map((c) => c.chapterNumber))
      const novel = state.novels.find((n) => n.id === novelId)
      const newLatest =
        novel && (!novel.latestChapter || maxNum > novel.latestChapter)
          ? maxNum
          : novel?.latestChapter
      return {
        ...state,
        chapters: [...state.chapters, ...newChapters],
        novels: state.novels.map((n) =>
          n.id === novelId ? { ...n, latestChapter: newLatest, updatedAt: Date.now() } : n
        ),
      }
    }
    case 'UPDATE_RADAR_CHECK':
      return { ...state, lastRadarCheck: action.payload }
    case 'DISMISS_MUST_ALERT':
      if (state.dismissedMustAlerts.includes(action.payload)) return state
      return {
        ...state,
        dismissedMustAlerts: [...state.dismissedMustAlerts, action.payload],
      }
    case 'DISMISS_FEED_ALERT':
      return {
        ...state,
        dismissedFeedAlerts: {
          ...state.dismissedFeedAlerts,
          [action.payload.novelId]: action.payload.unreadCount,
        },
      }
    case 'RESET_MUST_ALERT':
      return {
        ...state,
        dismissedMustAlerts: state.dismissedMustAlerts.filter((id) => id !== action.payload),
      }
    case 'RESET_FEED_ALERT': {
      const newObj = { ...state.dismissedFeedAlerts }
      delete newObj[action.payload]
      return { ...state, dismissedFeedAlerts: newObj }
    }
    default:
      return state
  }
}

interface StoreContextValue {
  state: AppState
  selectNovel: (id: string | null) => void
  addNovel: (novel: Omit<Novel, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateNovel: (novel: Novel) => void
  deleteNovel: (id: string) => void
  setPriority: (id: string, priority: PriorityType) => void
  markChapterRead: (chapterId: string) => void
  markNovelReadTo: (novelId: string, chapter: number) => void
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateNote: (note: Note) => void
  deleteNote: (id: string) => void
  addChapter: (chapter: Omit<Chapter, 'id'>) => void
  fillMissingChapters: (novelId: string, latestChapter: number) => void
  getUnreadForNovel: (novelId: string) => number
  getSelectedNovel: () => Novel | undefined
  getChaptersForNovel: (novelId: string) => Chapter[]
  getNotesForNovel: (novelId: string) => Note[]
  dismissMustAlert: (novelId: string) => void
  dismissFeedAlert: (novelId: string, unreadCount: number) => void
  resetMustAlert: (novelId: string) => void
  resetFeedAlert: (novelId: string) => void
}

const StoreContext = createContext<StoreContextValue | null>(null)

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, null, loadState)

  useEffect(() => {
    saveState(state)
  }, [state])

  const selectNovel = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_NOVEL', payload: id })
  }, [])

  const addNovel = useCallback(
    (novel: Omit<Novel, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = Date.now()
      const newNovel: Novel = {
        ...novel,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      }
      dispatch({ type: 'ADD_NOVEL', payload: newNovel })
      return newNovel.id
    },
    []
  )

  const updateNovel = useCallback((novel: Novel) => {
    dispatch({ type: 'UPDATE_NOVEL', payload: novel })
  }, [])

  const deleteNovel = useCallback((id: string) => {
    dispatch({ type: 'DELETE_NOVEL', payload: id })
  }, [])

  const setPriority = useCallback((id: string, priority: PriorityType) => {
    dispatch({ type: 'SET_PRIORITY', payload: { id, priority } })
  }, [])

  const markChapterRead = useCallback((chapterId: string) => {
    dispatch({ type: 'MARK_CHAPTER_READ', payload: chapterId })
  }, [])

  const markNovelReadTo = useCallback((novelId: string, chapter: number) => {
    dispatch({ type: 'MARK_NOVEL_READ_TO', payload: { novelId, chapter } })
  }, [])

  const addNote = useCallback(
    (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = Date.now()
      const newNote: Note = {
        ...note,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      }
      dispatch({ type: 'ADD_NOTE', payload: newNote })
    },
    []
  )

  const updateNote = useCallback((note: Note) => {
    dispatch({ type: 'UPDATE_NOTE', payload: note })
  }, [])

  const deleteNote = useCallback((id: string) => {
    dispatch({ type: 'DELETE_NOTE', payload: id })
  }, [])

  const addChapter = useCallback(
    (chapter: Omit<Chapter, 'id'>) => {
      const newChapter: Chapter = {
        ...chapter,
        id: generateId(),
      }
      dispatch({ type: 'ADD_CHAPTER', payload: newChapter })
    },
    []
  )

  const fillMissingChapters = useCallback(
    (novelId: string, latestChapter: number) => {
      const novel = state.novels.find((n) => n.id === novelId)
      if (!novel || !latestChapter || latestChapter <= novel.lastReadChapter) return
      const placeholders = generatePlaceholderChapters(
        novelId,
        novel.lastReadChapter,
        latestChapter
      )
      dispatch({ type: 'FILL_MISSING_CHAPTERS', payload: { novelId, chapters: placeholders } })
    },
    [state.novels]
  )

  const getUnreadForNovel = useCallback(
    (novelId: string) => {
      const novel = state.novels.find((n) => n.id === novelId)
      if (!novel) return 0
      return getUnreadCountByNovelId(state.chapters, novelId, novel.lastReadChapter)
    },
    [state.chapters, state.novels]
  )

  const getSelectedNovel = useCallback(() => {
    return state.novels.find((n) => n.id === state.selectedNovelId)
  }, [state.novels, state.selectedNovelId])

  const getChaptersForNovel = useCallback(
    (novelId: string) => {
      return state.chapters
        .filter((c) => c.novelId === novelId)
        .sort((a, b) => b.chapterNumber - a.chapterNumber)
    },
    [state.chapters]
  )

  const getNotesForNovel = useCallback(
    (novelId: string) => {
      return state.notes
        .filter((n) => n.novelId === novelId)
        .sort((a, b) => b.updatedAt - a.updatedAt)
    },
    [state.notes]
  )

  const dismissMustAlert = useCallback((novelId: string) => {
    dispatch({ type: 'DISMISS_MUST_ALERT', payload: novelId })
  }, [])

  const dismissFeedAlert = useCallback((novelId: string, unreadCount: number) => {
    dispatch({ type: 'DISMISS_FEED_ALERT', payload: { novelId, unreadCount } })
  }, [])

  const resetMustAlert = useCallback((novelId: string) => {
    dispatch({ type: 'RESET_MUST_ALERT', payload: novelId })
  }, [])

  const resetFeedAlert = useCallback((novelId: string) => {
    dispatch({ type: 'RESET_FEED_ALERT', payload: novelId })
  }, [])

  const value: StoreContextValue = {
    state,
    selectNovel,
    addNovel,
    updateNovel,
    deleteNovel,
    setPriority,
    markChapterRead,
    markNovelReadTo,
    addNote,
    updateNote,
    deleteNote,
    addChapter,
    fillMissingChapters,
    getUnreadForNovel,
    getSelectedNovel,
    getChaptersForNovel,
    getNotesForNovel,
    dismissMustAlert,
    dismissFeedAlert,
    resetMustAlert,
    resetFeedAlert,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
