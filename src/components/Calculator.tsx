import React, { useState, useMemo } from 'react';
import { Asset } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { RotateCw, Check } from 'lucide-react';

interface CalculatorProps {
  assets: Asset[];
}

export function Calculator({ assets }: CalculatorProps) {
  const [selectedAssetId, setSelectedAssetId] = useState<string>(assets[0]?.id || '');
  const [initialInvestment, setInitialInvestment] = useState<number>(10000);
  const [initialInvestmentInput, setInitialInvestmentInput] = useState<string>('10,000');
  const [monthlyContribution, setMonthlyContribution] = useState<number>(500);
  const [monthlyContributionInput, setMonthlyContributionInput] = useState<string>('500');
  const [years, setYears] = useState<number>(10);
  const [reinvestDividends, setReinvestDividends] = useState<boolean>(true);
  const [expectedAnnualGrowth, setExpectedAnnualGrowth] = useState<number>(5);

  const handleInitialInvestmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const cleanVal = val.replace(/[^\d]/g, '');
    if (!cleanVal) {
      setInitialInvestmentInput('');
      setInitialInvestment(0);
    } else {
      const num = parseInt(cleanVal, 10);
      setInitialInvestment(num);
      setInitialInvestmentInput(num.toLocaleString('en-US'));
    }
  };

  const handleMonthlyContributionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const cleanVal = val.replace(/[^\d]/g, '');
    if (!cleanVal) {
      setMonthlyContributionInput('');
      setMonthlyContribution(0);
    } else {
      const num = parseInt(cleanVal, 10);
      setMonthlyContribution(num);
      setMonthlyContributionInput(num.toLocaleString('en-US'));
    }
  };

  // 시뮬레이션에 실제로 적용된 파라미터 상태
  const [appliedParams, setAppliedParams] = useState({
    assetId: assets[0]?.id || '',
    initialInvestment: 10000,
    monthlyContribution: 500,
    years: 10,
    reinvestDividends: true,
    expectedAnnualGrowth: 5,
  });

  // 폼 입력값 변경 여부 확인
  const isDirty = 
    selectedAssetId !== appliedParams.assetId ||
    initialInvestment !== appliedParams.initialInvestment ||
    monthlyContribution !== appliedParams.monthlyContribution ||
    years !== appliedParams.years ||
    reinvestDividends !== appliedParams.reinvestDividends ||
    expectedAnnualGrowth !== appliedParams.expectedAnnualGrowth;

  const handleApply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAppliedParams({
      assetId: selectedAssetId,
      initialInvestment,
      monthlyContribution,
      years,
      reinvestDividends,
      expectedAnnualGrowth,
    });
  };

  const selectedAsset = assets.find(a => a.id === appliedParams.assetId) || assets.find(a => a.id === selectedAssetId);

  const simulationData = useMemo(() => {
    if (!selectedAsset) return [];

    const data = [];
    let currentBalance = appliedParams.initialInvestment;
    let totalContributed = appliedParams.initialInvestment;
    const divYield = selectedAsset.dividendYield / 100;
    const growthRate = appliedParams.expectedAnnualGrowth / 100;

    for (let year = 0; year <= appliedParams.years; year++) {
      if (year > 0) {
        // Yearly contribution
        const yearlyContribution = appliedParams.monthlyContribution * 12;
        totalContributed += yearlyContribution;
        
        // Growth applied to previous balance + half of new contribution
        const capitalGrowth = (currentBalance + yearlyContribution / 2) * growthRate;
        
        // Dividend earned
        const dividendEarned = (currentBalance + yearlyContribution / 2) * divYield;

        currentBalance += yearlyContribution + capitalGrowth;
        if (appliedParams.reinvestDividends) {
          currentBalance += dividendEarned;
        }
      }

      data.push({
        year,
        balance: Math.round(currentBalance),
        contributed: Math.round(totalContributed),
      });
    }

    return data;
  }, [selectedAsset, appliedParams]);

  const finalBalance = simulationData.length > 0 ? simulationData[simulationData.length - 1].balance : 0;
  const finalContributed = simulationData.length > 0 ? simulationData[simulationData.length - 1].contributed : 0;
  const totalReturn = finalBalance - finalContributed;

  return (
    <div className="p-4 sm:p-6 max-w-6xl w-full mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">배당 계산기</h2>
        <p className="text-slate-500 text-sm mt-1">목표 투자금과 배당 재투자 시뮬레이션을 통해 미래 자산을 예측해보세요.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls */}
        <div className="col-span-1 lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-slate-800">배당 시뮬레이터</h2>
            {isDirty && (
              <span className="inline-flex items-center text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                변경사항 있음
              </span>
            )}
          </div>
          
          <form onSubmit={handleApply} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 block">시뮬레이션 종목</label>
              <select 
                value={selectedAssetId} 
                onChange={(e) => setSelectedAssetId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
              >
                {assets.length === 0 && <option value="">종목 없음</option>}
                {assets.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.ticker}) - {a.dividendYield}%</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 block">초기 투자 금액 (원)</label>
              <input 
                type="text" 
                inputMode="numeric"
                value={initialInvestmentInput} 
                onChange={handleInitialInvestmentChange}
                placeholder="0"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 block">월 추가 투자 금액 (원)</label>
              <input 
                type="text" 
                inputMode="numeric"
                value={monthlyContributionInput} 
                onChange={handleMonthlyContributionChange}
                placeholder="0"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 block">예상 연평균 주가 성장률 (%)</label>
              <input 
                type="number" 
                step="0.1"
                value={expectedAnnualGrowth} 
                onChange={(e) => setExpectedAnnualGrowth(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 block">투자 기간 (년)</label>
              <input 
                type="number" 
                value={years} 
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
              />
            </div>

            <label className="flex items-center gap-3 py-2 cursor-pointer group">
              <div className="relative flex items-center">
                <input 
                  type="checkbox" 
                  checked={reinvestDividends} 
                  onChange={(e) => setReinvestDividends(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </div>
              <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">배당금 재투자 (DRIP)</span>
            </label>
            
            <button 
              type="submit"
              className={`w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                isDirty 
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 active:scale-[0.99]" 
                  : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200/80"
              }`}
            >
              {isDirty ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin-once" />
                  시뮬레이션 업데이트
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  최신 결과 반영됨
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="col-span-1 lg:col-span-8 flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-[9px] uppercase font-bold text-slate-400 mb-1">예상 최종 자산</div>
              <div className="text-2xl font-bold text-slate-800 font-mono">₩{finalBalance.toLocaleString('ko-KR')}</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-[9px] uppercase font-bold text-slate-400 mb-1">총 원금</div>
              <div className="text-xl font-semibold text-slate-700 font-mono">₩{finalContributed.toLocaleString('ko-KR')}</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-[9px] uppercase font-bold text-slate-400 mb-1">총 수익 (배당+시세차익)</div>
              <div className="text-xl font-semibold text-emerald-600 font-mono">+₩{totalReturn.toLocaleString('ko-KR')}</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex-1 min-h-[350px] flex flex-col">
            <h3 className="font-bold text-slate-800 mb-4">자산 성장 추이</h3>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={simulationData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorContributed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="year" 
                    tickFormatter={(val) => `${val}년`} 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    dy={10}
                  />
                  <YAxis 
                    tickFormatter={(val) => val >= 100000000 ? `₩${(val / 100000000).toFixed(1)}억` : val >= 10000 ? `₩${(val / 10000).toFixed(0)}만` : `₩${val.toLocaleString()}`} 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }}
                    dx={-10}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`₩${value.toLocaleString('ko-KR')}`, '']}
                    labelFormatter={(label) => `${label}년 차`}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="contributed" name="총 투자 원금" stroke="#94a3b8" strokeWidth={2} fillOpacity={1} fill="url(#colorContributed)" />
                  <Area type="monotone" dataKey="balance" name="총 자산" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorBalance)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
