import { useEffect } from 'react';
import { X, Wallet, DollarSign, TrendingUp, Percent, PieChart } from 'lucide-react';
import { Asset, PortfolioStats } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { getAssetSector } from '../lib/sectorUtils';

export type StatBreakdownType = 'totalValue' | 'totalCost' | 'annualDividend' | 'dividendYield' | null;

interface StatBreakdownModalProps {
  type: StatBreakdownType;
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
  stats: PortfolioStats;
}

export function StatBreakdownModal({ type, isOpen, onClose, assets, stats }: StatBreakdownModalProps) {
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

  if (!isOpen || !type) return null;

  const getModalConfig = () => {
    switch (type) {
      case 'totalValue':
        return {
          title: '총 자산 가치 상세 비중',
          subtitle: '각 종목이 전체 평가 금액에서 차지하는 비중입니다.',
          icon: Wallet,
          color: 'text-blue-600',
          bg: 'bg-blue-100',
          barColor: 'bg-blue-500',
          totalLabel: '총 평가 가치',
          totalValue: stats.totalValue,
          getValue: (asset: Asset) => asset.price * asset.shares,
          total: stats.totalValue,
        };
      case 'totalCost':
        return {
          title: '총 매수 금액 상세 비중',
          subtitle: '각 종목이 전체 투자 금액에서 차지하는 비중입니다.',
          icon: DollarSign,
          color: 'text-slate-700',
          bg: 'bg-slate-100',
          barColor: 'bg-slate-600',
          totalLabel: '총 매수 금액',
          totalValue: stats.totalCost,
          getValue: (asset: Asset) => asset.averageCost * asset.shares,
          total: stats.totalCost,
        };
      case 'annualDividend':
        return {
          title: '예상 연배당금 상세 비중',
          subtitle: '각 종목에서 발생하는 연간 배당금 및 비중입니다.',
          icon: TrendingUp,
          color: 'text-emerald-600',
          bg: 'bg-emerald-100',
          barColor: 'bg-emerald-500',
          totalLabel: '총 예상 연배당금',
          totalValue: stats.annualDividend,
          getValue: (asset: Asset) => (asset.price * asset.shares) * (asset.dividendYield / 100),
          total: stats.annualDividend,
        };
      case 'dividendYield':
      default:
        return {
          title: '포트폴리오 배당 기여도',
          subtitle: '종목별 배당률과 연간 기여 배당금 정보입니다.',
          icon: Percent,
          color: 'text-purple-600',
          bg: 'bg-purple-100',
          barColor: 'bg-purple-500',
          totalLabel: '총 예상 연배당금',
          totalValue: stats.annualDividend,
          getValue: (asset: Asset) => (asset.price * asset.shares) * (asset.dividendYield / 100),
          total: stats.annualDividend,
        };
    }
  };

  const config = getModalConfig();
  const Icon = config.icon;

  const items = assets
    .map((asset) => {
      const itemVal = config.getValue(asset);
      const ratio = config.total > 0 ? (itemVal / config.total) * 100 : 0;
      return {
        asset,
        value: itemVal,
        ratio,
        sector: getAssetSector(asset),
      };
    })
    .sort((a, b) => b.value - a.value);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Overlay backdrop button */}
      <div className="absolute inset-0" onClick={onClose} aria-label="Close modal background" />

      <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className={cn('p-2.5 rounded-xl', config.bg, config.color)}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">{config.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{config.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="닫기 (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Summary Strip */}
        <div className="px-6 py-3 bg-slate-100/70 border-b border-slate-200/60 flex items-center justify-between text-xs sm:text-sm">
          <span className="font-semibold text-slate-600">{config.totalLabel}</span>
          <span className="font-extrabold font-mono text-slate-900 text-base">
            {formatCurrency(config.totalValue)}
          </span>
        </div>

        {/* Breakdown List */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 divide-y divide-slate-100">
          {items.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">
              보유 중인 종목이 없습니다.
            </div>
          ) : (
            items.map(({ asset, value, ratio, sector }, index) => (
              <div key={asset.id} className={cn('space-y-2', index > 0 && 'pt-3.5')}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold text-slate-800 truncate">{asset.name}</span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                      {asset.ticker}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 shrink-0 hidden sm:inline">
                      {sector}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-bold font-mono text-slate-900">
                      {formatCurrency(value)}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-500">
                      {ratio.toFixed(1)}%
                      {type === 'dividendYield' && (
                        <span className="text-purple-600 ml-1.5 font-bold">
                          (배당률 {asset.dividendYield}%)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', config.barColor)}
                    style={{ width: `${Math.max(ratio, 1)}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <PieChart className="w-3.5 h-3.5" /> 총 {items.length}개 종목
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg text-xs transition-colors shadow-sm"
          >
            닫기 (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
