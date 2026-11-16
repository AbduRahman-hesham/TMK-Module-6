import React, { useState, useMemo } from 'react';
import { useGame } from '../../state/gameContext';
import { IDEAS } from '../../data/ideas';
import { CHAPTER2_PROBLEMS, CHAPTER2_CUSTOMERS } from '../../data/chapter2';
import { CHAPTERS } from '../../data/chapters';
import { TranslationKey } from '../../data/translations';
import { monthlyProfit, bestPlan, planStars } from '../../logic/math';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';

export const Chapter2Screen: React.FC = () => {
  const { state, completeChapter, t } = useGame();
  const currentChapter = CHAPTERS[2];

  const activeIdeaId = state.ideaId || 'pixel';
  const activeIdea = IDEAS[activeIdeaId];
  const activeIdeaName = t(`idea.${activeIdeaId}.name` as TranslationKey);

  // Screen steps:
  // 0: Word Card
  // 1: Plan Board & Calculator
  // 2: Plan Summary & Result
  const [currentStep, setCurrentStep] = useState<0 | 1 | 2>(0);

  // --- Step 1 State: Plan Board (5 boxes) ---
  const [openBox, setOpenBox] = useState<1 | 2 | 3 | 4 | 5 | null>(1);

  // Box 1: Problem
  const [problemSelected, setProblemSelected] = useState<boolean>(false);
  const [problemFirstTry, setProblemFirstTry] = useState<boolean>(true);
  const [hasAttemptedProblem, setHasAttemptedProblem] = useState<boolean>(false);
  const [greyedProblems, setGreyedProblems] = useState<number[]>([]);
  const [hasProblemError, setHasProblemError] = useState<boolean>(false);
  const [shakeProblemIndex, setShakeProblemIndex] = useState<number | null>(null);

  // Box 2: Customers
  const [customersSelected, setCustomersSelected] = useState<boolean>(false);
  const [customersFirstTry, setCustomersFirstTry] = useState<boolean>(true);
  const [hasAttemptedCustomers, setHasAttemptedCustomers] = useState<boolean>(false);
  const [greyedCustomers, setGreyedCustomers] = useState<number[]>([]);
  const [hasCustomersError, setHasCustomersError] = useState<boolean>(false);
  const [shakeCustomersIndex, setShakeCustomersIndex] = useState<number | null>(null);

  // Box 3: Price (0, 1, 2)
  const [priceIdx, setPriceIdx] = useState<number | null>(null);

  // Box 4: Costs (0: Cheap, 1: Good, 2: Fancy)
  const [costIdx, setCostIdx] = useState<number | null>(null);

  // Box 5: Team (0: Just me, 1: +1 helper, 2: +2 helpers)
  const [teamIdx, setTeamIdx] = useState<number | null>(null);

  // Compute profit breakdown when boxes 3, 4, 5 are chosen
  const hasNumbers = priceIdx !== null && costIdx !== null && teamIdx !== null;
  const profitBreakdown = useMemo(() => {
    if (!hasNumbers) return null;
    return monthlyProfit(activeIdea, {
      priceIdx: priceIdx!,
      costIdx: costIdx!,
      teamIdx: teamIdx!,
    });
  }, [activeIdea, hasNumbers, priceIdx, costIdx, teamIdx]);

  const bestPlanData = useMemo(() => {
    return bestPlan(activeIdea);
  }, [activeIdea]);

  const allBoxesDone =
    problemSelected &&
    customersSelected &&
    priceIdx !== null &&
    costIdx !== null &&
    teamIdx !== null;

  const isProfitable = profitBreakdown ? profitBreakdown.profit > 0 : false;

  // Handlers for Problem selection
  const handleProblemTap = (index: number) => {
    if (problemSelected || greyedProblems.includes(index)) return;

    const option = CHAPTER2_PROBLEMS[activeIdeaId][index];
    if (!hasAttemptedProblem) {
      setHasAttemptedProblem(true);
      if (!option.isCorrect) {
        setProblemFirstTry(false);
      }
    }

    if (option.isCorrect) {
      setProblemSelected(true);
      setHasProblemError(false);
      setOpenBox(2);
    } else {
      setShakeProblemIndex(index);
      setTimeout(() => setShakeProblemIndex(null), 300);
      setGreyedProblems((prev) => [...prev, index]);
      setHasProblemError(true);
    }
  };

  // Handlers for Customer selection
  const handleCustomerTap = (index: number) => {
    if (customersSelected || greyedCustomers.includes(index)) return;

    const option = CHAPTER2_CUSTOMERS[activeIdeaId][index];
    if (!hasAttemptedCustomers) {
      setHasAttemptedCustomers(true);
      if (!option.isCorrect) {
        setCustomersFirstTry(false);
      }
    }

    if (option.isCorrect) {
      setCustomersSelected(true);
      setHasCustomersError(false);
      setOpenBox(3);
    } else {
      setShakeCustomersIndex(index);
      setTimeout(() => setShakeCustomersIndex(null), 300);
      setGreyedCustomers((prev) => [...prev, index]);
      setHasCustomersError(true);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handlePriceSelect = (idx: number) => {
    setPriceIdx(idx);
    if (costIdx === null) setOpenBox(4);
  };

  const handleCostSelect = (idx: number) => {
    setCostIdx(idx);
    if (teamIdx === null) setOpenBox(5);
  };

  const handleTeamSelect = (idx: number) => {
    setTeamIdx(idx);
    setOpenBox(null);
  };

  const handleLockPlan = () => {
    if (!allBoxesDone || !isProfitable || isSubmitting) return;
    setIsSubmitting(true);
    setCurrentStep(2);
    setTimeout(() => setIsSubmitting(false), 200);
  };

  const planStarsEarned = useMemo(() => {
    if (!profitBreakdown) return 0;
    return planStars(profitBreakdown.profit, bestPlanData.profit);
  }, [profitBreakdown, bestPlanData]);

  const handleFinishChapter = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    completeChapter(
      2,
      {
        problemFirstTry,
        customersFirstTry,
        priceIdx: priceIdx!,
        costIdx: costIdx!,
        teamIdx: teamIdx!,
        profit: profitBreakdown!.profit,
        bestProfit: bestPlanData.profit,
        stars: planStarsEarned,
      },
      {}, // Meters unchanged
      currentChapter.lesson
    );
  };

  const qualityStars = ['⭐', '⭐⭐', '⭐⭐⭐'];
  const correctProblemIdx = CHAPTER2_PROBLEMS[activeIdeaId].findIndex((p) => p.isCorrect);
  const correctCustomerIdx = CHAPTER2_CUSTOMERS[activeIdeaId].findIndex((c) => c.isCorrect);

  return (
    <div className="flex flex-col flex-1 justify-between py-4 px-4">
      {/* ================= STEP 0: WORD OF CHAPTER ================= */}
      {currentStep === 0 && (
        <div className="flex flex-col flex-1 justify-between">
          <div className="my-auto space-y-4 text-center">
            <span
              className="inline-block text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border-2 border-[#2B2D42] bg-[#FFD23F]"
            >
              {t('ch2.step0Badge')}
            </span>
            <div className="text-5xl" aria-hidden="true">
              {currentChapter.word.emoji}
            </div>

            <Card variant="white" className="p-6 text-center space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FF9F1C]">
                {t('wordOfChapter')}
              </span>
              <h2 className="text-3xl font-black text-[#2B2D42]">
                {t('chapter.2.word.term')}
              </h2>
              <p className="text-xl font-bold text-[#2B2D42]/80">
                "{t('chapter.2.word.def')}"
              </p>
            </Card>

            <div className="p-3 bg-[#FFF7E6] rounded-[16px] border-2 border-[#2B2D42]/30 text-sm font-semibold text-[#2B2D42]/70">
              {t('ch2.step0Tip')}
            </div>
          </div>

          <div className="pt-4">
            <Button variant="primary" size="large" onClick={() => setCurrentStep(1)}>
              {t('ch2.writePlanBtn')}
            </Button>
          </div>
        </div>
      )}

      {/* ================= STEP 1: PLAN BOARD & PROFIT CALCULATOR ================= */}
      {currentStep === 1 && (
        <div className="flex flex-col flex-1 justify-between space-y-4">
          <div className="space-y-3">
            <div className="text-center space-y-0.5">
              <span className="text-xs font-black uppercase tracking-wider text-[#FF9F1C]">
                {t('ch2.eyebrow')}
              </span>
              <h2 className="text-2xl font-black text-[#2B2D42]">
                {t('ch2.buildPlanTitle')}
              </h2>
              <p className="text-xs font-semibold text-[#2B2D42]/70">
                {t('ch2.buildPlanSub')}
              </p>
            </div>

            {/* Stepper Boxes */}
            <div className="space-y-2.5">
              {/* Box 1: Problem */}
              <div className="rounded-[18px] border-2 border-[#2B2D42] bg-white overflow-hidden shadow-[0_3px_0_rgba(43,45,66,0.15)]">
                {openBox !== 1 ? (
                  <div
                    onClick={() => setOpenBox(1)}
                    className="p-3 flex items-center justify-between cursor-pointer bg-white hover:bg-slate-50 transition-colors gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl shrink-0">🧩</span>
                      <div className="min-w-0">
                        <span className="text-xs font-bold uppercase text-[#2B2D42]/60 block leading-tight">
                          {t('ch2.box1Title')}
                        </span>
                        <span className="text-sm font-black text-[#2B2D42] truncate block">
                          {problemSelected && correctProblemIdx >= 0
                            ? t(`ch2.problem.${activeIdeaId}.${correctProblemIdx}` as TranslationKey)
                            : t('ch2.box1Choose')}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-[#FF9F1C] shrink-0">
                      {problemSelected ? t('ch2.edit') : t('ch2.open')}
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-[#FFFDF7] space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between pb-1 border-b border-[#2B2D42]/10">
                      <span className="font-black text-sm text-[#2B2D42] flex items-center gap-1.5">
                        <span>🧩</span> {t('ch2.box1Question')}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {CHAPTER2_PROBLEMS[activeIdeaId].map((option, idx) => {
                        const isGreyed = greyedProblems.includes(idx);
                        const isSelected = problemSelected && option.isCorrect;
                        const isShaking = shakeProblemIndex === idx;

                        return (
                          <div
                            key={idx}
                            onClick={() => handleProblemTap(idx)}
                            className={`p-2.5 rounded-[14px] border-2 border-[#2B2D42] cursor-pointer text-xs font-bold transition-all ${
                              isShaking ? 'shake-wrong border-[#FF6B6B]' : ''
                            } ${
                              isSelected
                                ? 'bg-[#DCFCE7] border-[#166534] text-[#166534]'
                                : isGreyed
                                ? 'bg-slate-100 opacity-40 border-slate-300 text-slate-400'
                                : 'bg-white hover:bg-yellow-50 text-[#2B2D42]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span>{t(`ch2.problem.${activeIdeaId}.${idx}` as TranslationKey)}</span>
                              {isSelected && <span>✔</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {hasProblemError && (
                      <p className="text-xs font-bold text-[#FF6B6B] text-center shake-wrong">
                        {t('ch2.problemWrong')}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Box 2: Customers */}
              <div className="rounded-[18px] border-2 border-[#2B2D42] bg-white overflow-hidden shadow-[0_3px_0_rgba(43,45,66,0.15)]">
                {openBox !== 2 ? (
                  <div
                    onClick={() => setOpenBox(2)}
                    className="p-3 flex items-center justify-between cursor-pointer bg-white hover:bg-slate-50 transition-colors gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl shrink-0">👥</span>
                      <div className="min-w-0">
                        <span className="text-xs font-bold uppercase text-[#2B2D42]/60 block leading-tight">
                          {t('ch2.box2Title')}
                        </span>
                        <span className="text-sm font-black text-[#2B2D42] truncate block">
                          {customersSelected && correctCustomerIdx >= 0
                            ? t(`ch2.customer.${activeIdeaId}.${correctCustomerIdx}` as TranslationKey)
                            : t('ch2.box2Choose')}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-[#FF9F1C] shrink-0">
                      {customersSelected ? t('ch2.edit') : t('ch2.open')}
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-[#FFFDF7] space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between pb-1 border-b border-[#2B2D42]/10">
                      <span className="font-black text-sm text-[#2B2D42] flex items-center gap-1.5">
                        <span>👥</span> {t('ch2.box2Question')}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {CHAPTER2_CUSTOMERS[activeIdeaId].map((option, idx) => {
                        const isGreyed = greyedCustomers.includes(idx);
                        const isSelected = customersSelected && option.isCorrect;
                        const isShaking = shakeCustomersIndex === idx;

                        return (
                          <div
                            key={idx}
                            onClick={() => handleCustomerTap(idx)}
                            className={`p-2.5 rounded-[14px] border-2 border-[#2B2D42] cursor-pointer text-xs font-bold transition-all ${
                              isShaking ? 'shake-wrong border-[#FF6B6B]' : ''
                            } ${
                              isSelected
                                ? 'bg-[#DCFCE7] border-[#166534] text-[#166534]'
                                : isGreyed
                                ? 'bg-slate-100 opacity-40 border-slate-300 text-slate-400'
                                : 'bg-white hover:bg-yellow-50 text-[#2B2D42]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span>{t(`ch2.customer.${activeIdeaId}.${idx}` as TranslationKey)}</span>
                              {isSelected && <span>✔</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {hasCustomersError && (
                      <p className="text-xs font-bold text-[#FF6B6B] text-center shake-wrong">
                        {t('ch2.customersWrong')}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Box 3: Price */}
              <div className="rounded-[18px] border-2 border-[#2B2D42] bg-white overflow-hidden shadow-[0_3px_0_rgba(43,45,66,0.15)]">
                {openBox !== 3 ? (
                  <div
                    onClick={() => setOpenBox(3)}
                    className="p-3 flex items-center justify-between cursor-pointer bg-white hover:bg-slate-50 transition-colors gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl shrink-0">💵</span>
                      <div className="min-w-0">
                        <span className="text-xs font-bold uppercase text-[#2B2D42]/60 block leading-tight">
                          {t('ch2.box3Title')}
                        </span>
                        <span className="text-sm font-black text-[#2B2D42]">
                          {priceIdx !== null ? (
                            <span dir="ltr" className="inline-block">${activeIdea.prices[priceIdx]}</span>
                          ) : (
                            t('ch2.box3Choose')
                          )}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-[#FF9F1C] shrink-0">
                      {priceIdx !== null ? t('ch2.change') : t('ch2.open')}
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-[#FFFDF7] space-y-2 animate-in fade-in duration-150">
                    <div>
                      <span className="font-black text-sm text-[#2B2D42] flex items-center gap-1.5">
                        <span>💵</span> {t('ch2.box3Question')}
                      </span>
                      <p className="text-[11px] font-bold text-[#2B2D42]/70">
                        {t('ch2.box3Hint')}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {activeIdea.prices.map((p, idx) => {
                        const isSelected = priceIdx === idx;
                        const labelKey = idx === 0 ? 'ch2.priceLow' : idx === 1 ? 'ch2.priceMedium' : 'ch2.priceHigh';
                        return (
                          <button
                            key={idx}
                            onClick={() => handlePriceSelect(idx)}
                            className={`p-2.5 rounded-[14px] border-2 border-[#2B2D42] text-center font-black cursor-pointer transition-all active:scale-95 ${
                              isSelected
                                ? 'bg-[#FFD23F] ring-2 ring-[#2B2D42] shadow-[0_2px_0_#2B2D42]'
                                : 'bg-white hover:bg-slate-50'
                            }`}
                          >
                            <span dir="ltr" className="text-base text-[#2B2D42] inline-block">${p}</span>
                            <span className="text-[10px] text-[#2B2D42]/60 block font-normal">
                              {t(labelKey)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Box 4: Costs */}
              <div className="rounded-[18px] border-2 border-[#2B2D42] bg-white overflow-hidden shadow-[0_3px_0_rgba(43,45,66,0.15)]">
                {openBox !== 4 ? (
                  <div
                    onClick={() => setOpenBox(4)}
                    className="p-3 flex items-center justify-between cursor-pointer bg-white hover:bg-slate-50 transition-colors gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl shrink-0">🧰</span>
                      <div className="min-w-0">
                        <span className="text-xs font-bold uppercase text-[#2B2D42]/60 block leading-tight">
                          {t('ch2.box4Title')}
                        </span>
                        <span className="text-sm font-black text-[#2B2D42]">
                          {costIdx !== null ? (
                            <>
                              {t(`ch2.cost.${costIdx}` as TranslationKey)}{' '}
                              <span dir="ltr" className="inline-block">(${activeIdea.unitCost[costIdx]})</span>
                            </>
                          ) : (
                            t('ch2.box4Choose')
                          )}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-[#FF9F1C] shrink-0">
                      {costIdx !== null ? t('ch2.change') : t('ch2.open')}
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-[#FFFDF7] space-y-2 animate-in fade-in duration-150">
                    <div>
                      <span className="font-black text-sm text-[#2B2D42] flex items-center gap-1.5">
                        <span>🧰</span> {t('ch2.box4Question')}
                      </span>
                      <p className="text-[11px] font-bold text-[#2B2D42]/70">
                        {t('ch2.box4Hint')}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {[0, 1, 2].map((idx) => {
                        const isSelected = costIdx === idx;
                        const cost = activeIdea.unitCost[idx];
                        return (
                          <button
                            key={idx}
                            onClick={() => handleCostSelect(idx)}
                            className={`p-2 rounded-[14px] border-2 border-[#2B2D42] text-center font-bold cursor-pointer transition-all active:scale-95 ${
                              isSelected
                                ? 'bg-[#5CC8FF] ring-2 ring-[#2B2D42] shadow-[0_2px_0_#2B2D42]'
                                : 'bg-white hover:bg-slate-50'
                            }`}
                          >
                            <span className="text-xs text-[#2B2D42] block font-black leading-tight">
                              {t(`ch2.cost.${idx}` as TranslationKey)}
                            </span>
                            <span dir="ltr" className="text-xs text-[#2B2D42] font-black inline-block">${cost}</span>
                            <span className="text-[10px] block text-[#FF9F1C]">
                              {qualityStars[idx]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Box 5: Team */}
              <div className="rounded-[18px] border-2 border-[#2B2D42] bg-white overflow-hidden shadow-[0_3px_0_rgba(43,45,66,0.15)]">
                {openBox !== 5 ? (
                  <div
                    onClick={() => setOpenBox(5)}
                    className="p-3 flex items-center justify-between cursor-pointer bg-white hover:bg-slate-50 transition-colors gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl shrink-0">👷</span>
                      <div className="min-w-0">
                        <span className="text-xs font-bold uppercase text-[#2B2D42]/60 block leading-tight">
                          {t('ch2.box5Title')}
                        </span>
                        <span className="text-sm font-black text-[#2B2D42]">
                          {teamIdx !== null
                            ? `${t(`ch2.team.${teamIdx}` as TranslationKey)} (${t('ch2.capLabel', { cap: activeIdea.teamCapacity[teamIdx] })})`
                            : t('ch2.box5Choose')}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-[#FF9F1C] shrink-0">
                      {teamIdx !== null ? t('ch2.change') : t('ch2.open')}
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-[#FFFDF7] space-y-2 animate-in fade-in duration-150">
                    <div>
                      <span className="font-black text-sm text-[#2B2D42] flex items-center gap-1.5">
                        <span>👷</span> {t('ch2.box5Question')}
                      </span>
                      <p className="text-[11px] font-bold text-[#2B2D42]/70">
                        {t('ch2.box5Hint')}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {[0, 1, 2].map((idx) => {
                        const isSelected = teamIdx === idx;
                        const cap = activeIdea.teamCapacity[idx];
                        const cost = activeIdea.teamCost[idx];
                        return (
                          <button
                            key={idx}
                            onClick={() => handleTeamSelect(idx)}
                            className={`p-2 rounded-[14px] border-2 border-[#2B2D42] text-center font-bold cursor-pointer transition-all active:scale-95 ${
                              isSelected
                                ? 'bg-[#4ADE80] ring-2 ring-[#2B2D42] shadow-[0_2px_0_#2B2D42]'
                                : 'bg-white hover:bg-slate-50'
                            }`}
                          >
                            <span className="text-xs text-[#2B2D42] block font-black leading-tight">
                              {t(`ch2.team.${idx}` as TranslationKey)}
                            </span>
                            <span className="text-[10px] text-[#2B2D42]/70 block">
                              {t('ch2.upToCust', { cap })}
                            </span>
                            <span className="text-[10px] text-[#166534] font-black block">
                              <span dir="ltr" className="inline-block">${cost}</span>{t('ch2.perMonthShort')}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Profit Calculator Card */}
            <div
              className={`p-3.5 rounded-[20px] border-[3px] border-[#2B2D42] shadow-[0_3px_0_rgba(43,45,66,0.2)] transition-all ${
                profitBreakdown
                  ? profitBreakdown.profit > 0
                    ? 'bg-[#DCFCE7] border-[#166534]'
                    : 'bg-[#FEE2E2] border-[#991B1B]'
                  : 'bg-white'
              }`}
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-[#2B2D42]/10">
                <span className="text-xs font-black uppercase tracking-wider text-[#2B2D42]/70">
                  {t('ch2.calcTitle')}
                </span>
                <span className="text-lg">📊</span>
              </div>

              {profitBreakdown ? (
                <div className="pt-2 space-y-1.5">
                  <div className="text-xs font-bold text-[#2B2D42] leading-tight">
                    {t('ch2.calcLine', {
                      served: profitBreakdown.served,
                      margin: profitBreakdown.margin,
                      teamCost: profitBreakdown.teamCost,
                    })}{' '}
                    <span
                      dir="ltr"
                      className={`text-base font-black inline-block ${
                        profitBreakdown.profit > 0 ? 'text-[#166534]' : 'text-[#991B1B]'
                      }`}
                    >
                      {t('ch2.perMonthValue', { profit: profitBreakdown.profit })}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-[#2B2D42]/80">
                    {t('ch2.perYearValue', { yearly: profitBreakdown.profit * 12 })}
                  </div>

                  {profitBreakdown.customers > profitBreakdown.capacity && (
                    <div className="text-[11px] font-bold text-[#B45309] bg-[#FEF3C7] px-2 py-0.5 rounded-md border border-[#F59E0B]">
                      {t('ch2.tooManyCust', {
                        customers: profitBreakdown.customers,
                        capacity: profitBreakdown.capacity,
                      })}
                    </div>
                  )}

                  {profitBreakdown.profit <= 0 && (
                    <div className="text-xs font-black text-[#991B1B] pt-0.5">
                      {t('ch2.losesMoney')}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-2 text-center text-xs font-bold text-[#2B2D42]/60">
                  {t('ch2.calcPlaceholder')}
                </div>
              )}
            </div>
          </div>

          {/* Sticky Bottom Action */}
          <div className="pt-2">
            <Button
              variant="primary"
              size="large"
              disabled={!allBoxesDone || !isProfitable || isSubmitting}
              onClick={handleLockPlan}
            >
              {!allBoxesDone
                ? t('ch2.btnFinishBoxes')
                : !isProfitable
                ? t('ch2.btnFixPlan')
                : t('ch2.btnLockPlan')}
            </Button>
          </div>
        </div>
      )}

      {/* ================= STEP 2: PLAN SUMMARY & REVEAL ================= */}
      {currentStep === 2 && profitBreakdown && (
        <div className="flex flex-col flex-1 justify-between space-y-4">
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-[#FFD23F]">
                {t('ch2.completeEyebrow')}
              </span>
              <h2 className="text-3xl font-black text-[#2B2D42]">
                {t('ch2.completeTitle')}
              </h2>
            </div>

            {/* Plan Stars Card */}
            <Card variant="white" className="p-4 text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2B2D42]/60">
                {t('ch2.planRating')}
              </span>
              <div className="text-3xl text-[#FFD23F] flex items-center justify-center gap-1" dir="ltr">
                {'★'.repeat(planStarsEarned)}
                {'☆'.repeat(3 - planStarsEarned)}
              </div>
              <p className="text-sm font-bold text-[#2B2D42]">
                {planStarsEarned === 3
                  ? t('ch2.rating3')
                  : planStarsEarned === 2
                  ? t('ch2.rating2')
                  : t('ch2.rating1')}
              </p>
            </Card>

            {/* One-Page Plan Card */}
            <div className="rounded-[20px] border-[3px] border-[#2B2D42] bg-white p-4 space-y-2 text-xs font-bold shadow-[0_4px_0_rgba(43,45,66,0.2)]">
              <div className="text-sm font-black text-[#2B2D42] pb-1 border-b border-[#2B2D42]/10 flex items-center justify-between">
                <span>{t('ch2.blueprintTitle', { name: activeIdeaName })}</span>
                <span>{activeIdea.icon}</span>
              </div>

              <div className="flex justify-between gap-2">
                <span className="text-[#2B2D42]/60 shrink-0">{t('ch2.bpProblem')}</span>
                <span className="text-[#2B2D42] text-end max-w-[240px] truncate">
                  {correctProblemIdx >= 0
                    ? t(`ch2.problem.${activeIdeaId}.${correctProblemIdx}` as TranslationKey)
                    : ''}
                </span>
              </div>

              <div className="flex justify-between gap-2">
                <span className="text-[#2B2D42]/60 shrink-0">{t('ch2.bpCustomers')}</span>
                <span className="text-[#2B2D42] text-end max-w-[240px] truncate">
                  {correctCustomerIdx >= 0
                    ? t(`ch2.customer.${activeIdeaId}.${correctCustomerIdx}` as TranslationKey)
                    : ''}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#2B2D42]/60">{t('ch2.bpPrice')}</span>
                <span dir="ltr" className="text-[#2B2D42] inline-block">${activeIdea.prices[priceIdx!]}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#2B2D42]/60">{t('ch2.bpCosts')}</span>
                <span className="text-[#2B2D42]">
                  {t(`ch2.cost.${costIdx!}` as TranslationKey)}{' '}
                  <span dir="ltr" className="inline-block">(${activeIdea.unitCost[costIdx!]})</span>
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#2B2D42]/60">{t('ch2.bpTeam')}</span>
                <span className="text-[#2B2D42]">
                  {t(`ch2.team.${teamIdx!}` as TranslationKey)} ({t('ch2.capLabel', { cap: activeIdea.teamCapacity[teamIdx!] })})
                </span>
              </div>

              <div className="pt-2 border-t border-[#2B2D42]/10 flex justify-between text-sm font-black">
                <span>{t('ch2.bpMonthly')}</span>
                <span dir="ltr" className="text-[#166534] inline-block">${profitBreakdown.profit}</span>
              </div>

              <div className="flex justify-between text-xs text-[#2B2D42]/70">
                <span>{t('ch2.bpYearly')}</span>
                <span dir="ltr" className="inline-block">${profitBreakdown.profit * 12}</span>
              </div>
            </div>

            {/* Reveal best possible plan comparison */}
            <div className="p-3 bg-[#FFF7E6] rounded-[16px] border-2 border-[#2B2D42] text-xs font-bold text-[#2B2D42]">
              <span className="text-[10px] uppercase font-black tracking-wider text-[#FF9F1C] block">
                {t('ch2.benchmarkLabel')}
              </span>
              <p className="mt-0.5">
                {t('ch2.benchmarkText', {
                  price: activeIdea.prices[bestPlanData.combo.priceIdx],
                  cost: t(`ch2.cost.${bestPlanData.combo.costIdx}` as TranslationKey),
                  team: t(`ch2.team.${bestPlanData.combo.teamIdx}` as TranslationKey),
                  bestProfit: bestPlanData.profit,
                  yourProfit: profitBreakdown.profit,
                })}
              </p>
            </div>

            {/* Lesson earned card */}
            <div className="rounded-[16px] border-2 border-[#2B2D42] bg-[#DCFCE7] p-3 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#166534]">
                {t('addedToNotebook')}
              </span>
              <p className="text-xs sm:text-sm font-bold text-[#166534] mt-0.5">
                "{t('chapter.2.lesson')}"
              </p>
            </div>
          </div>

          <div className="pt-4">
            <Button variant="primary" size="large" disabled={isSubmitting} onClick={handleFinishChapter}>
              {t('ch2.nextChapterBtn')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
