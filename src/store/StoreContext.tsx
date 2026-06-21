import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react'
import { AppState, Novel, Chapter, Note, PriorityType } from '../types'
import {
  loadState,
  saveState,
  generateId,
  getUnreadCountByNovelId,
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
  | { type: 'UPDATE_RADAR_CHECK'; payload: number }

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
    case 'DELETE_NOVEL':
      return {
        ...state,
        novels: state.novels.filter((n) => n.id !== action.payload),
        chapters: state.chapters.filter((c) => c.novelId !== action.payload),
        notes: state.notes.filter((n) => n.novelId !== action.payload),
        selectedNovelId:
          state.selectedNovelId === action.payload ? null : state.selectedNovelId,
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
      }
    }
    case 'MARK_NOVEL_READ_TO': {
      const { novelId, chapter } = action.payload
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
    case 'UPDATE_RADAR_CHECK':
      return { ...state, lastRadarCheck: action.payload }
    default:
      return state
  }
}

interface StoreContextValue {
  state: AppState
  selectNovel: (id: string | null) => void
  addNovel: (novel: Omit<Novel, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateNovel: (novel: Novel) => void
  deleteNovel: (id: string) => void
  setPriority: (id: string, priority: PriorityType) => void
  markChapterRead: (chapterId: string) => void
  markNovelReadTo: (novelId: string, chapter: number) => void
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateNote: (note: Note) => void
  deleteNote: (id: string) => void
  getUnreadForNovel: (novelId: string) => number
  getSelectedNovel: () => Novel | undefined
  getChaptersForNovel: (novelId: string) => Chapter[]
  getNotesForNovel: (novelId: string) => Note[]
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
    getUnreadForNovel,
    getSelectedNovel,
    getChaptersForNovel,
    getNotesForNovel,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
