import React, { useState, useMemo } from 'react';
import { useGame } from '../../state/gameContext';
import { CHAPTERS } from '../../data/chapters';
import { IDEAS } from '../../data/ideas';
import { TranslationKey } from '../../data/translations';
import { offers, offerRanks, r10 } from '../../logic/math';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';

export const Chapter4Screen: React.FC = () => {
  const { state, completeChapter, t } = useGame();
  const currentChapter = CHAPTERS[4];

  const activeIdeaId = state.ideaId || 'pixel';
  const activeIdea = IDEAS[activeIdeaId];

  // Retrieve V0 and bankStars from state
  const ch3Result = state.chapterResults[3];
  const V0 = ch3Result?.V0 ?? (state.meters.value ?? 2560);
  const bankStars = ch3Result?.bankStars ?? 3;

  // Screen steps:
  // 0: Word Card (with 100% pie)
  // 1: Intro Card
  // 2: Offers selection
  // 3: Outcome table & reveal
  const [currentStep, setCurrentStep] = useState<0 | 1 | 2 | 3>(0);

  // Offers generated from logic
  const allOffers = useMemo(() => {
    return offers(activeIdea, V0, bankStars);
  }, [activeIdea, V0, bankStars]);

  const ranks = useMemo(() => {
    return offerRanks(allOffers);
  }, [allOffers]);

  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedOffer = useMemo(() => {
    return allOffers.find((o) => o.investorId === selectedOfferId) || null;
  }, [allOffers, selectedOfferId]);

  const handleConfirmDeal = () => {
    if (!selectedOffer || isSubmitting) return;
    setIsSubmitting(true);
    setCurrentStep(3);
    setTimeout(() => setIsSubmitting(false), 300);
  };

  const handleFinishChapter = () => {
    if (!selectedOffer || isSubmitting) return;
    setIsSubmitting(true);

    const currentCash = state.meters.cash ?? 40;
    const newCash = currentCash + selectedOffer.investment;
    const postMoneyValue = V0 + selectedOffer.investment;
    const founderSlice = selectedOffer.founderSlice;

    completeChapter(
      4,
      {
        investorId: selectedOffer.investorId,
        I: selectedOffer.investment,
        e: selectedOffer.equityGiven,
        own: founderSlice,
        FV: selectedOffer.futureValuation,
        stars: ranks[selectedOffer.investorId],
      },
      {
        cash: newCash,
        value: postMoneyValue,
        slice: founderSlice,
      },
      currentChapter.lesson
    );
  };

  const growthStarsMap: Record<number, string> = {
    1.10: '★',
    1.25: '★★',
    1.45: '★★★',
    1.0: '—',
  };

  return (
    <div className="flex flex-col flex-1 justify-between py-4 px-4">
      {/* ================= STEP 0: WORD OF CHAPTER ================= */}
      {currentStep === 0 && (
        <div className="flex flex-col flex-1 justify-between">
          <div className="my-auto space-y-4 text-center">
            <span className="inline-block text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border-2 border-[#2B2D42] bg-[#8B5CF6] text-white">
              {t('ch4.step0Badge')}
            </span>
            <div className="text-5xl" aria-hidden="true">
              {currentChapter.word.emoji}
            </div>

            <Card variant="white" className="p-6 text-center space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FF9F1C]">
                {t('wordOfChapter')}
              </span>
              <h2 className="text-3xl font-black text-[#2B2D42]">
                {t('chapter.4.word.term')}
              </h2>
              <p className="text-xl font-bold text-[#2B2D42]/80">
                "{t('chapter.4.word.def')}"
              </p>

              {/* Small pie showing 100% */}
              <div className="pt-2 flex flex-col items-center justify-center">
                <div
                  className="w-20 h-20 rounded-full border-[3px] border-[#2B2D42] shadow-[0_3px_0_rgba(43,45,66,0.2)] flex items-center justify-center"
                  style={{
                    background: 'conic-gradient(#FF9F1C 0% 100%, #E2E8F0 100%)',
                  }}
                />
                <span className="text-sm font-black text-[#2B2D42] mt-2">
                  {t('ch4.youOwn100')}
                </span>
              </div>
            </Card>

            <div className="p-3 bg-[#FFF7E6] rounded-[16px] border-2 border-[#2B2D42]/30 text-sm font-semibold text-[#2B2D42]/70">
              {t('ch4.step0Tip')}
            </div>
          </div>

          <div className="pt-4">
            <Button variant="primary" size="large" onClick={() => setCurrentStep(1)}>
              {t('ch4.continueBtn')}
            </Button>
          </div>
        </div>
      )}

      {/* ================= STEP 1: INTRO ================= */}
      {currentStep === 1 && (
        <div className="flex flex-col flex-1 justify-between space-y-4">
          <div className="my-auto space-y-4 text-center">
            <span className="text-5xl" aria-hidden="true">💼</span>
            <h2 className="text-3xl font-black text-[#2B2D42]">
              {t('ch4.introTitle')}
            </h2>

            <Card variant="white" className="p-5 text-center space-y-3">
              <p className="text-lg font-bold text-[#2B2D42] leading-snug">
                {t('ch4.introDesc')}
              </p>
              <div className="p-3 bg-[#EDE9FE] rounded-[14px] border-2 border-[#8B5CF6] text-sm font-black text-[#5B21B6]">
                {t('ch4.introFormula')}
              </div>
            </Card>

            <div className="p-3 bg-[#FFF7E6] rounded-[16px] border-2 border-[#2B2D42]/30 text-xs font-bold text-[#2B2D42]/70">
              {t('ch4.step1Tip')}
            </div>
          </div>

          <div className="pt-4">
            <Button variant="primary" size="large" onClick={() => setCurrentStep(2)}>
              {t('ch4.seeOffersBtn')}
            </Button>
          </div>
        </div>
      )}

      {/* ================= STEP 2: OFFERS ================= */}
      {currentStep === 2 && (
        <div className="flex flex-col flex-1 justify-between space-y-3">
          <div className="space-y-3">
            <div className="text-center space-y-0.5">
              <span className="text-xs font-black uppercase tracking-wider text-[#8B5CF6]">
                {t('ch4.pitchEyebrow')}
              </span>
              <h2 className="text-2xl font-black text-[#2B2D42]">
                {t('ch4.chooseOfferTitle')}
              </h2>
              <p className="text-xs font-semibold text-[#2B2D42]/70">
                {t('ch4.preMoneyVal', { V0 })}
              </p>
            </div>

            {/* List of 4 cards */}
            <div className="space-y-2.5">
              {allOffers.map((offer) => {
                const isSelected = selectedOfferId === offer.investorId;
                const isNone = offer.investorId === 'none';
                const investorName = t(`ch4.investor.${offer.investorId}.name` as TranslationKey);

                return (
                  <div
                    key={offer.investorId}
                    onClick={() => setSelectedOfferId(offer.investorId)}
                    className={`rounded-[18px] p-3 cursor-pointer transition-all active:scale-[0.98] ${
                      isSelected
                        ? 'border-[3px] border-[#8B5CF6] bg-[#F5F3FF] ring-2 ring-[#8B5CF6] shadow-[0_3px_0_#8B5CF6]'
                        : 'border-[3px] border-[#2B2D42] bg-white shadow-[0_3px_0_rgba(43,45,66,0.15)] hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{offer.icon}</span>
                        <div>
                          <h3 className="text-sm font-black text-[#2B2D42] leading-tight">
                            {investorName}
                          </h3>
                          <div className="text-xs font-bold text-[#2B2D42]/80 mt-0.5">
                            {isNone ? (
                              <span>{t('ch4.bootstrapped')}</span>
                            ) : (
                              <span>
                                {t('ch4.givesAmount')}{' '}
                                <strong dir="ltr" className="text-[#166534] inline-block">${offer.investment}</strong> ·{' '}
                                {t('ch4.takesSlice')}{' '}
                                <strong dir="ltr" className="text-[#991B1B] inline-block">{offer.equityGiven}%</strong>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Mini pie */}
                      <div className="flex flex-col items-center shrink-0">
                        <div
                          className="w-8 h-8 rounded-full border-2 border-[#2B2D42]"
                          style={{
                            background: `conic-gradient(#FF9F1C 0% ${offer.founderSlice}%, #8B5CF6 ${offer.founderSlice}% 100%)`,
                          }}
                          title={t('ch4.youKeepTitle', { slice: offer.founderSlice })}
                        />
                        <span dir="ltr" className="text-[10px] font-black text-[#2B2D42] mt-0.5 inline-block">
                          {offer.founderSlice}%
                        </span>
                      </div>
                    </div>

                    {/* Fair chip & Growth help */}
                    <div className="mt-2 pt-2 border-t border-[#2B2D42]/10 flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-full font-black text-[10px] border ${
                            offer.label === 'greedy'
                              ? 'bg-[#FEE2E2] text-[#991B1B] border-[#991B1B]'
                              : offer.label === 'generous'
                              ? 'bg-[#DCFCE7] text-[#166534] border-[#166534]'
                              : 'bg-[#FEF3C7] text-[#92400E] border-[#92400E]'
                          }`}
                        >
                          {offer.label === 'greedy'
                            ? t('ch4.labelGreedy')
                            : offer.label === 'generous'
                            ? t('ch4.labelGenerous')
                            : t('ch4.labelFair')}
                        </span>
                        <span className="text-[10px] font-semibold text-[#2B2D42]/60">
                          {isNone
                            ? t('ch4.noDilution')
                            : t('ch4.fairSliceApprox', { pct: offer.fairEquity })}
                        </span>
                      </div>

                      <div className="text-[11px] font-bold text-[#8B5CF6] shrink-0">
                        {t('ch4.growthLabel')} <span dir="ltr" className="inline-block">{growthStarsMap[offer.growthBoost] || '★'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detail panel when selected */}
            {selectedOffer && (
              <div className="p-3 bg-[#FFF7E6] rounded-[16px] border-2 border-[#2B2D42] text-xs font-bold text-[#2B2D42] space-y-1 animate-in fade-in duration-150">
                <div className="flex justify-between">
                  <span>{t('ch4.companyAfterDeal')}</span>
                  <span dir="ltr" className="font-black inline-block">${V0 + selectedOffer.investment}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('ch4.youKeepLabel')}</span>
                  <span className="font-black text-[#FF9F1C]">
                    {t('ch4.slicePct', { slice: selectedOffer.founderSlice })}
                  </span>
                </div>
              </div>
            )}

            <p className="text-[11px] text-center font-bold text-[#2B2D42]/60">
              {t('ch4.introFormula')}
            </p>
          </div>

          <div className="pt-2">
            <Button
              variant="primary"
              size="large"
              disabled={!selectedOffer || isSubmitting}
              onClick={handleConfirmDeal}
            >
              {selectedOffer
                ? t('ch4.takeDealBtn', {
                    name: t(`ch4.investor.${selectedOffer.investorId}.name` as TranslationKey),
                  })
                : t('ch4.selectOfferBtn')}
            </Button>
          </div>
        </div>
      )}

      {/* ================= STEP 3: OUTCOME TABLE ================= */}
      {currentStep === 3 && selectedOffer && (
        <div className="flex flex-col flex-1 justify-between space-y-4">
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-[#8B5CF6]">
                {t('ch4.outcomeEyebrow')}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#2B2D42]">
                {t('ch4.oneYearLater')}
              </h2>
              <p className="text-xs font-bold text-[#2B2D42]/70">
                {t('ch4.ifPickedEach')}
              </p>
            </div>

            {/* Comparison Table */}
            <div className="rounded-[18px] border-[3px] border-[#2B2D42] bg-white overflow-hidden shadow-[0_4px_0_rgba(43,45,66,0.2)]">
              <div className="grid grid-cols-4 bg-[#EDE9FE] px-2 py-2 border-b-2 border-[#2B2D42] text-[10px] font-black text-[#5B21B6] uppercase">
                <span>{t('ch4.colOption')}</span>
                <span className="text-end">{t('ch4.colValue')}</span>
                <span className="text-end">{t('ch4.colSlice')}</span>
                <span className="text-end">{t('ch4.colRank')}</span>
              </div>

              <div className="divide-y divide-[#2B2D42]/10 text-xs">
                {allOffers.map((o) => {
                  const isPlayerPick = o.investorId === selectedOffer.investorId;
                  const rankStars = ranks[o.investorId];
                  const payoutVal = r10(o.payout);
                  const invName = t(`ch4.investor.${o.investorId}.name` as TranslationKey);

                  return (
                    <div
                      key={o.investorId}
                      className={`grid grid-cols-4 px-2 py-2.5 items-center ${
                        isPlayerPick ? 'bg-[#DCFCE7] font-black' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-1 truncate">
                        <span>{o.icon}</span>
                        <span className="truncate text-xs">
                          {invName} {isPlayerPick && t('youMarker')}
                        </span>
                      </div>
                      <div dir="ltr" className="text-end tabular-nums text-xs font-bold">
                        ${o.futureValuation}
                      </div>
                      <div className="text-end text-xs">
                        <span dir="ltr" className="font-bold text-[#FF9F1C] inline-block">{o.founderSlice}%</span>
                        <span dir="ltr" className="text-[10px] text-[#2B2D42]/60 block leading-none">
                          (${payoutVal})
                        </span>
                      </div>
                      <div dir="ltr" className="text-end text-xs text-[#FFD23F] font-black">
                        {rankStars > 0 ? '★'.repeat(rankStars) : '0★'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Winner explanation */}
            <div className="p-3 bg-[#FFF7E6] rounded-[16px] border-2 border-[#2B2D42] text-xs font-bold text-[#2B2D42]">
              <span className="text-[10px] uppercase font-black text-[#FF9F1C] block">
                {t('ch4.insightLabel')}
              </span>
              <p className="mt-0.5">
                {t(`ch4.insight.${activeIdeaId}` as TranslationKey)}
              </p>
            </div>

            {/* Lesson earned card */}
            <div className="rounded-[16px] border-2 border-[#2B2D42] bg-[#DCFCE7] p-3 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#166534]">
                {t('addedToNotebook')}
              </span>
              <p className="text-xs sm:text-sm font-bold text-[#166534] mt-0.5">
                "{t('chapter.4.lesson')}"
              </p>
            </div>
          </div>

          <div className="pt-4">
            <Button
              variant="primary"
              size="large"
              disabled={isSubmitting}
              onClick={handleFinishChapter}
            >
              {t('ch4.nextChapterBtn')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
