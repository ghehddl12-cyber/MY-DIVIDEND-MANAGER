import { useMemo } from 'react';
import { Asset, PortfolioStats } from '../types';
import { formatCurrency } from '../lib/utils';
import { SectorRingChart } from './SectorRingChart';
import { StockNewsFeed } from './StockNewsFeed';
import { 
  PieChart, Pie, Cell, Tooltip as PieTooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as BarTooltip
} from 'recharts';

interface ReportViewProps {
  assets: Asset[];
  stats: PortfolioStats;
}

export function ReportView({ assets, stats }: ReportViewProps) {
  const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#64748b'];

  const compositionData = useMemo(() => {
    return assets.map(asset => ({
      name: asset.name || asset.ticker,
      value: asset.price * asset.shares
    })).sort((a, b) => b.value - a.value);
  }, [assets]);

  const monthlyDividendData = useMemo(() => {
    // Simplified estimation: evenly distribute annual dividend across months based on frequency
    const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    const monthlyDivs = new Array(12).fill(0);

    assets.forEach(asset => {
      const annualDiv = (asset.price * asset.shares) * (asset.dividendYield / 100);
      
      const frequencyDivisor = 
        asset.dividendFrequency === 'Monthly' ? 12 :
        asset.dividendFrequency === 'Quarterly' ? 4 :
        asset.dividendFrequency === 'Semi-Annually' ? 2 : 1;
        
      const payoutPerPeriod = annualDiv / frequencyDivisor;

      if (asset.dividendFrequency === 'Monthly') {
        for (let i = 0; i < 12; i++) monthlyDivs[i] += payoutPerPeriod;
      } else if (asset.dividendFrequency === 'Quarterly') {
        [2, 5, 8, 11].forEach(i => monthlyDivs[i] += payoutPerPeriod);
      } else if (asset.dividendFrequency === 'Semi-Annually') {
        [5, 11].forEach(i => monthlyDivs[i] += payoutPerPeriod);
      } else {
        monthlyDivs[11] += payoutPerPeriod;
      }
    });

    return months.map((month, idx) => ({
      month,
      amount: Math.round(monthlyDivs[idx])
    }));
  }, [assets]);

  return (
    <div className="p-4 sm:p-6 max-w-6xl w-full mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">통계 리포트</h2>
        <p className="text-slate-500 text-sm mt-1">포트폴리오 구성 비중 및 월별 예상 배당금을 직관적으로 확인하세요.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Composition Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h2 className="font-bold text-slate-800 mb-6">자산 구성 비중</h2>
          <div className="flex-1 min-h-[320px]">
            {assets.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">데이터가 없습니다.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={compositionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {compositionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <PieTooltip 
                    formatter={(value: number) => [formatCurrency(value), '평가액']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#64748b' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Monthly Dividend Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h2 className="font-bold text-slate-800 mb-6">월별 예상 배당금 (추정치)</h2>
          <div className="flex-1 min-h-[320px]">
             {assets.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">데이터가 없습니다.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyDividendData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    dy={10}
                  />
                  <YAxis 
                    tickFormatter={(val) => formatCurrency(val)} 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }}
                  />
                  <BarTooltip 
                    cursor={{ fill: '#f1f5f9', opacity: 0.5 }}
                    formatter={(value: number) => [formatCurrency(value), '예상 배당금']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Sector Ring Chart & Stock News Feed Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <SectorRingChart assets={assets} totalValue={stats.totalValue} />
        <StockNewsFeed assets={assets} />
      </div>
    </div>
  );
}
