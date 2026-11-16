import React, { useState } from 'react';
import { useGame, CharacterId } from '../state/gameContext';
import { CHARACTERS } from '../assets/characters';
import { TranslationKey } from '../data/translations';
import { Button } from '../ui/Button';
import { CharacterAvatar } from '../ui/CharacterAvatar';

export const CharacterSelectScreen: React.FC = () => {
  const { state, setCharacter, setScreen, t } = useGame();
  const [selected, setSelected] = useState<CharacterId | null>(state.character);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleSelect = (id: CharacterId) => {
    setSelected(id);
    setCharacter(id);
  };

  const handleContinue = () => {
    if (!selected || isNavigating) return;
    setIsNavigating(true);
    setScreen('briefing');
  };

  return (
    <div className="flex flex-col flex-1 justify-between py-4 px-4">
      <div className="space-y-4">
        <div className="text-center space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#FF9F1C]">
            {t('charSelectStep')}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#2B2D42]">
            {t('chooseCharacter')}
          </h2>
          <p className="text-sm font-semibold text-[#2B2D42]/70">
            {t('charSelectPrompt')}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          {CHARACTERS.map((char) => {
            const isSelected = selected === char.id;
            const charName = t(`char.${char.id}.name` as TranslationKey);
            const charBadge = t(`char.${char.id}.badge` as TranslationKey);
            const charTagline = t(`char.${char.id}.tagline` as TranslationKey);

            return (
              <div
                key={char.id}
                onClick={() => handleSelect(char.id)}
                className={`sticker-card p-3 flex flex-col items-center text-center cursor-pointer transition-all duration-150 active:scale-95 ${
                  isSelected
                    ? 'ring-4 ring-[#FFD23F] bg-white translate-y-[-2px]'
                    : 'bg-white/90 hover:bg-white opacity-90'
                }`}
              >
                {/* Prominent Character Portrait Box preserving full proportions with object-contain */}
                <div
                  className={`w-full h-36 sm:h-44 rounded-[16px] border-[3px] overflow-hidden flex items-center justify-center mb-3 bg-white p-1.5 shadow-[0_3px_0_rgba(43,45,66,0.15)] ${
                    char.id === 'boy' ? 'border-[#5CC8FF]' : 'border-[#FF9F1C]'
                  }`}
                >
                  <CharacterAvatar
                    characterId={char.id}
                    alt={charName}
                    className="w-full h-full"
                    emojiClassName="text-6xl"
                  />
                </div>

                <div className="w-full space-y-1">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-lg font-black text-[#2B2D42]">
                      {charName}
                    </span>
                  </div>

                  <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FFF7E6] border border-[#2B2D42]/30 text-[#2B2D42]">
                    {charBadge}
                  </span>

                  <p className="text-xs text-[#2B2D42]/70 leading-snug line-clamp-2 pt-1">
                    {charTagline}
                  </p>
                </div>

                {/* Selection indicator checkmark */}
                <div className="mt-3">
                  <div
                    className={`w-7 h-7 rounded-full border-2 border-[#2B2D42] flex items-center justify-center font-black text-sm transition-colors ${
                      isSelected
                        ? 'bg-[#4ADE80] text-[#2B2D42]'
                        : 'bg-slate-100 text-transparent'
                    }`}
                  >
                    ✓
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky Bottom Action */}
      <div className="w-full pt-4 space-y-2">
        <Button
          variant="primary"
          size="large"
          disabled={!selected || isNavigating}
          onClick={handleContinue}
        >
          {selected ? t('continue') : t('pickAFounder')}
        </Button>
      </div>
    </div>
  );
};
