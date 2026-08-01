import { useState, useEffect, FormEvent } from 'react';
import { Target, Edit3, CheckCircle2, TrendingUp, Sparkles, PieChart, ShieldCheck, ArrowRight, Lightbulb } from 'lucide-react';
import { Asset, PortfolioStats } from '../types';
import { cn, formatCurrency } from '../lib/utils';

interface DividendGoalTrackerProps {
  stats: PortfolioStats;
  assets: Asset[];
}

const GOAL_STORAGE_KEY = 'divitrack_monthly_goal_v1';

// Helper to format numbers with commas (thousands separator)
const formatNumberWithCommas = (value: string | number) => {
  if (value === undefined || value === null || value === '') return '';
  const cleanVal = value.toString().replace(/[^\d]/g, '');
  if (!cleanVal) return '';
  return parseInt(cleanVal, 10).toLocaleString('en-US');
};

const parseFormattedNumber = (value: string) => {
  const cleanVal = value.replace(/,/g, '');
  return parseFloat(cleanVal) || 0;
};

// Milestone definitions
const MILESTONES = [
  { id: 1, title: '스타벅스 커피값', amount: 30000, desc: '매월 프리미엄 커피 무료' },
  { id: 2, title: '스마트폰 통신비', amount: 100000, desc: '매월 통신/인터넷 요금 해결' },
  { id: 3, title: '아파트 관리비', amount: 300000, desc: '기본 주거 고정 지출 커버' },
  { id: 4, title: '월세 / 대출 이자', amount: 500000, desc: '주거 비용 부담 대폭 감소' },
  { id: 5, title: '월 100만원 소득', amount: 1000000, desc: '부업 수입 이상의 안정적 배당' },
  { id: 6, title: '완전한 파이어족', amount: 3000000, desc: '배당금만으로 생계 가능한 경제적 자유' },
];

export function DividendGoalTracker({ stats, assets }: DividendGoalTrackerProps) {
  const [monthlyTarget, setMonthlyTarget] = useState<number>(500000); // 기본값: 월 50만원
  const [isEditing, setIsEditing] = useState(false);
  const [tempTargetInput, setTempTargetInput] = useState<string>('500,000');

  // Load target goal from localStorage
  useEffect(() => {
    const savedGoal = localStorage.getItem(GOAL_STORAGE_KEY);
    if (savedGoal) {
      const parsed = parseFloat(savedGoal);
      if (!isNaN(parsed) && parsed > 0) {
        setMonthlyTarget(parsed);
        setTempTargetInput(formatNumberWithCommas(parsed));
      }
    } else {
      setTempTargetInput(formatNumberWithCommas(500000));
    }
  }, []);

  const handleSaveGoal = (e: FormEvent) => {
    e.preventDefault();
    const val = parseFormattedNumber(tempTargetInput);
    if (!isNaN(val) && val > 0) {
      setMonthlyTarget(val);
      localStorage.setItem(GOAL_STORAGE_KEY, val.toString());
      setIsEditing(false);
    }
  };

  const currentMonthly = stats.annualDividend / 12;
  const annualTarget = monthlyTarget * 12;
  const progressRatio = monthlyTarget > 0 ? (currentMonthly / monthlyTarget) * 100 : 0;
  const boundedProgress = Math.min(100, Math.max(0, progressRatio));

  const remainingMonthly = Math.max(0, monthlyTarget - currentMonthly);
  const remainingAnnual = remainingMonthly * 12;
  
  // Calculate required additional investment based on portfolio's dividend yield
  const portfolioYieldDecimal = stats.dividendYield > 0 ? stats.dividendYield / 100 : 0.04; // default 4% fallback if yield is 0
  const additionalInvestmentNeeded = remainingAnnual / portfolioYieldDecimal;

  // Status milestone badge styling
  const getMilestoneBadge = () => {
    if (progressRatio >= 100) return { text: '🎉 목표 100% 완전 달성!', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (progressRatio >= 75) return { text: '🔥 목표 달성이 눈앞에!', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    if (progressRatio >= 50) return { text: '🚀 50% 목표 반환점 돌파!', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
    if (progressRatio >= 25) return { text: '🌱 순항 중입니다!', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    return { text: '💪 힘차게 첫걸음 시작!', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
  };

  const milestone = getMilestoneBadge();

  // Contribution per asset to monthly target
  const assetContributions = assets.map(asset => {
    const totalValue = asset.price * asset.shares;
    const annualDiv = totalValue * (asset.dividendYield / 100);
    const monthlyDiv = annualDiv / 12;
    const contributionPercent = monthlyTarget > 0 ? (monthlyDiv / monthlyTarget) * 100 : 0;
    return {
      asset,
      monthlyDiv,
      contributionPercent
    };
  }).sort((a, b) => b.monthlyDiv - a.monthlyDiv);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 font-bold">
              <Target className="w-6 h-6" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              배당 목표
            </h1>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            월 배당금 목표를 설정하고 달성 과정을 실시간으로 추적하세요.
          </p>
        </div>

        <button
          onClick={() => {
            setTempTargetInput(formatNumberWithCommas(monthlyTarget));
            setIsEditing(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all shadow-xs hover:shadow self-start md:self-auto shrink-0"
        >
          <Edit3 className="w-4 h-4" />
          목표 설정 변경
        </button>
      </div>

      {/* Main Target Progress Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-6 sm:p-8 space-y-6">
        {/* Unified Goal & Current Dividend Header Box */}
        <div className="bg-slate-50/80 border border-slate-200/80 p-6 sm:p-7 rounded-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            {/* 현재 예상 월 배당금 */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">현재 예상 월 배당금</span>
                <span className={cn("text-[11px] font-bold px-2.5 py-0.5 rounded-full border", milestone.bg)}>
                  {progressRatio.toFixed(1)}% 달성
                </span>
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-blue-600 tracking-tight">
                {formatCurrency(currentMonthly)}
              </div>
            </div>

            {/* 목표 월 배당금 */}
            <div className="space-y-1.5 sm:border-l sm:border-slate-200/80 sm:pl-8">
              <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">목표 월 배당금</span>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-800 tracking-tight">
                {formatCurrency(monthlyTarget)}
              </div>
            </div>
          </div>
        </div>

        {/* Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Card 1: 목표까지 남은 배당금 */}
          <div className="bg-slate-50/80 border border-slate-200/80 p-4 rounded-xl flex flex-col justify-between space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
              </span>
              <span className="font-semibold text-slate-700">목표까지 부족한 월 배당금</span>
            </div>
            <div>
              {remainingMonthly > 0 ? (
                <div className="text-2xl font-bold font-mono text-slate-900">
                  {formatCurrency(remainingMonthly)}
                </div>
              ) : (
                <div className="text-xl font-bold text-emerald-600 flex items-center gap-1">
                  목표 완전 달성! 🎉
                </div>
              )}
            </div>
          </div>

          {/* Card 2: 필요 추가 자산 투자금 */}
          <div className="bg-slate-50/80 border border-slate-200/80 p-4 rounded-xl flex flex-col justify-between space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                <TrendingUp className="w-4 h-4" />
              </span>
              <span className="font-semibold text-slate-700">추가 추정 매수액</span>
            </div>
            <div>
              {remainingMonthly > 0 ? (
                <div className="text-2xl font-bold font-mono text-slate-900">
                  약 {formatCurrency(additionalInvestmentNeeded)}
                </div>
              ) : (
                <div className="text-lg font-bold text-emerald-600">
                  추가 매수 필요 없음
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Section: Asset Contribution & Milestone Roadmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Asset Target Contributions */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <PieChart className="w-5 h-5" />
              </span>
              <h3 className="font-bold text-slate-900 text-base">종목별 월 목표 기여도</h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">총 {assets.length}개 종목</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto pr-1">
            {assetContributions.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">등록된 자산이 없습니다.</p>
            ) : (
              assetContributions.map(({ asset, monthlyDiv, contributionPercent }) => (
                <div key={asset.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-xs truncate">{asset.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{asset.ticker}</span>
                    </div>
                    {/* Mini contribution bar */}
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, contributionPercent)}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold font-mono text-slate-800 block">
                      월 {formatCurrency(monthlyDiv)}
                    </span>
                    <span className="text-[10px] text-blue-600 font-bold font-mono">
                      목표의 {contributionPercent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Life Milestones Roadmap */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h3 className="font-bold text-slate-900 text-base">생활비 대체 마일스톤 단계</h3>
          </div>

          <div className="space-y-2.5">
            {MILESTONES.map((m) => {
              const isAchieved = currentMonthly >= m.amount;
              const ratio = Math.min(100, (currentMonthly / m.amount) * 100);

              return (
                <div
                  key={m.id}
                  className={cn(
                    "p-3 rounded-xl border transition-all flex items-center justify-between gap-3",
                    isAchieved
                      ? "bg-emerald-50/60 border-emerald-200/80 text-emerald-950"
                      : "bg-slate-50 border-slate-200 text-slate-700"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-bold text-xs",
                        isAchieved ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-600"
                      )}
                    >
                      {isAchieved ? '✓' : m.id}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs leading-tight text-slate-800">{m.title}</h4>
                      <p className="text-[11px] text-slate-500 truncate">{m.desc}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold font-mono text-slate-800 block">
                      월 {formatCurrency(m.amount)}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-semibold",
                        isAchieved ? "text-emerald-600 font-bold" : "text-slate-400"
                      )}
                    >
                      {isAchieved ? '달성 완료 🎉' : `${ratio.toFixed(0)}% 달성`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Goal Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white text-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                목표 배당금 설정
              </h4>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 block">
                  목표 월 배당금 (원 또는 달러)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={tempTargetInput}
                    onChange={(e) => setTempTargetInput(formatNumberWithCommas(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                    placeholder="예: 500,000"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  연간 배당금 목표: <strong className="text-slate-700 font-mono">{formatCurrency(parseFormattedNumber(tempTargetInput) * 12)}</strong>
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[100000, 300000, 500000, 1000000, 2000000, 3000000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTempTargetInput(formatNumberWithCommas(preset))}
                    className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-lg font-medium text-slate-600 border border-slate-200/80 transition-colors"
                  >
                    월 {formatCurrency(preset)}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                >
                  목표 저장하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

