import React, { useMemo } from 'react';
import { useGame } from '../state/gameContext';
import { runAllSelfTests, TestResult } from '../logic/selfTests';
import { Button } from '../ui/Button';

export const SelfTestScreen: React.FC = () => {
  const { setScreen, t } = useGame();

  const testReport = useMemo(() => {
    return runAllSelfTests();
  }, []);

  // Group by suite
  const grouped = useMemo(() => {
    const map: Record<string, TestResult[]> = {};
    for (const res of testReport.results) {
      if (!map[res.suite]) {
        map[res.suite] = [];
      }
      map[res.suite].push(res);
    }
    return map;
  }, [testReport]);

  return (
    <div className="flex flex-col flex-1 justify-between py-4 px-4 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-0.5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b-2 border-[#2B2D42]/10">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🧪</span>
            <div>
              <h2 className="text-xl font-black text-[#2B2D42]">{t('selftest.title')}</h2>
              <p className="text-xs font-bold text-[#2B2D42]/70">
                {t('selftest.sub')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setScreen('title')}
            className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-white border-2 border-[#2B2D42] font-bold text-base flex items-center justify-center cursor-pointer active:scale-95"
            aria-label={t('closeNotebook')}
          >
            ✕
          </button>
        </div>

        {/* Global Status Banner */}
        <div
          className={`p-3 rounded-[16px] border-2 border-[#2B2D42] text-center font-bold text-sm shadow-[0_3px_0_rgba(43,45,66,0.15)] ${
            testReport.allPassed
              ? 'bg-[#4ADE80] text-[#166534]'
              : 'bg-[#FF6B6B] text-white'
          }`}
        >
          {testReport.allPassed
            ? t('selftest.allPass', { passed: testReport.passedCount, total: testReport.totalCount })
            : t('selftest.someFail', { failed: testReport.totalCount - testReport.passedCount })}
        </div>

        {/* Test Suites list */}
        <div className="space-y-4">
          {Object.entries(grouped).map(([suiteName, tests]) => {
            const suitePassed = tests.every((tItem) => tItem.passed);
            return (
              <div
                key={suiteName}
                className="rounded-[16px] border-2 border-[#2B2D42] bg-white overflow-hidden shadow-[0_3px_0_rgba(43,45,66,0.15)]"
              >
                <div
                  className={`px-3 py-2 border-b-2 border-[#2B2D42] flex items-center justify-between font-bold text-xs uppercase tracking-wider ${
                    suitePassed ? 'bg-[#DCFCE7] text-[#166534]' : 'bg-[#FEE2E2] text-[#991B1B]'
                  }`}
                >
                  <span>{suiteName}</span>
                  <span>
                    {t('selftest.passCount', {
                      passed: tests.filter((tItem) => tItem.passed).length,
                      total: tests.length,
                    })}
                  </span>
                </div>

                <div className="divide-y divide-[#2B2D42]/10 text-xs">
                  {tests.map((test, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 flex items-start justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-[#2B2D42] truncate">
                          {test.name}
                        </div>
                        <div className="text-[11px] text-[#2B2D42]/70 font-mono mt-0.5" dir="ltr">
                          exp: <span className="font-semibold text-[#2B2D42]">{test.expected}</span>
                          {!test.passed && (
                            <span className="text-[#FF6B6B] ml-2">
                              got: {test.actual}
                            </span>
                          )}
                        </div>
                      </div>

                      <span
                        className={`shrink-0 px-2 py-0.5 rounded-full font-black text-[10px] uppercase border ${
                          test.passed
                            ? 'bg-[#4ADE80] text-[#166534] border-[#166534]'
                            : 'bg-[#FF6B6B] text-white border-[#991B1B]'
                        }`}
                      >
                        {test.passed ? 'PASS ✔' : 'FAIL ✖'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-3 border-t-2 border-[#2B2D42]/10">
        <Button
          variant="primary"
          size="normal"
          onClick={() => setScreen('title')}
        >
          {t('selftest.returnBtn')}
        </Button>
      </div>
    </div>
  );
};
