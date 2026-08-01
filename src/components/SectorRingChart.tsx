import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieChartIcon, ShieldAlert } from 'lucide-react';
import { Asset } from '../types';
import { calculateSectorBreakdown } from '../lib/sectorUtils';
import { formatCurrency } from '../lib/utils';

interface SectorRingChartProps {
  assets: Asset[];
  totalValue: number;
}

export function SectorRingChart({ assets, totalValue }: SectorRingChartProps) {
  const breakdown = useMemo(() => {
    return calculateSectorBreakdown(assets, totalValue);
  }, [assets, totalValue]);

  if (assets.length === 0 || totalValue === 0) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between h-full min-h-[320px]">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <PieChartIcon className="w-5 h-5" />
          </span>
          <div>
            <h3 className="font-bold text-slate-800 text-base">섹터별 분산 현황</h3>
            <p className="text-xs text-slate-500">포트폴리오 업종 및 비중 다각화 분석</p>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 my-8">
          <ShieldAlert className="w-8 h-8 text-slate-300 mb-2 stroke-[1.5]" />
          <p className="text-xs font-medium">등록된 자산이 없습니다.</p>
        </div>
      </div>
    );
  }

  const topSector = breakdown[0];

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between h-full space-y-4">
      {/* Card Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shrink-0">
            <PieChartIcon className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-900 text-base truncate">섹터별 분산 현황</h3>
            <p className="text-xs text-slate-500 truncate">포트폴리오 업종 비중 다각화</p>
          </div>
        </div>
        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200/60 shrink-0">
          총 {breakdown.length}개 섹터
        </span>
      </div>

      {/* Donut Chart & Legend Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center flex-1">
        {/* Visual Donut Ring Chart with Center Metric */}
        <div className="sm:col-span-5 relative h-[180px] w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={breakdown}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={78}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {breakdown.map((entry, index) => (
                  <Cell key={`sector-cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val: number) => [formatCurrency(val), '평가 금액']}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#1e293b'
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Label inside Ring */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">주요 섹터</span>
            <span className="text-xs font-extrabold text-slate-800 truncate max-w-[85px] px-1">
              {topSector ? topSector.name : '-'}
            </span>
            <span className="text-[11px] font-bold font-mono text-blue-600">
              {topSector ? `${topSector.percentage.toFixed(1)}%` : ''}
            </span>
          </div>
        </div>

        {/* Sector Legend Items with Progress Bars */}
        <div className="sm:col-span-7 space-y-2.5 max-h-[210px] overflow-y-auto pr-1">
          {breakdown.map((item) => (
            <div key={item.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-semibold text-slate-800 truncate">{item.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({item.count}종목)</span>
                </div>
                <div className="text-right shrink-0 font-mono">
                  <span className="font-bold text-slate-800 mr-2">{formatCurrency(item.value)}</span>
                  <span className="text-blue-600 font-bold">{item.percentage.toFixed(1)}%</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, item.percentage)}%`,
                    backgroundColor: item.color
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
