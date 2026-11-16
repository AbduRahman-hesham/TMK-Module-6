import React, { useState, useMemo } from 'react';
import { useGame } from '../../state/gameContext';
import { IdeaId, IDEAS } from '../../data/ideas';
import {
  IDEA_CARDS,
  CHAPTER1_GOALS,
  ORDERED_STEPS,
  CHAPTER1_BUDGET_ITEMS,
  BudgetItem,
  ProjectStepCard,
} from '../../data/chapter1';
import { CHAPTERS } from '../../data/chapters';
import { TranslationKey } from '../../data/translations';
import { projectStars } from '../../logic/math';
import { seededShuffle } from '../../logic/shuffle';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';

type BudgetFeedbackState =
  | { type: 'over_budget' }
  | { type: 'missing_needs'; missingItems: BudgetItem[] }
  | null;

export const Chapter1Screen: React.FC = () => {
  const { state, setIdea, completeChapter, t } = useGame();
  const currentChapter = CHAPTERS[1];

  // Steps within Chapter 1:
  // 0: Word Card
  // 1: Pick Idea
  // 2: Goal
  // 3: Steps Order
  // 4: Budget
  // 5: Result
  const [currentStep, setCurrentStep] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);

  // --- Step 1 State: Pick Idea ---
  const [selectedIdeaId, setSelectedIdeaId] = useState<IdeaId>(state.ideaId || 'pixel');

  // --- Step 2 State: Goal ---
  const [goalFirstTry, setGoalFirstTry] = useState<boolean>(true);
  const [hasAttemptedGoal, setHasAttemptedGoal] = useState<boolean>(false);
  const [greyedGoals, setGreyedGoals] = useState<number[]>([]);
  const [goalFeedback, setGoalFeedback] = useState<{ isCorrect: boolean } | null>(null);
  const [goalSelected, setGoalSelected] = useState<boolean>(false);
  const [shakeGoalCard, setShakeGoalCard] = useState<number | null>(null);

  // --- Step 3 State: Steps Order ---
  const [stepMistakes, setStepMistakes] = useState<number>(0);
  const [consecutiveMistakes, setConsecutiveMistakes] = useState<number>(0);
  const [placedStepIds, setPlacedStepIds] = useState<string[]>([]);
  const [shakeStepId, setShakeStepId] = useState<string | null>(null);

  // Seeded shuffle for the 4 step cards (stable on re-render)
  const initialShuffledSteps = useMemo(() => {
    return seededShuffle(ORDERED_STEPS, 42);
  }, []);

  // --- Step 4 State: Budget ---
  const [selectedBudgetItemIds, setSelectedBudgetItemIds] = useState<string[]>([]);
  const [budgetFeedback, setBudgetFeedback] = useState<BudgetFeedbackState>(null);
  const [shakeBudget, setShakeBudget] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const activeIdeaId = state.ideaId || selectedIdeaId;
  const budgetItems = CHAPTER1_BUDGET_ITEMS[activeIdeaId];
  const totalSpent = useMemo(() => {
    return selectedBudgetItemIds.reduce((sum, id) => {
      const item = budgetItems.find((b) => b.id === id);
      return sum + (item ? item.cost : 0);
    }, 0);
  }, [selectedBudgetItemIds, budgetItems]);

  const leftoverCash = 100 - totalSpent;

  const getBudgetItemName = (item: BudgetItem) => {
    const key =
      activeIdeaId === 'paws' && item.id === 'party'
        ? 'ch1.item.paws_party'
        : `ch1.item.${item.id}`;
    return t(key as TranslationKey);
  };

  // --- Handlers ---
  const handleConfirmIdea = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setIdea(selectedIdeaId);
    setCurrentStep(2);
    setTimeout(() => setIsSubmitting(false), 200);
  };

  const handleGoalTap = (index: number) => {
    if (goalSelected || greyedGoals.includes(index)) return;

    const goals = CHAPTER1_GOALS[activeIdeaId];
    const option = goals[index];

    if (!hasAttemptedGoal) {
      setHasAttemptedGoal(true);
      if (!option.isCorrect) {
        setGoalFirstTry(false);
      }
    }

    if (option.isCorrect) {
      setGoalSelected(true);
      setGoalFeedback({ isCorrect: true });
    } else {
      setShakeGoalCard(index);
      setTimeout(() => setShakeGoalCard(null), 300);
      setGreyedGoals((prev) => [...prev, index]);
      setGoalFeedback({ isCorrect: false });
    }
  };

  const handleStepTap = (stepCard: ProjectStepCard) => {
    if (placedStepIds.includes(stepCard.id)) return;

    const nextNeededIndex = placedStepIds.length;
    const nextNeededStep = ORDERED_STEPS[nextNeededIndex];

    if (stepCard.id === nextNeededStep.id) {
      setPlacedStepIds((prev) => [...prev, stepCard.id]);
      setConsecutiveMistakes(0);
    } else {
      setStepMistakes((prev) => prev + 1);
      setConsecutiveMistakes((prev) => prev + 1);
      setShakeStepId(stepCard.id);
      setTimeout(() => setShakeStepId(null), 300);
    }
  };

  const handleToggleBudgetItem = (item: BudgetItem) => {
    setBudgetFeedback(null);
    if (selectedBudgetItemIds.includes(item.id)) {
      setSelectedBudgetItemIds((prev) => prev.filter((id) => id !== item.id));
    } else {
      if (totalSpent + item.cost > 100) {
        setBudgetFeedback({ type: 'over_budget' });
        setShakeBudget(true);
        setTimeout(() => setShakeBudget(false), 300);
      } else {
        setSelectedBudgetItemIds((prev) => [...prev, item.id]);
      }
    }
  };

  const handleBudgetContinue = () => {
    if (isSubmitting) return;
    const needItems = budgetItems.filter((i) => i.isNeed);
    const missingNeeds = needItems.filter((n) => !selectedBudgetItemIds.includes(n.id));

    if (missingNeeds.length > 0) {
      setBudgetFeedback({ type: 'missing_needs', missingItems: missingNeeds });
      setShakeBudget(true);
      setTimeout(() => setShakeBudget(false), 300);
      return;
    }

    setIsSubmitting(true);
    setCurrentStep(5);
    setTimeout(() => setIsSubmitting(false), 200);
  };

  const starsEarned = projectStars(goalFirstTry, stepMistakes);

  const handleFinishChapter = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    completeChapter(
      1,
      {
        ideaId: activeIdeaId,
        goalFirstTry,
        stepMistakes,
        spent: totalSpent,
        leftoverCash,
        stars: starsEarned,
      },
      {
        cash: leftoverCash,
        slice: 100,
      },
      currentChapter.lesson
    );
  };

  const activeIdeaName = t(`idea.${activeIdeaId}.name` as TranslationKey);
  const activeIdeaIcon = IDEAS[activeIdeaId].icon;

  const budgetFeedbackText = useMemo(() => {
    if (!budgetFeedback) return null;
    if (budgetFeedback.type === 'over_budget') {
      return t('ch1.overBudget');
    }
    const separator = state.language === 'ar' ? '، ' : ', ';
    const names = budgetFeedback.missingItems.map(getBudgetItemName).join(separator);
    return t('ch1.stillNeed', { items: names });
  }, [budgetFeedback, state.language, activeIdeaId]);

  return (
    <div className="flex flex-col flex-1 justify-between py-4 px-4">
      {/* ================= STEP 0: WORD OF CHAPTER ================= */}
      {currentStep === 0 && (
        <div className="flex flex-col flex-1 justify-between">
          <div className="my-auto space-y-4 text-center">
            <span
              className="inline-block text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border-2 border-[#2B2D42] bg-[#5CC8FF]"
            >
              {t('ch1.step0Badge')}
            </span>
            <div className="text-5xl" aria-hidden="true">
              {currentChapter.word.emoji}
            </div>

            <Card variant="white" className="p-6 text-center space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FF9F1C]">
                {t('wordOfChapter')}
              </span>
              <h2 className="text-3xl font-black text-[#2B2D42]">
                {t('chapter.1.word.term')}
              </h2>
              <p className="text-xl font-bold text-[#2B2D42]/80">
                "{t('chapter.1.word.def')}"
              </p>
            </Card>

            <div className="p-3 bg-[#FFF7E6] rounded-[16px] border-2 border-[#2B2D42]/30 text-sm font-semibold text-[#2B2D42]/70">
              {t('ch1.step0Tip')}
            </div>
          </div>

          <div className="pt-4">
            <Button variant="primary" size="large" onClick={() => setCurrentStep(1)}>
              {t('ch1.startProject')}
            </Button>
          </div>
        </div>
      )}

      {/* ================= STEP 1: PICK YOUR IDEA ================= */}
      {currentStep === 1 && (
        <div className="flex flex-col flex-1 justify-between">
          <div className="space-y-3">
            <div className="text-center space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-[#5CC8FF]">
                {t('ch1.step1Eyebrow')}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#2B2D42]">
                {t('ch1.pickIdeaTitle')}
              </h2>
              <p className="text-sm font-semibold text-[#2B2D42]/70">
                {t('ch1.pickIdeaSub')}
              </p>
            </div>

            <div className="space-y-3 pt-1">
              {(['pixel', 'bikes', 'paws'] as IdeaId[]).map((id) => {
                const card = IDEA_CARDS[id];
                const ideaData = IDEAS[id];
                const isSelected = selectedIdeaId === id;

                return (
                  <div
                    key={id}
                    onClick={() => setSelectedIdeaId(id)}
                    className={`rounded-[20px] p-3.5 bg-white cursor-pointer transition-all active:scale-[0.98] ${
                      isSelected
                        ? 'border-[4px] border-[#FF6B6B] shadow-[0_4px_0_#FF6B6B] bg-[#FFF5F5]'
                        : 'border-[3px] border-[#2B2D42] shadow-[0_4px_0_rgba(43,45,66,0.25)] hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-3xl">{card.icon}</span>
                        <div>
                          <h3 className="text-lg font-black text-[#2B2D42] leading-tight">
                            {t(`idea.${id}.name` as TranslationKey)}
                          </h3>
                          <p className="text-xs font-bold text-[#FF9F1C]">
                            {t(`idea.${id}.tagline` as TranslationKey)}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-full border-2 border-[#2B2D42] flex items-center justify-center text-xs font-black shrink-0 ${
                          isSelected ? 'bg-[#FF6B6B] text-white' : 'bg-slate-100 text-transparent'
                        }`}
                      >
                        ✓
                      </div>
                    </div>

                    {/* Star attributes */}
                    <div className="mt-3 pt-2.5 border-t border-[#2B2D42]/10 grid grid-cols-3 gap-2 text-xs font-bold">
                      <div className="flex flex-col">
                        <span className="text-[#2B2D42]/60 text-[10px] uppercase">{t('ch1.attrGrowth')}</span>
                        <span className="text-[#FF9F1C]">{'⭐'.repeat(ideaData.stars.growth)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[#2B2D42]/60 text-[10px] uppercase">{t('ch1.attrEffort')}</span>
                        <span className="text-[#5CC8FF]">{'⭐'.repeat(ideaData.stars.effort)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[#2B2D42]/60 text-[10px] uppercase">{t('ch1.attrRisk')}</span>
                        <span className="text-[#FF6B6B]">{'⭐'.repeat(ideaData.stars.risk)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4">
            <Button variant="primary" size="large" disabled={isSubmitting} onClick={handleConfirmIdea}>
              {t('ch1.chooseIdeaBtn')}
            </Button>
          </div>
        </div>
      )}

      {/* ================= STEP 2: GOAL ================= */}
      {currentStep === 2 && (
        <div className="flex flex-col flex-1 justify-between">
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-[#5CC8FF]">
                {t('ch1.step2Eyebrow')}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#2B2D42]">
                {t('ch1.pickGoalTitle')}
              </h2>
              <p className="text-sm font-semibold text-[#2B2D42]/70">
                {t('ch1.forIdea', { name: activeIdeaName, icon: activeIdeaIcon })}
              </p>
            </div>

            <div className="space-y-3 pt-1">
              {CHAPTER1_GOALS[activeIdeaId].map((option, idx) => {
                const isGreyed = greyedGoals.includes(idx);
                const isSelected = goalSelected && option.isCorrect;
                const isShaking = shakeGoalCard === idx;

                return (
                  <div
                    key={idx}
                    onClick={() => handleGoalTap(idx)}
                    className={`sticker-card p-4 cursor-pointer transition-all active:scale-[0.98] ${
                      isShaking ? 'shake-wrong border-[#FF6B6B]' : ''
                    } ${
                      isSelected
                        ? 'bg-[#DCFCE7] border-[#166534] ring-4 ring-[#4ADE80]'
                        : isGreyed
                        ? 'bg-slate-100 opacity-40 cursor-not-allowed border-slate-300'
                        : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-base sm:text-lg font-bold text-[#2B2D42]">
                        {t(`ch1.goal.${activeIdeaId}.${idx}` as TranslationKey)}
                      </span>
                      {isSelected && (
                        <span className="text-xl font-black text-[#166534]">✔</span>
                      )}
                      {isGreyed && (
                        <span className="text-lg font-black text-[#FF6B6B]">✖</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Instant Feedback Notice */}
            {goalFeedback && (
              <div
                className={`p-3.5 rounded-[16px] border-2 border-[#2B2D42] text-sm font-bold flex items-center gap-2 ${
                  goalFeedback.isCorrect
                    ? 'bg-[#4ADE80] text-[#166534]'
                    : 'bg-[#FF6B6B] text-white shake-wrong'
                }`}
              >
                <span className="text-lg">
                  {goalFeedback.isCorrect ? '✔' : '✖'}
                </span>
                <span>
                  {goalFeedback.isCorrect ? t('ch1.goal.correctExp') : t('ch1.goal.wrongExp')}
                </span>
              </div>
            )}
          </div>

          <div className="pt-4">
            <Button
              variant="primary"
              size="large"
              disabled={!goalSelected}
              onClick={() => setCurrentStep(3)}
            >
              {t('ch1.continueSteps')}
            </Button>
          </div>
        </div>
      )}

      {/* ================= STEP 3: STEPS ORDER ================= */}
      {currentStep === 3 && (
        <div className="flex flex-col flex-1 justify-between">
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-[#5CC8FF]">
                {t('ch1.step3Eyebrow')}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#2B2D42]">
                {t('ch1.stepsTitle')}
              </h2>
              <p className="text-sm font-semibold text-[#2B2D42]/70">
                {t('ch1.stepsSub')}
              </p>
            </div>

            {/* 4 Ordered Slots */}
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((slotNum) => {
                const placedId = placedStepIds[slotNum - 1];
                const stepObj = ORDERED_STEPS.find((s) => s.id === placedId);

                return (
                  <div
                    key={slotNum}
                    className={`h-20 rounded-[16px] border-2 border-[#2B2D42] p-2 flex flex-col items-center justify-center text-center transition-all ${
                      stepObj
                        ? 'bg-[#DCFCE7] shadow-[0_3px_0_rgba(43,45,66,0.15)] animate-in zoom-in-95'
                        : 'bg-white/60 border-dashed border-[#2B2D42]/40'
                    }`}
                  >
                    <span className="text-[10px] font-black text-[#2B2D42]/50 leading-none mb-1">
                      {slotNum}
                    </span>
                    {stepObj ? (
                      <>
                        <span className="text-2xl leading-none">{stepObj.icon}</span>
                        <span className="text-xs font-black text-[#166534] mt-1 leading-none">
                          {t(`ch1.step.${stepObj.id}` as TranslationKey)}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs font-bold text-[#2B2D42]/30">{t('ch1.emptySlot')}</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Unplaced Cards to Tap */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-[#2B2D42]/60 uppercase tracking-wide">
                {t('ch1.availableSteps')}
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                {initialShuffledSteps.map((card) => {
                  const isPlaced = placedStepIds.includes(card.id);
                  const isShaking = shakeStepId === card.id;
                  const isNextCorrect =
                    placedStepIds.length < 4 &&
                    ORDERED_STEPS[placedStepIds.length].id === card.id;
                  const shouldHighlight =
                    consecutiveMistakes >= 2 && isNextCorrect && !isPlaced;

                  if (isPlaced) return null;

                  return (
                    <button
                      key={card.id}
                      onClick={() => handleStepTap(card)}
                      className={`sticker-card p-3 flex items-center gap-2.5 cursor-pointer text-start active:scale-95 ${
                        isShaking ? 'shake-wrong border-[#FF6B6B]' : ''
                      } ${
                        shouldHighlight
                          ? 'ring-4 ring-[#FFD23F] bg-[#FEF9C3] animate-pulse'
                          : 'bg-white hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-2xl">{card.icon}</span>
                      <span className="text-base font-black text-[#2B2D42]">
                        {t(`ch1.step.${card.id}` as TranslationKey)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Feedback helper */}
            {consecutiveMistakes >= 2 && placedStepIds.length < 4 && (
              <div className="p-2.5 bg-[#FEF9C3] rounded-[14px] border-2 border-[#FFD23F] text-xs font-bold text-[#854D0E] text-center">
                {t('ch1.stepsHint')}
              </div>
            )}

            {placedStepIds.length === 4 && (
              <div className="p-3 bg-[#4ADE80] rounded-[16px] border-2 border-[#2B2D42] text-sm font-bold text-[#166534] text-center">
                {t('ch1.stepsComplete')}
              </div>
            )}
          </div>

          <div className="pt-4">
            <Button
              variant="primary"
              size="large"
              disabled={placedStepIds.length < 4}
              onClick={() => setCurrentStep(4)}
            >
              {t('ch1.continueBudget')}
            </Button>
          </div>
        </div>
      )}

      {/* ================= STEP 4: BUDGET ================= */}
      {currentStep === 4 && (
        <div className="flex flex-col flex-1 justify-between">
          <div className="space-y-3">
            <div className="text-center space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-[#5CC8FF]">
                {t('ch1.step4Eyebrow')}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#2B2D42]">
                {t('ch1.budgetTitle')}
              </h2>
              <p className="text-xs font-semibold text-[#2B2D42]/70">
                {t('ch1.budgetSub')}
              </p>
            </div>

            {/* Budget Bar */}
            <div
              className={`p-3 rounded-[18px] border-[3px] border-[#2B2D42] bg-white shadow-[0_3px_0_rgba(43,45,66,0.15)] transition-all ${
                shakeBudget ? 'shake-wrong border-[#FF6B6B]' : ''
              }`}
            >
              <div className="flex items-center justify-between text-sm font-black mb-2">
                <span>
                  {t('ch1.spentLabel')}{' '}
                  <span dir="ltr" className="inline-block">
                    ${totalSpent} / $100
                  </span>
                </span>
                <span className={leftoverCash >= 0 ? 'text-[#166534]' : 'text-[#FF6B6B]'}>
                  {t('ch1.leftLabel')}{' '}
                  <span dir="ltr" className="inline-block">
                    ${leftoverCash}
                  </span>
                </span>
              </div>
              <div className="w-full h-4 bg-slate-100 rounded-full border-2 border-[#2B2D42] overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full transition-all duration-200"
                  style={{
                    width: `${Math.min(100, totalSpent)}%`,
                    backgroundColor: totalSpent > 100 ? '#FF6B6B' : totalSpent === 100 ? '#FF9F1C' : '#4ADE80',
                  }}
                />
              </div>
            </div>

            {/* Error / Warning Notice */}
            {budgetFeedbackText && (
              <div className="p-3 bg-[#FEE2E2] rounded-[14px] border-2 border-[#FF6B6B] text-xs font-bold text-[#991B1B] text-center shake-wrong">
                {budgetFeedbackText}
              </div>
            )}

            {/* 6 Items Grid (tap to add / remove) */}
            <div className="grid grid-cols-2 gap-2.5">
              {budgetItems.map((item) => {
                const isSelected = selectedBudgetItemIds.includes(item.id);

                return (
                  <button
                    key={item.id}
                    onClick={() => handleToggleBudgetItem(item)}
                    className={`sticker-card p-2.5 flex flex-col justify-between text-start cursor-pointer transition-all active:scale-95 min-h-[76px] ${
                      isSelected
                        ? 'bg-[#DCFCE7] border-[#166534] ring-2 ring-[#4ADE80]'
                        : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 w-full">
                      <span className="text-2xl">{item.icon}</span>
                      <span dir="ltr" className="font-black text-xs text-[#2B2D42] bg-[#FFF7E6] px-1.5 py-0.5 rounded-full border border-[#2B2D42]/30">
                        ${item.cost}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1 w-full gap-1">
                      <span className="text-xs font-bold text-[#2B2D42] leading-tight line-clamp-1">
                        {getBudgetItemName(item)}
                      </span>
                      <span
                        className={`text-xs font-black shrink-0 ${
                          isSelected ? 'text-[#166534]' : 'text-[#2B2D42]/40'
                        }`}
                      >
                        {isSelected ? '✔' : '+'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4">
            <Button variant="primary" size="large" disabled={isSubmitting} onClick={handleBudgetContinue}>
              {t('ch1.completeBudget')}
            </Button>
          </div>
        </div>
      )}

      {/* ================= STEP 5: RESULT ================= */}
      {currentStep === 5 && (
        <div className="flex flex-col flex-1 justify-between">
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-[#5CC8FF]">
                {t('ch1.completeEyebrow')}
              </span>
              <h2 className="text-3xl font-black text-[#2B2D42]">
                {t('ch1.completeTitle')}
              </h2>
            </div>

            {/* Stars rating badge */}
            <Card variant="white" className="p-4 text-center space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-[#2B2D42]/60">
                {t('ch1.projectScore')}
              </div>
              <div className="text-3xl text-[#FFD23F] flex items-center justify-center gap-1" dir="ltr">
                {'★'.repeat(starsEarned)}
                {'☆'.repeat(3 - starsEarned)}
              </div>
              <p className="text-sm font-bold text-[#2B2D42]">
                {starsEarned === 3
                  ? t('ch1.score3')
                  : starsEarned === 2
                  ? t('ch1.score2')
                  : t('ch1.score1')}
              </p>
            </Card>

            {/* 3-line checklist */}
            <div className="rounded-[18px] border-2 border-[#2B2D42] bg-white p-3.5 space-y-2 text-sm font-bold text-[#2B2D42]">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#2B2D42]/10">
                <span>{t('ch1.goalSelection')}</span>
                <span className={goalFirstTry ? 'text-[#166534]' : 'text-[#FF6B6B]'}>
                  {goalFirstTry ? t('ch1.firstTry') : t('ch1.neededHint')}
                </span>
              </div>

              <div className="flex items-center justify-between pb-1.5 border-b border-[#2B2D42]/10">
                <span>{t('ch1.stepsRoadmap')}</span>
                <span className={stepMistakes <= 1 ? 'text-[#166534]' : 'text-[#FF9F1C]'}>
                  {stepMistakes === 1
                    ? t('ch1.mistakesSingle', { count: stepMistakes })
                    : t('ch1.mistakesPlural', { count: stepMistakes })}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span>{t('ch1.cashLeft')}</span>
                <span dir="ltr" className="text-[#166534] inline-block">${leftoverCash}</span>
              </div>
            </div>

            {/* Extras info if any extras were bought */}
            {100 - leftoverCash > 60 && (
              <div className="p-3 bg-[#FFF7E6] rounded-[16px] border-2 border-[#2B2D42]/30 text-xs font-bold text-[#2B2D42]/80 leading-snug">
                {t('ch1.extrasUsed', { extra: 100 - leftoverCash - 60 })}
              </div>
            )}

            {/* Lesson earned card */}
            <div className="rounded-[16px] border-2 border-[#2B2D42] bg-[#DCFCE7] p-3 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#166534]">
                {t('addedToNotebook')}
              </span>
              <p className="text-xs sm:text-sm font-bold text-[#166534] mt-0.5">
                "{t('chapter.1.lesson')}"
              </p>
            </div>
          </div>

          <div className="pt-4">
            <Button variant="primary" size="large" disabled={isSubmitting} onClick={handleFinishChapter}>
              {t('ch1.nextChapterBtn')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
