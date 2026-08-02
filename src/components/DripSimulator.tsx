import React, { useState, useMemo } from 'react';
import { Asset, PortfolioStats } from '../types';
import { formatCurrency } from '../lib/utils';
import { 
  Repeat, 
  TrendingUp, 
  DollarSign, 
  Sparkles, 
  RefreshCw, 
  Zap, 
  Calculator as CalcIcon,
  HelpCircle,
  BarChart2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  Legend 
} from 'recharts';

interface DripSimulatorProps {
  assets: Asset[];
  stats: PortfolioStats;
}

export function DripSimulator({ assets, stats }: DripSimulatorProps) {
  // Input parameters
  const [initialInvestment, setInitialInvestment] = useState<number>(stats.totalValue || 10000000);
  const [dividendYield, setDividendYield] = useState<number>(Number((stats.dividendYield || 4.0).toFixed(2)));
  const [monthlyContribution, setMonthlyContribution] = useState<number>(500000);
  const [dividendGrowthRate, setDividendGrowthRate] = useState<number>(5.0);
  const [priceGrowthRate, setPriceGrowthRate] = useState<number>(4.0);
  const [taxRate, setTaxRate] = useState<number>(15.4);
  const [years, setYears] = useState<number>(15);

  // Selected asset for single-stock DRIP simulation
  const [selectedAssetId, setSelectedAssetId] = useState<string>(assets[0]?.id || '');

  // Quick Sync with Active Portfolio
  const handleSyncWithPortfolio = () => {
    if (stats.totalValue > 0) {
      setInitialInvestment(Math.round(stats.totalValue));
    }
    if (stats.dividendYield > 0) {
      setDividendYield(Number(stats.dividendYield.toFixed(2)));
    }
  };

  // Calculate year-by-year DRIP vs Non-DRIP compound growth
  const simulationData = useMemo(() => {
    const data = [];
    
    // DRIP variables
    let dripPortfolioValue = initialInvestment;
    let dripCurrentYield = dividendYield / 100;

    // Non-DRIP variables
    let nonDripPortfolioValue = initialInvestment;
    let nonDripCurrentYield = dividendYield / 100;
    let nonDripCumulativeDividend = 0;

    // Total Principal invested by user
    let totalPrincipal = initialInvestment;

    for (let yr = 0; yr <= years; yr++) {
      if (yr === 0) {
        const initialAnnualDivNet = dripPortfolioValue * dripCurrentYield * (1 - taxRate / 100);
        data.push({
          year: '현재',
          yearNum: 0,
          totalPrincipal,
          dripValue: Math.round(dripPortfolioValue),
          dripMonthlyDiv: Math.round(initialAnnualDivNet / 12),
          dripAnnualDiv: Math.round(initialAnnualDivNet),
          nonDripValue: Math.round(nonDripPortfolioValue),
          nonDripMonthlyDiv: Math.round(initialAnnualDivNet / 12),
          nonDripCumDiv: 0,
        });
        continue;
      }

      // Add monthly contributions over the year (12 months)
      const annualNewDeposit = monthlyContribution * 12;
      totalPrincipal += annualNewDeposit;

      // 1. DRIP Simulation
      // Capital growth on existing assets + new deposits
      const dripValueBeforeDiv = dripPortfolioValue * (1 + priceGrowthRate / 100) + annualNewDeposit;
      const dripGrossDiv = dripValueBeforeDiv * dripCurrentYield;
      const dripNetDiv = dripGrossDiv * (1 - taxRate / 100);
      
      // Reinvest net dividend back into the portfolio
      dripPortfolioValue = dripValueBeforeDiv + dripNetDiv;
      
      // Organic dividend growth
      dripCurrentYield = dripCurrentYield * (1 + dividendGrowthRate / 100) / (1 + priceGrowthRate / 100);

      // 2. Non-DRIP Simulation (Dividends are taken out as cash, not reinvested)
      const nonDripValueEnd = nonDripPortfolioValue * (1 + priceGrowthRate / 100) + annualNewDeposit;
      const nonDripGrossDiv = nonDripValueEnd * nonDripCurrentYield;
      const nonDripNetDiv = nonDripGrossDiv * (1 - taxRate / 100);

      nonDripPortfolioValue = nonDripValueEnd; // Dividends NOT added back
      nonDripCumulativeDividend += nonDripNetDiv;
      nonDripCurrentYield = nonDripCurrentYield * (1 + dividendGrowthRate / 100) / (1 + priceGrowthRate / 100);

      data.push({
        year: `${yr}년 후`,
        yearNum: yr,
        totalPrincipal,
        dripValue: Math.round(dripPortfolioValue),
        dripMonthlyDiv: Math.round(dripNetDiv / 12),
        dripAnnualDiv: Math.round(dripNetDiv),
        nonDripValue: Math.round(nonDripPortfolioValue),
        nonDripMonthlyDiv: Math.round(nonDripNetDiv / 12),
        nonDripCumDiv: Math.round(nonDripCumulativeDividend),
      });
    }

    return data;
  }, [initialInvestment, dividendYield, monthlyContribution, dividendGrowthRate, priceGrowthRate, taxRate, years]);

  const finalYear = simulationData[simulationData.length - 1];
  const dripDiffValue = finalYear.dripValue - finalYear.nonDripValue;
  const dripDiffPercent = finalYear.nonDripValue > 0 ? ((dripDiffValue / finalYear.nonDripValue) * 100).toFixed(1) : '0';

  // Selected single asset DRIP projection
  const selectedAsset = useMemo(() => {
    return assets.find(a => a.id === selectedAssetId) || assets[0];
  }, [assets, selectedAssetId]);

  const singleAssetDripProjections = useMemo(() => {
    if (!selectedAsset) return [];
    
    let currentShares = selectedAsset.shares;
    let currentPrice = selectedAsset.price;
    let currentYield = selectedAsset.dividendYield / 100;
    
    const proj = [];
    for (let yr = 1; yr <= 10; yr++) {
      const annualDivGross = currentShares * currentPrice * currentYield;
      const annualDivNet = annualDivGross * (1 - taxRate / 100);
      const newSharesBought = currentPrice > 0 ? annualDivNet / currentPrice : 0;
      
      currentShares += newSharesBought;
      currentPrice = currentPrice * (1 + priceGrowthRate / 100);

      proj.push({
        year: yr,
        shares: Math.floor(currentShares),
        addedShares: Math.floor(newSharesBought),
        portfolioValue: Math.round(currentShares * currentPrice),
        annualNetDiv: Math.round(currentShares * currentPrice * currentYield * (1 - taxRate / 100)),
      });
    }
    return proj;
  }, [selectedAsset, taxRate, priceGrowthRate]);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 w-full">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-500/10 text-purple-600 rounded-xl">
              <Repeat className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">배당 재투자(DRIP) 복리 시뮬레이터</h2>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            받은 배당금을 인출하지 않고 자동 재투자할 때 복리 스노우볼이 자산을 얼마나 증폭시키는지 확인해보세요.
          </p>
        </div>

        <button
          onClick={handleSyncWithPortfolio}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
          현재 포트폴리오 데이터 불러오기
        </button>
      </div>

      {/* Inputs Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <CalcIcon className="w-4 h-4 text-purple-600" />
          <span>시뮬레이션 조건 설정</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">초기 투자금 (원)</label>
            <input
              type="number"
              value={initialInvestment}
              onChange={(e) => setInitialInvestment(Number(e.target.value))}
              step={1000000}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-slate-800 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">초기 배당 수익률 (%)</label>
            <input
              type="number"
              value={dividendYield}
              onChange={(e) => setDividendYield(Number(e.target.value))}
              step={0.1}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-slate-800 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">월 추가 적립금 (원)</label>
            <input
              type="number"
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(Number(e.target.value))}
              step={100000}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-slate-800 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">시뮬레이션 기간</label>
            <select
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value={5}>5년</option>
              <option value={10}>10년</option>
              <option value={15}>15년</option>
              <option value={20}>20년</option>
              <option value={30}>30년</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">예상 연 배당 성장률 (%)</label>
            <input
              type="number"
              value={dividendGrowthRate}
              onChange={(e) => setDividendGrowthRate(Number(e.target.value))}
              step={0.5}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono font-semibold text-slate-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">예상 연 주가 상승률 (%)</label>
            <input
              type="number"
              value={priceGrowthRate}
              onChange={(e) => setPriceGrowthRate(Number(e.target.value))}
              step={0.5}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono font-semibold text-slate-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">배당소득세율 (%)</label>
            <input
              type="number"
              value={taxRate}
              onChange={(e) => setTaxRate(Number(e.target.value))}
              step={0.1}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono font-semibold text-slate-700"
            />
          </div>
        </div>
      </div>

      {/* Key Result Summary Highlight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
              <span>{years}년 후 DRIP 재투자 총 자산</span>
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold font-mono tracking-tight text-white mt-1">
              {formatCurrency(finalYear.dripValue)}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-300 flex justify-between">
            <span>재투자 미적용 대비</span>
            <span className="font-bold font-mono text-emerald-400">+{formatCurrency(dripDiffValue)} (+{dripDiffPercent}%)</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 mb-1">
              {years}년 후 예상 월 평균 배당금 (세후)
            </div>
            <div className="text-3xl font-extrabold font-mono tracking-tight text-emerald-600 mt-1">
              {formatCurrency(finalYear.dripMonthlyDiv)} / 월
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
            <span>연간 총 배당금</span>
            <span className="font-bold font-mono text-slate-800">{formatCurrency(finalYear.dripAnnualDiv)}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 mb-1">
              총 투입 원금 (초기금 + 월 적립)
            </div>
            <div className="text-2xl font-extrabold font-mono tracking-tight text-slate-800 mt-1">
              {formatCurrency(finalYear.totalPrincipal)}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
            <span>순배당 수익으로 늘어난 자산</span>
            <span className="font-bold font-mono text-purple-600">{formatCurrency(finalYear.dripValue - finalYear.totalPrincipal)}</span>
          </div>
        </div>
      </div>

      {/* Comparison Area Chart */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="font-bold text-slate-800 text-base">자산 성장 곡선: DRIP 재투자 vs 미적용 인출</h3>
            <p className="text-xs text-slate-500">배당금을 주식에 계속 재투자했을 때의 스노우볼 격차입니다.</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-purple-600 inline-block" />
              <span className="text-slate-700">DRIP 자동 재투자</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-400 inline-block" />
              <span className="text-slate-500">배당금 인출 (미재투자)</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={simulationData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorDrip" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9333ea" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorNonDrip" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="year" stroke="#64748b" fontSize={11} />
              <YAxis 
                stroke="#64748b" 
                fontSize={11} 
                tickFormatter={(val) => `${(val / 10000).toLocaleString()}만`}
              />
              <Tooltip 
                formatter={(value: any) => [formatCurrency(Number(value)), '']}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '12px' }}
              />
              <Area 
                type="monotone" 
                dataKey="dripValue" 
                name="DRIP 재투자 총 자산" 
                stroke="#9333ea" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorDrip)" 
              />
              <Area 
                type="monotone" 
                dataKey="nonDripValue" 
                name="배당 미재투자 자산" 
                stroke="#94a3b8" 
                strokeWidth={2}
                strokeDasharray="4 4"
                fillOpacity={1} 
                fill="url(#colorNonDrip)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Single Asset DRIP Calculator */}
      {assets.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>개별 보유 종목 DRIP 스노우볼 시뮬레이션</span>
              </h3>
              <p className="text-xs text-slate-500">현재 포트폴리오의 특정 종목이 배당금으로 매년 주식을 몇 주씩 늘리는지 확인하세요.</p>
            </div>

            <select
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.shares}주 보유)
                </option>
              ))}
            </select>
          </div>

          {selectedAsset && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-2.5">경과 연도</th>
                    <th className="px-4 py-2.5">예상 총 보유 주식 수</th>
                    <th className="px-4 py-2.5">배당금으로 자동 매수한 주식</th>
                    <th className="px-4 py-2.5 text-right">예상 평가액</th>
                    <th className="px-4 py-2.5 text-right">연간 예상 배당금 (세후)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {singleAssetDripProjections.map((p) => (
                    <tr key={p.year} className="hover:bg-slate-50/60">
                      <td className="px-4 py-2.5 font-bold font-mono">{p.year}년 후</td>
                      <td className="px-4 py-2.5 font-bold text-slate-900 font-mono">
                        {p.shares}주 <span className="text-[10px] text-purple-600 font-normal">(+{p.shares - selectedAsset.shares}주 증가)</span>
                      </td>
                      <td className="px-4 py-2.5 text-purple-600 font-semibold font-mono">
                        +{p.addedShares}주 / 연
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-800">
                        {formatCurrency(p.portfolioValue)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-600">
                        {formatCurrency(p.annualNetDiv)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Yearly Milestone Details Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <h3 className="font-bold text-slate-800 text-sm">연도별 상세 복리 성장표</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="px-4 py-2.5">연도</th>
                <th className="px-4 py-2.5 text-right">누적 투입 원금</th>
                <th className="px-4 py-2.5 text-right">DRIP 총 자산</th>
                <th className="px-4 py-2.5 text-right">DRIP 월 배당금</th>
                <th className="px-4 py-2.5 text-right">미재투자 총 자산</th>
                <th className="px-4 py-2.5 text-right">재투자 차익 (복리 효과)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {simulationData.map((d) => (
                <tr key={d.yearNum} className="hover:bg-slate-50/60 font-mono">
                  <td className="px-4 py-2.5 font-bold text-slate-800">{d.year}</td>
                  <td className="px-4 py-2.5 text-right text-slate-500">{formatCurrency(d.totalPrincipal)}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-purple-700">{formatCurrency(d.dripValue)}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-emerald-600">{formatCurrency(d.dripMonthlyDiv)}/월</td>
                  <td className="px-4 py-2.5 text-right text-slate-500">{formatCurrency(d.nonDripValue)}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-blue-600">
                    +{formatCurrency(d.dripValue - d.nonDripValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
