import React, { useEffect } from 'react';
import { Asset } from '../types';
import { X, Calendar, Tag, PieChart, Building2, Layers } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';

interface AssetDetailModalProps {
  asset: Asset | null;
  onClose: () => void;
}

export function AssetDetailModal({ asset, onClose }: AssetDetailModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (asset) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [asset, onClose]);

  if (!asset) return null;

  const totalValue = asset.price * asset.shares;
  const totalCost = asset.averageCost * asset.shares;
  const profit = totalValue - totalCost;
  const profitRatio = totalCost > 0 ? (profit / totalCost) * 100 : 0;
  const isProfit = profit >= 0;

  const annualDividend = totalValue * (asset.dividendYield / 100);
  const monthlyDividend = annualDividend / 12;

  const getFreqLabel = (freq: Asset['dividendFrequency']) => {
    switch (freq) {
      case 'Monthly': return '월배당';
      case 'Quarterly': return '분기배당';
      case 'Semi-Annually': return '반기배당';
      case 'Annually': return '연배당';
      default: return freq;
    }
  };

  // 자산 유형에 맞는 아이콘 리턴
  const renderAssetIcon = () => {
    if (asset.type === 'ETF') {
      return <PieChart className="w-5 h-5 text-white" />;
    } else if (asset.type === 'Stock') {
      return <Building2 className="w-5 h-5 text-white" />;
    }
    return <Layers className="w-5 h-5 text-white" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} aria-label="Close modal background" />
      <div 
        className="relative bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shrink-0">
              {renderAssetIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-800 leading-tight">{asset.name}</h2>
                <span className="text-xs px-2 py-0.5 rounded-md font-mono font-semibold bg-slate-200/70 text-slate-700">
                  {asset.ticker}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] font-medium text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Tag className="w-3 h-3 text-slate-400" /> {asset.type}
                </span>
                <span className="text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                  {getFreqLabel(asset.dividendFrequency)}
                </span>
              </div>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Main Portfolio Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] font-medium text-slate-500 block mb-1">평가 금액</span>
              <span className="text-lg font-bold text-slate-800 font-mono block">
                {formatCurrency(totalValue)}
              </span>
              <span className={cn("text-xs font-bold font-mono mt-0.5 block", isProfit ? "text-emerald-600" : "text-red-500")}>
                {isProfit ? '+' : ''}{formatCurrency(profit)} ({profitRatio >= 0 ? '+' : ''}{profitRatio.toFixed(2)}%)
              </span>
            </div>

            <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100/80">
              <span className="text-[11px] font-medium text-emerald-800/80 block mb-1">예상 연 배당금</span>
              <span className="text-lg font-bold text-emerald-700 font-mono block">
                {formatCurrency(annualDividend)}
              </span>
              <span className="text-xs font-medium text-emerald-600 block mt-0.5 font-mono">
                월 평균 {formatCurrency(monthlyDividend)}
              </span>
            </div>
          </div>

          {/* Key Metrics Table Grid */}
          <div className="bg-white rounded-xl border border-slate-200/80 divide-y divide-slate-100 text-sm">
            <div className="p-3 flex justify-between items-center">
              <span className="text-slate-500 text-xs font-medium">현재가</span>
              <span className="font-semibold text-slate-800 font-mono">{formatCurrency(asset.price)}</span>
            </div>
            <div className="p-3 flex justify-between items-center">
              <span className="text-slate-500 text-xs font-medium">매수 단가 (평단가)</span>
              <span className="font-semibold text-slate-800 font-mono">{formatCurrency(asset.averageCost)}</span>
            </div>
            {asset.lastPurchasePrice !== undefined && (
              <div className="p-3 flex justify-between items-center bg-slate-50/50">
                <span className="text-slate-500 text-xs font-medium">최근 매수가</span>
                <span className="font-semibold text-slate-800 font-mono">{formatCurrency(asset.lastPurchasePrice)}</span>
              </div>
            )}
            <div className="p-3 flex justify-between items-center">
              <span className="text-slate-500 text-xs font-medium">보유 수량</span>
              <span className="font-semibold text-slate-800 font-mono">{asset.shares.toLocaleString()}주</span>
            </div>
            <div className="p-3 flex justify-between items-center">
              <span className="text-slate-500 text-xs font-medium">총 매수 금액</span>
              <span className="font-semibold text-slate-800 font-mono">{formatCurrency(totalCost)}</span>
            </div>
            <div className="p-3 flex justify-between items-center">
              <span className="text-slate-500 text-xs font-medium">배당 수익률 (Yield)</span>
              <span className="font-bold text-blue-600 font-mono">{asset.dividendYield}%</span>
            </div>
          </div>

          {/* Dividend Schedule Dates */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-2.5">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" /> 주요 배당 일정
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                <span className="text-slate-400 text-[10px] block font-bold uppercase">배당락일 (Ex-Date)</span>
                <span className="font-semibold text-slate-800 font-mono block mt-0.5">
                  {asset.exDividendDate || '미정'}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                <span className="text-slate-400 text-[10px] block font-bold uppercase">배당 지급일 (Pay Date)</span>
                <span className="font-semibold text-slate-800 font-mono block mt-0.5">
                  {asset.paymentDate || '미정'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
