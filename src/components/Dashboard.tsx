import { useState } from 'react';
import { Plus, DollarSign, TrendingUp, Percent, Wallet, ChevronRight } from 'lucide-react';
import { Asset, PortfolioStats } from '../types';
import { AssetModal } from './AssetModal';
import { StatBreakdownModal, StatBreakdownType } from './StatBreakdownModal';
import { cn, formatCurrency } from '../lib/utils';
import { getAssetSector } from '../lib/sectorUtils';

interface DashboardProps {
  assets: Asset[];
  stats: PortfolioStats;
  onAdd: (asset: Omit<Asset, 'id'>) => void;
  onUpdate: (id: string, asset: Partial<Asset>) => void;
  onDelete: (id: string) => void;
}

export function Dashboard({ assets, stats, onAdd, onUpdate, onDelete }: DashboardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [breakdownType, setBreakdownType] = useState<StatBreakdownType>(null);

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAsset(null);
  };

  const handleSave = (assetData: Omit<Asset, 'id'>) => {
    if (editingAsset) {
      onUpdate(editingAsset.id, assetData);
    } else {
      onAdd(assetData);
    }
  };

  const statCards: {
    type: StatBreakdownType;
    label: string;
    value: string;
    icon: typeof Wallet;
    color: string;
    bg: string;
  }[] = [
    { type: 'totalValue', label: '총 자산 가치', value: formatCurrency(stats.totalValue), icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-100' },
    { type: 'totalCost', label: '총 매수 금액', value: formatCurrency(stats.totalCost), icon: DollarSign, color: 'text-slate-600', bg: 'bg-slate-100' },
    { type: 'annualDividend', label: '예상 연배당금', value: formatCurrency(stats.annualDividend), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { type: 'dividendYield', label: '포트폴리오 배당률', value: `${stats.dividendYield.toFixed(2)}%`, icon: Percent, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-6xl w-full mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">배당 대시보드</h2>
          <p className="text-slate-500 text-sm mt-1">포트폴리오의 주요 자산 지표 및 배당 현황을 한눈에 요약해 확인하세요.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" /> 종목 추가
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <button
            key={idx}
            onClick={() => setBreakdownType(card.type)}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between gap-3 text-left hover:border-blue-300 hover:shadow-md transition-all group cursor-pointer active:scale-[0.99]"
          >
            <div className="flex items-center justify-between text-slate-500 w-full">
              <div className="flex items-center gap-2.5">
                <div className={cn("p-2 rounded-lg transition-transform group-hover:scale-105", card.bg, card.color)}>
                  <card.icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-500 tracking-wide uppercase">{card.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-right font-sans">
              {card.value}
            </div>
          </button>
        ))}
      </div>

      {/* Holdings List (나의 포트폴리오) */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">나의 포트폴리오 (보유 종목 리스트)</h2>
          <span className="text-xs text-slate-500 font-mono">총 {assets.length}개 종목</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 font-semibold">종목</th>
                <th className="px-4 py-3 font-semibold text-right">현재가</th>
                <th className="px-4 py-3 font-semibold text-right">평단가</th>
                <th className="px-4 py-3 font-semibold text-right">최근 매수가</th>
                <th className="px-4 py-3 font-semibold text-right">수량</th>
                <th className="px-4 py-3 font-semibold text-right">배당률</th>
                <th className="px-4 py-3 font-semibold text-center">배당 주기</th>
                <th className="px-4 py-3 font-semibold text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {assets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    등록된 종목이 없습니다. '종목 추가' 버튼을 눌러 시작하세요.
                  </td>
                </tr>
              ) : (
                assets.map((asset) => {
                  const isProfit = asset.price >= asset.averageCost;
                  const profitRatio = ((asset.price - asset.averageCost) / asset.averageCost) * 100;
                  const sector = getAssetSector(asset);
                  return (
                    <tr key={asset.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-800">{asset.name}</span>
                              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60">
                                {sector}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 font-mono">{asset.ticker}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-600 font-mono">{formatCurrency(asset.price)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-medium text-slate-600 font-mono">{formatCurrency(asset.averageCost)}</div>
                        <div className={cn("text-[10px] font-bold mt-0.5", isProfit ? "text-emerald-500" : "text-red-500")}>
                          {isProfit ? '+' : ''}{profitRatio.toFixed(2)}%
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-600 font-mono">
                        {asset.lastPurchasePrice ? formatCurrency(asset.lastPurchasePrice) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600 font-mono">{asset.shares.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-medium text-emerald-600 font-mono">{asset.dividendYield}%</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                          {asset.dividendFrequency === 'Monthly' ? 'Monthly' : 
                           asset.dividendFrequency === 'Quarterly' ? 'Quarterly' : 
                           asset.dividendFrequency === 'Semi-Annually' ? 'Semi-Annually' : 'Annually'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleEdit(asset)} className="text-slate-400 hover:text-blue-600 transition-colors text-xs font-semibold cursor-pointer">수정</button>
                          <button onClick={() => onDelete(asset.id)} className="text-slate-400 hover:text-red-600 transition-colors text-xs font-semibold cursor-pointer">삭제</button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AssetModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        initialData={editingAsset}
      />

      <StatBreakdownModal
        type={breakdownType}
        isOpen={breakdownType !== null}
        onClose={() => setBreakdownType(null)}
        assets={assets}
        stats={stats}
      />
    </div>
  );
}
