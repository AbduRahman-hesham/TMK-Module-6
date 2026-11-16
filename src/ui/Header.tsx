import React, { useState } from 'react';
import { useGame } from '../state/gameContext';
import { CHAPTERS } from '../data/chapters';
import { TranslationKey } from '../data/translations';
import { Meter } from './Meter';
import { NotebookSheet } from './NotebookSheet';
import { CharacterAvatar } from './CharacterAvatar';

export const Header: React.FC = () => {
  const { state, toggleLanguage, t } = useGame();
  const [notebookOpen, setNotebookOpen] = useState(false);

  const currentChapterInfo = CHAPTERS[state.chapter];
  const isPlayingChapter = state.screen === 'chapter';

  // Chapter tint styling
  const headerBgColor = isPlayingChapter ? currentChapterInfo.accentColor : '#FFF7E6';

  const currentChapterShortTitle = t(`chapter.${state.chapter}.shortTitle` as TranslationKey);
  const selectedCharacterName = state.character
    ? t(`char.${state.character}.name` as TranslationKey)
    : '';

  return (
    <>
      <header
        className="sticky top-0 z-30 w-full border-b-[3px] border-[#2B2D42] shadow-[0_3px_0_rgba(43,45,66,0.15)] transition-colors duration-200"
        style={{ backgroundColor: headerBgColor }}
      >
        <div className="max-w-[480px] mx-auto px-2 sm:px-3 py-2 flex flex-col gap-2">
          {/* Top row: Character/Icon + Title + Progress dots + Language Toggle + Notebook button */}
          <div className="flex items-center justify-between gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              {state.character ? (
                <div
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border-2 border-[#2B2D42] overflow-hidden flex items-center justify-center shrink-0"
                  title={selectedCharacterName}
                >
                  <CharacterAvatar
                    characterId={state.character}
                    alt={selectedCharacterName}
                    className="w-full h-full"
                    emojiClassName="text-base"
                  />
                </div>
              ) : (
                <span className="text-xl shrink-0" aria-hidden="true">
                  {isPlayingChapter ? currentChapterInfo.icon : '🚀'}
                </span>
              )}
              <span className="font-extrabold text-xs sm:text-sm text-[#2B2D42] truncate leading-tight">
                {isPlayingChapter
                  ? t('chapterShortLabel', { num: state.chapter, title: currentChapterShortTitle })
                  : state.screen === 'final'
                  ? t('victory')
                  : t('title')}
              </span>
            </div>

            {/* 5 Progress dots */}
            <div className="flex items-center gap-1 shrink-0" aria-label={t('progressDotsAria')}>
              {[1, 2, 3, 4, 5].map((ch) => {
                const isCompleted = state.chapterResults[ch] !== undefined;
                const isCurrent = isPlayingChapter && state.chapter === ch;
                const chAccent = CHAPTERS[ch].accentColor;

                let dotClasses = 'w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-[#2B2D42] transition-all';
                let dotStyle: React.CSSProperties = {};

                if (isCompleted) {
                  dotStyle = { backgroundColor: '#4ADE80' }; // mint filled
                } else if (isCurrent) {
                  dotClasses += ' ring-2 ring-[#2B2D42] scale-110';
                  dotStyle = { backgroundColor: chAccent };
                } else {
                  dotClasses += ' bg-white/70 opacity-60';
                }

                const chTitle = t(`chapter.${ch}.shortTitle` as TranslationKey);

                return (
                  <div
                    key={ch}
                    className={dotClasses}
                    style={dotStyle}
                    title={t('chapterDotTitle', { num: ch, title: chTitle })}
                  />
                );
              })}
            </div>

            {/* Right action buttons: EN / عربي + Notebook */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={toggleLanguage}
                dir="ltr"
                className="sticker-button shrink-0 min-h-[48px] px-2 py-1 bg-white flex items-center gap-1 text-[11px] font-bold text-[#2B2D42] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2B2D42]"
                aria-label={t('langToggleAria')}
                title={t('langToggleAria')}
              >
                <span className={state.language === 'en' ? 'font-black underline decoration-2' : 'opacity-60'}>
                  EN
                </span>
                <span className="opacity-40">/</span>
                <span className={state.language === 'ar' ? 'font-black underline decoration-2' : 'opacity-60'}>
                  عربي
                </span>
              </button>

              {/* 📒 Notebook Button */}
              <button
                onClick={() => setNotebookOpen(true)}
                className="sticker-button shrink-0 min-h-[48px] px-2 sm:px-2.5 py-1 bg-white flex items-center gap-1 text-xs font-bold text-[#2B2D42] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2B2D42]"
                title={t('openNotebook')}
                aria-label={t('openNotebook')}
              >
                <span className="text-base" aria-hidden="true">📒</span>
                <span className="hidden min-[375px]:inline">{t('notesButton')}</span>
                {state.notebook.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#FFD23F] border border-[#2B2D42] flex items-center justify-center text-[10px] font-black">
                    {state.notebook.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Bottom row: 3 Meters */}
          <div className="grid grid-cols-3 gap-2">
            <Meter type="cash" value={state.meters.cash} />
            <Meter type="value" value={state.meters.value} />
            <Meter type="slice" value={state.meters.slice} />
          </div>
        </div>
      </header>

      <NotebookSheet
        isOpen={notebookOpen}
        onClose={() => setNotebookOpen(false)}
        lessons={state.notebook}
      />
    </>
  );
};
