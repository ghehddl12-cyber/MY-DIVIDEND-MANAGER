import { useEffect, useMemo } from 'react';
import { X, Calendar, DollarSign, Building2, PieChart, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { Asset } from '../types';
import { formatCurrency, cn } from '../lib/utils';

interface ThisMonthDividendModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: Date;
  assets: Asset[];
  onSelectAsset?: (asset: Asset) => void;
}

export function ThisMonthDividendModal({
  isOpen,
  onClose,
  currentDate,
  assets,
  onSelectAsset,
}: ThisMonthDividendModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const currentMonthIdx = currentDate.getMonth();
  const currentMonthName = format(currentDate, 'yyyy년 MM월');

  const payingItems = useMemo(() => {
    return assets
      .map((asset) => {
        const annualDiv = asset.price * asset.shares * (asset.dividendYield / 100);
        const frequencyDivisor =
          asset.dividendFrequency === 'Monthly' ? 12 :
          asset.dividendFrequency === 'Quarterly' ? 4 :
          asset.dividendFrequency === 'Semi-Annually' ? 2 : 1;

        const payoutPerPeriod = annualDiv / frequencyDivisor;

        let paysThisMonth = false;
        if (asset.dividendFrequency === 'Monthly') {
          paysThisMonth = true;
        } else if (asset.dividendFrequency === 'Quarterly' && [2, 5, 8, 11].includes(currentMonthIdx)) {
          paysThisMonth = true;
        } else if (asset.dividendFrequency === 'Semi-Annually' && [5, 11].includes(currentMonthIdx)) {
          paysThisMonth = true;
        } else if (asset.dividendFrequency === 'Annually' && currentMonthIdx === 11) {
          paysThisMonth = true;
        }

        return {
          asset,
          paysThisMonth,
          payoutPerPeriod,
          evalValue: asset.price * asset.shares,
        };
      })
      .filter((item) => item.paysThisMonth)
      .sort((a, b) => b.payoutPerPeriod - a.payoutPerPeriod);
  }, [assets, currentMonthIdx]);

  const totalEstDividend = payingItems.reduce((sum, item) => sum + item.payoutPerPeriod, 0);

  if (!isOpen) return null;

  const getFreqLabel = (freq: Asset['dividendFrequency']) => {
    switch (freq) {
      case 'Monthly': return '월배당';
      case 'Quarterly': return '분기배당';
      case 'Semi-Annually': return '반기배당';
      case 'Annually': return '연배당';
      default: return freq;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} aria-label="Close modal background" />

      <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">
                {currentMonthName} 배당 지급 종목
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                해당 월에 배당금이 지급되는 종목과 예상 금액 목록입니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="닫기 (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Bar */}
        <div className="px-6 py-3.5 bg-slate-100/70 border-b border-slate-200/60 flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-medium">지급 종목</span>
            <span className="font-extrabold font-mono text-blue-600 bg-blue-100 px-2 py-0.5 rounded-md">
              {payingItems.length}개
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-medium">이번 달 예상 총 배당금</span>
            <span className="font-extrabold font-mono text-emerald-600 text-base">
              {formatCurrency(totalEstDividend)}
            </span>
          </div>
        </div>

        {/* List of paying assets */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1 divide-y divide-slate-100">
          {payingItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              {currentMonthName}에 배당 지급 예정인 종목이 없습니다.
            </div>
          ) : (
            payingItems.map(({ asset, payoutPerPeriod, evalValue }, index) => {
              const shareRatio = totalEstDividend > 0 ? (payoutPerPeriod / totalEstDividend) * 100 : 0;

              return (
                <div
                  key={asset.id}
                  onClick={() => {
                    if (onSelectAsset) {
                      onSelectAsset(asset);
                      onClose();
                    }
                  }}
                  className={cn(
                    'group rounded-xl p-3.5 border border-slate-100 hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer space-y-2.5',
                    index > 0 && 'mt-3'
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-2xs">
                        {asset.type === 'ETF' ? (
                          <PieChart className="w-4 h-4" />
                        ) : (
                          <Building2 className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-sm truncate group-hover:text-blue-600 transition-colors">
                            {asset.name}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                            {asset.ticker}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                          <span>보유: {asset.shares}주</span>
                          <span>•</span>
                          <span>배당률: {asset.dividendYield}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-2">
                      <div>
                        <div className="text-xs text-slate-400 font-medium">이번 달 배당</div>
                        <div className="font-extrabold font-mono text-emerald-600 text-sm sm:text-base">
                          {formatCurrency(payoutPerPeriod)}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  </div>

                  {/* Date details and progress */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-400 mr-1">배당락일:</span>
                      <span className="font-mono font-medium text-slate-700">{asset.exDividendDate || '미정'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 mr-1">지급일:</span>
                      <span className="font-mono font-medium text-emerald-700">{asset.paymentDate || '미정'}</span>
                    </div>
                    <div className="font-mono font-bold text-slate-600">
                      비중 {shareRatio.toFixed(1)}%
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(shareRatio, 1)}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> 종목을 클릭하면 상세 정보를 확인할 수 있습니다.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
          >
            닫기 (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
