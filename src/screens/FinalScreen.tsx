import React, { useMemo } from 'react';
import { useGame } from '../state/gameContext';
import { IDEAS } from '../data/ideas';
import { TranslationKey } from '../data/translations';
import { founderTitle, bestPlan, offers, exits, offerRanks } from '../logic/math';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { CharacterAvatar } from '../ui/CharacterAvatar';

export const FinalScreen: React.FC = () => {
  const { state, resetGame, setScreen, t } = useGame();

  const activeIdeaId = state.ideaId || 'pixel';
  const activeIdea = IDEAS[activeIdeaId];
  const activeIdeaName = t(`idea.${activeIdeaId}.name` as TranslationKey);

  // Retrieve results from each chapter
  const ch1 = state.chapterResults[1];
  const ch2 = state.chapterResults[2];
  const ch3 = state.chapterResults[3];
  const ch4 = state.chapterResults[4];
  const ch5 = state.chapterResults[5];

  const projectStars = ch1?.stars ?? 3;
  const planStars = ch2?.stars ?? 3;
  const bankStars = ch3?.bankStars ?? 3;
  const vcStars = ch4?.stars ?? 2;
  const exitStars = ch5?.stars ?? 3;

  const totalStars = projectStars + planStars + bankStars + vcStars + exitStars;
  const titleInfo = founderTitle(totalStars);

  const translatedFounderTitle =
    totalStars >= 12
      ? t('final.title.builder')
      : totalStars >= 8
      ? t('final.title.smart')
      : t('final.title.rookie');

  const isCelebratory =
    titleInfo.title.includes('Business Builder') || titleInfo.title.includes('Smart Founder');

  // 20 confetti pieces only if Business Builder or Smart Founder
  const confettiPieces = useMemo(() => {
    if (!isCelebratory) return [];
    const colors = ['#FFD23F', '#5CC8FF', '#4ADE80', '#FF6B6B', '#8B5CF6', '#FF9F1C'];
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      color: colors[i % colors.length],
      left: `${(i * 17) % 94 + 3}%`,
      delay: `${((i * 130) % 800) / 1000}s`,
    }));
  }, [isCelebratory]);

  // "Your wealth": chosen exit's number
  const exitId = (ch5?.exitId || 'raise') as 'sell' | 'keep' | 'raise';
  const wealth = ch5?.wealth ?? (state.meters.cash ?? 8060);
  const wealthLabel = exitId === 'sell' ? t('final.wealthCash') : t('final.wealthSlice');

  // Investor details
  const chosenInvestorId = (ch4?.investorId || 'friendly') as 'bigbucks' | 'friendly' | 'seed' | 'none';
  const investorName =
    chosenInvestorId === 'none'
      ? t('final.bpNoInvestor')
      : t(`ch4.investor.${chosenInvestorId}.name` as TranslationKey);
  const keptSlice = ch4?.own ?? (state.meters.slice ?? 82);

  // Best path hints
  const bestPlanData = useMemo(() => bestPlan(activeIdea), [activeIdea]);

  const bestInvestorId = useMemo(() => {
    const V0 = ch3?.V0 ?? 2560;
    const allOffers = offers(activeIdea, V0, bankStars);
    const ranks = offerRanks(allOffers);
    const topOffer = allOffers.find((o) => ranks[o.investorId] === 3);
    return topOffer ? topOffer.investorId : 'friendly';
  }, [activeIdea, ch3, bankStars]);

  const bestExitType = useMemo(() => {
    const FV = ch4?.FV ?? 6400;
    const own = ch4?.own ?? 82;
    const exitsData = exits(activeIdea, FV, own);
    const topExit = exitsData.options.find((o) => exitsData.stars[o.type] === 3);
    return topExit ? topExit.type : 'raise';
  }, [activeIdea, ch4]);

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handlePlayAgain = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    resetGame();
  };

  const handleTryAnother = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    resetGame();
    setScreen('chapter');
  };

  const characterName = state.character
    ? t(`char.${state.character}.name` as TranslationKey)
    : t('founderFallback');

  return (
    <div className="relative flex flex-col flex-1 justify-between py-4 px-4 overflow-x-hidden">
      {/* 20 CSS Confetti pieces (only for Business Builder or Smart Founder) */}
      {isCelebratory && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {confettiPieces.map((p) => (
            <div
              key={p.id}
              className="confetti-piece"
              style={{
                backgroundColor: p.color,
                left: p.left,
                animationDelay: p.delay,
              }}
            />
          ))}
        </div>
      )}

      <div className="space-y-4 my-auto relative z-10">
        {/* Title & Founder Badge with Character Portrait */}
        <div className="text-center space-y-2">
          {state.character ? (
            <div className="w-24 h-24 mx-auto rounded-[20px] bg-white border-[3px] border-[#2B2D42] p-1 shadow-[0_4px_0_rgba(43,45,66,0.2)] flex items-center justify-center overflow-hidden">
              <CharacterAvatar
                characterId={state.character}
                alt={characterName}
                className="w-full h-full"
                emojiClassName="text-5xl"
              />
            </div>
          ) : (
            <div className="text-5xl" aria-hidden="true">
              {totalStars >= 12 ? '🏆' : totalStars >= 8 ? '⭐' : '🌱'}
            </div>
          )}
          <h1 className="text-3xl font-black text-[#2B2D42]">
            {translatedFounderTitle}
          </h1>
          <div className="inline-block px-3 py-1 bg-[#FFD23F] rounded-full border-2 border-[#2B2D42] text-sm font-black text-[#2B2D42]">
            {t('final.totalStars', { stars: totalStars })}
          </div>
        </div>

        {/* Your Wealth Card */}
        <Card variant="white" className="p-4 text-center space-y-1 shadow-[0_4px_0_rgba(43,45,66,0.2)]">
          <span className="text-xs font-bold uppercase tracking-wider text-[#2B2D42]/60">
            {t('final.yourWealth', { label: wealthLabel })}
          </span>
          <div dir="ltr" className="text-3xl sm:text-4xl font-black text-[#166534] tabular-nums">
            {t('final.coinsAmount', { amount: wealth })}
          </div>
          <p className="text-xs font-bold text-[#2B2D42]/70">
            {t('final.finishedLine', { name: characterName })}
          </p>
        </Card>

        {/* Star table per chapter */}
        <div className="rounded-[18px] border-[3px] border-[#2B2D42] bg-white overflow-hidden shadow-[0_4px_0_rgba(43,45,66,0.15)]">
          <div className="bg-[#FFF7E6] px-3 py-2 border-b-2 border-[#2B2D42] text-xs font-black text-[#2B2D42] uppercase">
            {t('final.scorecardTitle')}
          </div>
          <div className="divide-y divide-[#2B2D42]/10 text-xs font-bold">
            <div className="flex justify-between px-3 py-2">
              <span>{t('final.row1')}</span>
              <span dir="ltr" className="text-[#FFD23F]">{'★'.repeat(projectStars)}</span>
            </div>
            <div className="flex justify-between px-3 py-2">
              <span>{t('final.row2')}</span>
              <span dir="ltr" className="text-[#FFD23F]">
                {planStars > 0 ? '★'.repeat(planStars) : '0★'}
              </span>
            </div>
            <div className="flex justify-between px-3 py-2">
              <span>{t('final.row3')}</span>
              <span dir="ltr" className="text-[#FFD23F]">
                {bankStars > 0 ? '★'.repeat(bankStars) : '0★'}
              </span>
            </div>
            <div className="flex justify-between px-3 py-2">
              <span>{t('final.row4')}</span>
              <span dir="ltr" className="text-[#FFD23F]">
                {vcStars > 0 ? '★'.repeat(vcStars) : '0★'}
              </span>
            </div>
            <div className="flex justify-between px-3 py-2">
              <span>{t('final.row5')}</span>
              <span dir="ltr" className="text-[#FFD23F]">{'★'.repeat(exitStars)}</span>
            </div>
          </div>
        </div>

        {/* Your Journey Card */}
        <div className="rounded-[18px] border-[3px] border-[#2B2D42] bg-white p-3.5 space-y-2 text-xs font-bold shadow-[0_4px_0_rgba(43,45,66,0.15)]">
          <div className="text-xs font-black uppercase text-[#FF9F1C] pb-1 border-b border-[#2B2D42]/10">
            {t('final.blueprintTitle')}
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-[#2B2D42]/60 shrink-0">{t('final.bpIdea')}</span>
            <span className="text-[#2B2D42] text-end">{activeIdeaName} {activeIdea.icon}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-[#2B2D42]/60 shrink-0">{t('final.bpV0')}</span>
            <span dir="ltr" className="text-[#2B2D42] inline-block">${ch3?.V0 ?? 2560}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-[#2B2D42]/60 shrink-0">{t('final.bpInvestor')}</span>
            <span className="text-[#2B2D42] text-end">
              {investorName} {t('final.bpSlicePct', { slice: keptSlice })}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-[#2B2D42]/60 shrink-0">{t('final.bpExit')}</span>
            <span className="text-[#166534]">
              {t(`ch5.exit.${exitId}.title` as TranslationKey)}
            </span>
          </div>
        </div>

        {/* Best Path Hints Card */}
        <div className="rounded-[18px] border-2 border-[#2B2D42] bg-[#EDE9FE] p-3 text-xs font-bold text-[#5B21B6] space-y-1.5 shadow-[0_3px_0_rgba(43,45,66,0.15)]">
          <div className="text-[10px] uppercase font-black tracking-wider text-[#8B5CF6]">
            {t('final.hintsTitle', { name: activeIdeaName })}
          </div>
          <p>
            • <strong>{t('final.hintBestPlan')}</strong>{' '}
            {t('final.hintPlanLine', {
              price: activeIdea.prices[bestPlanData.combo.priceIdx],
              cost: t(`ch2.cost.${bestPlanData.combo.costIdx}` as TranslationKey),
              team: t(`ch2.team.${bestPlanData.combo.teamIdx}` as TranslationKey),
              profit: bestPlanData.profit,
            })}
          </p>
          <p>
            • <strong>{t('final.hintBestInvestor')}</strong>{' '}
            {t(`ch4.investor.${bestInvestorId}.name` as TranslationKey)} {t('final.rank1')}
          </p>
          <p>
            • <strong>{t('final.hintBestExit')}</strong>{' '}
            {t(`ch5.exit.${bestExitType}.title` as TranslationKey)} {t('final.rank1')}
          </p>
        </div>

        {/* Notebook Summary with 5 lessons */}
        <div className="rounded-[18px] border-2 border-[#2B2D42] bg-white p-3.5 space-y-2 text-xs shadow-[0_3px_0_rgba(43,45,66,0.15)]">
          <div className="font-black text-[#2B2D42] flex items-center justify-between pb-1 border-b border-[#2B2D42]/10">
            <span className="flex items-center gap-1.5">
              <span>📒</span> {t('final.lessonsTitle')}
            </span>
            <span className="text-[10px] text-[#4ADE80] font-black">{t('final.completed5')}</span>
          </div>

          <div className="space-y-1.5 pt-1">
            {[1, 2, 3, 4, 5].map((num) => (
              <div key={num} className="text-[#2B2D42] flex items-start gap-1.5">
                <span className="text-[#FF9F1C] font-black shrink-0">{num}.</span>
                <span className="font-semibold text-[#2B2D42]/90 leading-tight">
                  "{t(`chapter.${num}.lesson` as TranslationKey)}"
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons: Play again & Try another idea */}
      <div className="w-full pt-4 space-y-2 relative z-10">
        <Button variant="primary" size="large" disabled={isSubmitting} onClick={handlePlayAgain}>
          {t('final.playAgain')}
        </Button>
        <Button
          variant="secondary"
          size="normal"
          disabled={isSubmitting}
          onClick={handleTryAnother}
        >
          {t('final.tryAnother')}
        </Button>
      </div>
    </div>
  );
};
