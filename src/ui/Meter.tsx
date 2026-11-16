import React from 'react';
import { useGame } from '../state/gameContext';

interface MeterProps {
  type: 'cash' | 'value' | 'slice';
  value: number | null;
}

export const Meter: React.FC<MeterProps> = ({ type, value }) => {
  const { t } = useGame();

  const configs = {
    cash: {
      label: t('cash'),
      icon: '💰',
      format: (v: number) => `$${v}`,
    },
    value: {
      label: t('value'),
      icon: '💎',
      format: (v: number) => `$${v}`,
    },
    slice: {
      label: t('slice'),
      icon: '🥧',
      format: (v: number) => `${v}%`,
    },
  };

  const config = configs[type];
  const displayVal = value !== null && value !== undefined ? config.format(value) : '—';

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded-[12px] border-2 border-[#2B2D42] bg-white shadow-[0_2px_0_rgba(43,45,66,0.2)]"
    >
      <span className="text-base select-none" aria-hidden="true">
        {config.icon}
      </span>
      <div className="flex flex-col leading-none min-w-0">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#2B2D42]/70 truncate">
          {config.label}
        </span>
        <span dir="ltr" className="font-extrabold text-sm sm:text-base tabular-nums text-[#2B2D42] inline-block text-start">
          {displayVal}
        </span>
      </div>
    </div>
  );
};
