/**
 * GameState and Reducer for Startup Journey
 * Single reducer holding all game state. Everything else is derived.
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { IdeaId } from '../data/ideas';
import { Language, TranslationKey, translate } from '../data/translations';

export type CharacterId = 'boy' | 'girl';

export type ScreenId =
  | 'title'
  | 'character_select'
  | 'briefing'
  | 'chapter'
  | 'final'
  | 'self_test';

export interface Meters {
  cash: number | null;
  value: number | null;
  slice: number | null;
}

export interface ChapterResults {
  [key: number]: any;
  1?: any;
  2?: any;
  3?: any;
  4?: any;
  5?: any;
}

export interface GameState {
  character: CharacterId | null;
  ideaId: IdeaId | null;
  chapter: 1 | 2 | 3 | 4 | 5;
  chapterResults: ChapterResults;
  meters: Meters;
  notebook: string[];
  screen: ScreenId;
  debugMode: boolean;
  language: Language;
}

export type GameAction =
  | { type: 'SET_CHARACTER'; character: CharacterId }
  | { type: 'SET_IDEA'; ideaId: IdeaId }
  | {
      type: 'COMPLETE_CHAPTER';
      chapter: 1 | 2 | 3 | 4 | 5;
      result?: any;
      meterUpdates?: Partial<Meters>;
      lesson: string;
    }
  | { type: 'RESET' }
  | { type: 'LOAD_SIMULATION'; simulation: Partial<GameState> }
  | { type: 'SET_SCREEN'; screen: ScreenId }
  | { type: 'TOGGLE_DEBUG' }
  | { type: 'SET_DEBUG'; enabled: boolean }
  | { type: 'SET_LANGUAGE'; language: Language };

const initialMeters: Meters = {
  cash: null,
  value: null,
  slice: null,
};

export const initialGameState: GameState = {
  character: null,
  ideaId: null,
  chapter: 1,
  chapterResults: {},
  meters: initialMeters,
  notebook: [],
  screen: 'title',
  debugMode: false,
  language: 'en',
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_CHARACTER':
      return {
        ...state,
        character: action.character,
      };

    case 'SET_IDEA':
      return {
        ...state,
        ideaId: action.ideaId,
      };

    case 'COMPLETE_CHAPTER': {
      const nextResults = {
        ...state.chapterResults,
        [action.chapter]: action.result ?? { completed: true },
      };

      const rawCash = action.meterUpdates?.cash !== undefined ? action.meterUpdates.cash : state.meters.cash;
      const rawValue = action.meterUpdates?.value !== undefined ? action.meterUpdates.value : state.meters.value;
      const rawSlice = action.meterUpdates?.slice !== undefined ? action.meterUpdates.slice : state.meters.slice;

      const nextMeters: Meters = {
        cash: rawCash !== null ? Math.max(0, rawCash) : null,
        value: rawValue !== null ? Math.max(100, rawValue) : null,
        slice: rawSlice !== null ? Math.min(100, Math.max(0, rawSlice)) : null,
      };

      const nextNotebook = action.lesson && !state.notebook.includes(action.lesson)
        ? [...state.notebook, action.lesson]
        : state.notebook;

      if (action.chapter >= 5) {
        return {
          ...state,
          chapterResults: nextResults,
          meters: nextMeters,
          notebook: nextNotebook,
          screen: 'final',
        };
      }

      const nextChapterNum = (action.chapter + 1) as 1 | 2 | 3 | 4 | 5;
      return {
        ...state,
        chapter: nextChapterNum,
        chapterResults: nextResults,
        meters: nextMeters,
        notebook: nextNotebook,
        screen: 'chapter',
      };
    }

    case 'LOAD_SIMULATION':
      return {
        ...state,
        ...action.simulation,
        debugMode: state.debugMode,
        language: state.language,
      };

    case 'RESET':
      // Keeps the character and language chosen and goes to Chapter 1 idea selection
      return {
        ...initialGameState,
        character: state.character,
        debugMode: state.debugMode,
        language: state.language,
        screen: 'chapter',
        chapter: 1,
        ideaId: null,
        chapterResults: {},
        meters: { cash: null, value: null, slice: null },
        notebook: [],
      };

    case 'SET_SCREEN':
      return {
        ...state,
        screen: action.screen,
      };

    case 'TOGGLE_DEBUG':
      return {
        ...state,
        debugMode: !state.debugMode,
      };

    case 'SET_DEBUG':
      return {
        ...state,
        debugMode: action.enabled,
      };

    case 'SET_LANGUAGE':
      return {
        ...state,
        language: action.language,
      };

    default:
      return state;
  }
}

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  setCharacter: (char: CharacterId) => void;
  setIdea: (idea: IdeaId) => void;
  completeChapter: (
    chapter: 1 | 2 | 3 | 4 | 5,
    result: any,
    meterUpdates: Partial<Meters>,
    lesson: string
  ) => void;
  resetGame: () => void;
  setScreen: (screen: ScreenId) => void;
  toggleDebug: () => void;
  loadSimulation: (sim: Partial<GameState>) => void;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);

  // Sync HTML dir and lang attributes cleanly with state.language
  useEffect(() => {
    try {
      document.documentElement.dir = state.language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = state.language;
    } catch {
      // Safe fallback
    }
  }, [state.language]);

  // Check URL query param for ?debug=1
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('debug') === '1') {
        dispatch({ type: 'SET_DEBUG', enabled: true });
      }
    } catch {
      // Safe fallback
    }
  }, []);

  const setCharacter = (char: CharacterId) => dispatch({ type: 'SET_CHARACTER', character: char });
  const setIdea = (idea: IdeaId) => dispatch({ type: 'SET_IDEA', ideaId: idea });
  const completeChapter = (
    chapter: 1 | 2 | 3 | 4 | 5,
    result: any,
    meterUpdates: Partial<Meters>,
    lesson: string
  ) => dispatch({ type: 'COMPLETE_CHAPTER', chapter, result, meterUpdates, lesson });
  const resetGame = () => dispatch({ type: 'RESET' });
  const setScreen = (screen: ScreenId) => dispatch({ type: 'SET_SCREEN', screen });
  const toggleDebug = () => dispatch({ type: 'TOGGLE_DEBUG' });
  const loadSimulation = (sim: Partial<GameState>) => dispatch({ type: 'LOAD_SIMULATION', simulation: sim });
  const setLanguage = (language: Language) => dispatch({ type: 'SET_LANGUAGE', language });
  const toggleLanguage = () =>
    dispatch({ type: 'SET_LANGUAGE', language: state.language === 'en' ? 'ar' : 'en' });
  const t = (key: TranslationKey, vars?: Record<string, string | number>) =>
    translate(state.language, key, vars);

  return (
    <GameContext.Provider
      value={{
        state,
        dispatch,
        setCharacter,
        setIdea,
        completeChapter,
        resetGame,
        setScreen,
        toggleDebug,
        loadSimulation,
        setLanguage,
        toggleLanguage,
        t,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

export function useTranslation() {
  const { state, t, setLanguage, toggleLanguage } = useGame();
  return {
    language: state.language,
    isRTL: state.language === 'ar',
    t,
    setLanguage,
    toggleLanguage,
  };
}
