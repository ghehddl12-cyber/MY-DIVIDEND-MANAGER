import React, { useState, useMemo } from 'react';
import { Asset, PortfolioStats } from '../types';
import { formatCurrency } from '../lib/utils';
import { 
  Scale, 
  PlusCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  RotateCcw, 
  Sliders, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  PieChart
} from 'lucide-react';

interface RebalanceGuideProps {
  assets: Asset[];
  stats: PortfolioStats;
}

export function RebalanceGuide({ assets, stats }: RebalanceGuideProps) {
  // Target weights mapping: asset.id -> percentage (e.g., 25)
  const [targetWeights, setTargetWeights] = useState<Record<string, number>>(() => {
    const initialMap: Record<string, number> = {};
    if (assets.length > 0) {
      const equalWeight = Number((100 / assets.length).toFixed(1));
      assets.forEach((a) => {
        initialMap[a.id] = equalWeight;
      });
    }
    return initialMap;
  });

  // Rebalancing mode: 'standard' (Buy/Sell) or 'buyOnly' (Fresh Capital Deposit)
  const [rebalanceMode, setRebalanceMode] = useState<'standard' | 'buyOnly'>('buyOnly');
  const [additionalCapital, setAdditionalCapital] = useState<number>(1000000); // 100만원 추가 매수

  // Handle target weight change
  const handleWeightChange = (id: string, value: number) => {
    setTargetWeights((prev) => ({
      ...prev,
      [id]: Math.max(0, Math.min(100, value)),
    }));
  };

  // Preset: Equal Weight
  const applyEqualWeight = () => {
    if (assets.length === 0) return;
    const eq = Number((100 / assets.length).toFixed(1));
    const newWeights: Record<string, number> = {};
    assets.forEach((a) => {
      newWeights[a.id] = eq;
    });
    setTargetWeights(newWeights);
  };

  // Preset: Weight proportional to dividend yield
  const applyYieldProportionalWeight = () => {
    if (assets.length === 0) return;
    const totalYield = assets.reduce((sum, a) => sum + a.dividendYield, 0);
    if (totalYield === 0) return applyEqualWeight();

    const newWeights: Record<string, number> = {};
    assets.forEach((a) => {
      newWeights[a.id] = Number(((a.dividendYield / totalYield) * 100).toFixed(1));
    });
    setTargetWeights(newWeights);
  };

  // Total portfolio value
  const totalValue = stats.totalValue || 1;

  // Sum of target weights
  const totalTargetWeight = useMemo(() => {
    return (Object.values(targetWeights) as number[]).reduce((sum: number, w: number) => sum + w, 0);
  }, [targetWeights]);

  // Asset analysis table
  const assetAnalysis = useMemo(() => {
    return assets.map((a) => {
      const currentVal = a.price * a.shares;
      const currentWeight = totalValue > 0 ? (currentVal / totalValue) * 100 : 0;
      const targetWeight = targetWeights[a.id] ?? 0;
      const weightDiff = currentWeight - targetWeight; // positive = overweight, negative = underweight

      // Target value in ideal rebalanced portfolio
      const idealTargetVal = (totalValue * targetWeight) / 100;
      const valDiff = idealTargetVal - currentVal; // positive = buy needed, negative = sell needed
      const shareDiff = a.price > 0 ? Math.round(valDiff / a.price) : 0;

      return {
        ...a,
        currentVal,
        currentWeight,
        targetWeight,
        weightDiff,
        idealTargetVal,
        valDiff,
        shareDiff,
      };
    });
  }, [assets, totalValue, targetWeights]);

  // Buy-Only Rebalancing Strategy Calculation (추가 매수 전용)
  const buyOnlyStrategy = useMemo(() => {
    if (rebalanceMode !== 'buyOnly' || additionalCapital <= 0) return null;

    const newTotalValue = totalValue + additionalCapital;
    
    // Calculate target value for each stock in the NEW portfolio
    const targets = assetAnalysis.map((item) => {
      const newTargetVal = (newTotalValue * item.targetWeight) / 100;
      const valShortfall = Math.max(0, newTargetVal - item.currentVal);
      return {
        id: item.id,
        name: item.name,
        ticker: item.ticker,
        price: item.price,
        currentVal: item.currentVal,
        valShortfall,
      };
    });

    const totalShortfall = targets.reduce((sum, t) => sum + t.valShortfall, 0);

    // Allocate cash based on shortfall ratio
    let remainingCash = additionalCapital;
    const recommendations = targets.map((t) => {
      if (totalShortfall === 0 || t.valShortfall === 0) {
        return { ...t, allocatedCash: 0, sharesToBuy: 0 };
      }
      const rawCash = (t.valShortfall / totalShortfall) * additionalCapital;
      const sharesToBuy = t.price > 0 ? Math.floor(rawCash / t.price) : 0;
      const allocatedCash = sharesToBuy * t.price;
      return { ...t, allocatedCash, sharesToBuy };
    });

    return recommendations;
  }, [assetAnalysis, totalValue, additionalCapital, rebalanceMode]);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 w-full">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl">
              <Scale className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">목표 비중 & 리밸런싱 가이드</h2>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            원하는 종목별 목표 비중을 설정하고, 현재 포트폴리오를 목표 비중에 맞추기 위한 최적의 매수/매도 주식 수를 계산합니다.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={applyEqualWeight}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> 동일 비중 자동 설정
          </button>
          <button
            onClick={applyYieldProportionalWeight}
            className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" /> 고배당 가중 설정
          </button>
        </div>
      </div>

      {/* Mode Selector & Additional Capital Setting */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span>리밸런싱 진행 방식 선택</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">매도 없이 신규 추가 자금으로 매수할 것인지, 기존 주식을 매도하여 조율할지 선택하세요.</p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setRebalanceMode('buyOnly')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                rebalanceMode === 'buyOnly'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5 inline mr-1" /> 추가 매수 리밸런싱 (매도 없음)
            </button>
            <button
              onClick={() => setRebalanceMode('standard')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                rebalanceMode === 'standard'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Scale className="w-3.5 h-3.5 inline mr-1" /> 표준 매수/매도 리밸런싱
            </button>
          </div>
        </div>

        {rebalanceMode === 'buyOnly' && (
          <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-900">오늘 추가로 매수할 투자 자금 입력</div>
                <div className="text-xs text-emerald-700">기존 종목을 팔지 않고, 입력한 자금만 부족한 종목에 분배하여 비중을 맞춥니다.</div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="number"
                value={additionalCapital}
                onChange={(e) => setAdditionalCapital(Number(e.target.value))}
                step={100000}
                className="bg-white border border-emerald-300 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-slate-800 focus:outline-none focus:border-emerald-500 w-full sm:w-48"
                placeholder="예: 1000000"
              />
              <span className="text-xs font-bold text-emerald-900 shrink-0">원</span>
            </div>
          </div>
        )}

        {/* Warning if total target weight != 100% */}
        {Math.abs(totalTargetWeight - 100) > 0.5 && (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center justify-between gap-2 text-xs text-amber-800 font-semibold">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>설정된 목표 비중 합계가 <strong>{totalTargetWeight.toFixed(1)}%</strong> 입니다. (100%가 되도록 조정해주세요)</span>
            </div>
            <button
              onClick={applyEqualWeight}
              className="text-amber-700 underline font-bold hover:text-amber-900 cursor-pointer text-[11px]"
            >
              100%로 자동 균등 맞춤
            </button>
          </div>
        )}
      </div>

      {/* Buy-Only Recommendation Result Cards */}
      {rebalanceMode === 'buyOnly' && buyOnlyStrategy && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>추가 매수 {formatCurrency(additionalCapital)} 최적 분배 가이드</span>
            </h3>
            <span className="text-xs font-mono font-semibold text-slate-500">
              실제 매수 예정액: {formatCurrency(buyOnlyStrategy.reduce((s, item) => s + item.allocatedCash, 0))}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {buyOnlyStrategy.map((rec) => (
              <div 
                key={rec.id}
                className={`p-4 rounded-xl border transition-all ${
                  rec.sharesToBuy > 0 
                    ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-400/20' 
                    : 'bg-slate-50 border-slate-200 opacity-70'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{rec.name}</h4>
                    <span className="text-xs text-slate-400 font-mono">{rec.ticker}</span>
                  </div>
                  {rec.sharesToBuy > 0 ? (
                    <span className="bg-emerald-600 text-white font-bold text-xs px-2.5 py-1 rounded-lg">
                      +{rec.sharesToBuy}주 매수
                    </span>
                  ) : (
                    <span className="bg-slate-200 text-slate-600 text-[11px] font-semibold px-2 py-0.5 rounded">
                      비중 충분 (매수 없음)
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-200/60 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">필요 매수 금액</span>
                    <span className="font-mono font-bold text-emerald-700">{formatCurrency(rec.allocatedCash)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">현재 보유액</span>
                    <span className="font-mono text-slate-700">{formatCurrency(rec.currentVal)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Target Weight Setup & Standard Action Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">종목별 비중 현황 및 목표 설정</h3>
            <p className="text-xs text-slate-500">슬라이더나 직접 입력으로 목표 비중(%)을 조절하세요.</p>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-500">
            총 자산: {formatCurrency(totalValue)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">종목명 / 티커</th>
                <th className="px-4 py-3 text-right">현재 평가액</th>
                <th className="px-4 py-3 text-right">현재 비중</th>
                <th className="px-4 py-3 text-center">목표 비중 (%)</th>
                <th className="px-4 py-3 text-right">비중 격차</th>
                <th className="px-4 py-3 text-center">
                  {rebalanceMode === 'standard' ? '목표 매매 주문' : '추가 매수 주문'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {assetAnalysis.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    포트폴리오에 자산이 없습니다. 대시보드에서 자산을 먼저 등록해주세요.
                  </td>
                </tr>
              ) : (
                assetAnalysis.map((item) => {
                  const buyRec = buyOnlyStrategy?.find(b => b.id === item.id);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800">{item.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{item.ticker} · 주당 {formatCurrency(item.price)}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800">
                        {formatCurrency(item.currentVal)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-700">
                        {item.currentWeight.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
                          <input
                            type="range"
                            min={0}
                            max={50}
                            step={0.5}
                            value={item.targetWeight}
                            onChange={(e) => handleWeightChange(item.id, Number(e.target.value))}
                            className="w-24 accent-blue-600 cursor-pointer hidden sm:inline-block"
                          />
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={0.5}
                            value={item.targetWeight}
                            onChange={(e) => handleWeightChange(item.id, Number(e.target.value))}
                            className="w-16 bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-center font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                          />
                          <span className="text-slate-500 font-bold">%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold">
                        {item.weightDiff > 0.1 ? (
                          <span className="text-red-500 flex items-center justify-end gap-1">
                            <ArrowUpRight className="w-3.5 h-3.5" /> +{item.weightDiff.toFixed(1)}% (초과)
                          </span>
                        ) : item.weightDiff < -0.1 ? (
                          <span className="text-blue-600 flex items-center justify-end gap-1">
                            <ArrowDownRight className="w-3.5 h-3.5" /> {item.weightDiff.toFixed(1)}% (부족)
                          </span>
                        ) : (
                          <span className="text-emerald-600">적정 비중</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {rebalanceMode === 'standard' ? (
                          item.shareDiff > 0 ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg font-bold">
                              +{item.shareDiff}주 매수 ({formatCurrency(item.valDiff)})
                            </span>
                          ) : item.shareDiff < 0 ? (
                            <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 px-2.5 py-1 rounded-lg font-bold">
                              {item.shareDiff}주 매도 ({formatCurrency(Math.abs(item.valDiff))})
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">유지</span>
                          )
                        ) : (
                          buyRec && buyRec.sharesToBuy > 0 ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-600 text-white px-2.5 py-1 rounded-lg font-bold shadow-xs">
                              +{buyRec.sharesToBuy}주 매수 ({formatCurrency(buyRec.allocatedCash)})
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">매수 필요없음</span>
                          )
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
