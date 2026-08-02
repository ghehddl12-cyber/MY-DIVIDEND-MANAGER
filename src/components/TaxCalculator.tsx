import { useState } from 'react';
import { PiggyBank, ShieldCheck, HelpCircle, ArrowRight, TrendingUp, DollarSign, Info, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// 종합소득세 한계세율 구간 (지방소득세 10% 포함 실효세율)
// 2026년 기준 과세표준 구간: 6% / 15% / 24% / 35% / 38% / 40% / 42% / 45% (지방세 별도)
const MARGINAL_TAX_BRACKETS = [
  { label: '1,200만원 이하 (6.6%)', rate: 0.066 },
  { label: '1,200~4,600만원 (16.5%)', rate: 0.165 },
  { label: '4,600~8,800만원 (26.4%)', rate: 0.264 },
  { label: '8,800만원~1.5억원 (38.5%)', rate: 0.385 },
  { label: '1.5억~3억원 (41.8%)', rate: 0.418 },
  { label: '3억~5억원 (44.0%)', rate: 0.440 },
  { label: '5억~10억원 (46.2%)', rate: 0.462 },
  { label: '10억원 초과 (49.5%)', rate: 0.495 },
];

// 금융소득종합과세 기준금액 (연간, 지방세 포함 원천징수 15.4% 적용 한도)
const GLOBAL_TAX_THRESHOLD = 20000000;

export function TaxCalculator() {
  // Input States
  const [annualInvestment, setAnnualInvestment] = useState<number>(10000000); // 1,000만원
  const [dividendYield, setDividendYield] = useState<number>(5.0); // 5%
  const [capitalGainsYearly, setCapitalGainsYearly] = useState<number>(1000000); // 100만원
  const [investmentYears, setInvestmentYears] = useState<number>(3); // 3년
  const [incomeType, setIncomeType] = useState<'under55' | 'over55'>('under55'); // 5500만원 이하 vs 초과
  const [isaType, setIsaType] = useState<'normal' | 'farmer'>('normal'); // 일반형 vs 서민형
  const [marginalTaxRate, setMarginalTaxRate] = useState<number>(0.264); // 금융소득종합과세 적용시 한계세율 (기본값: 4,600~8,800만원 구간)

  // Helper formatting
  const formatCurrency = (val: number) => {
    return Math.round(val).toLocaleString('ko-KR') + '원';
  };

  const formatManWon = (val: number) => {
    const man = Math.round(val / 10000);
    return man.toLocaleString('ko-KR') + '만원';
  };

  // Tax calculations
  // Total investment over period
  const totalInvestment = annualInvestment * investmentYears;

  // Total dividends accumulated over period (approximate without compound reinvestment for base tax calculation)
  // Avg yearly investment over the period = annualInvestment * (years + 1) / 2
  const avgPortfolioValue = (annualInvestment * (investmentYears + 1)) / 2;
  // 연평균 배당소득 (금융소득종합과세 2천만원 기준 판정에 사용)
  const annualDividendAvg = avgPortfolioValue * (dividendYield / 100);
  const totalDividends = annualDividendAvg * investmentYears;
  const totalCapitalGains = capitalGainsYearly * investmentYears;
  const totalGrossProfit = totalDividends + totalCapitalGains;

  // 1. 일반 계좌 (Taxable)
  // 연간 이자·배당소득(금융소득)이 2,000만원을 초과하면 초과분은 다른 종합소득과 합산되어
  // 종합소득세율(누진세, 지방세 포함 6.6%~49.5%)이 적용됨 (금융소득종합과세)
  // *이 계산기는 배당소득만 다루며(이자소득 미포함), 국내 상장 '고배당기업' 주식에 적용되는
  //  2026년 배당소득 분리과세 특례(15.4%~33%)는 반영하지 않은 일반 원칙 기준입니다.
  const isGlobalTaxApplicable = annualDividendAvg > GLOBAL_TAX_THRESHOLD;
  const taxableDividendTaxPerYear = isGlobalTaxApplicable
    ? GLOBAL_TAX_THRESHOLD * 0.154 + (annualDividendAvg - GLOBAL_TAX_THRESHOLD) * marginalTaxRate
    : annualDividendAvg * 0.154;
  const taxableDividendTax = taxableDividendTaxPerYear * investmentYears;
  // 국내 ETF/주식 매매차익은 비과세로 가정(해외주식은 22%이나 기본 한국 상장 배당 ETF 기준)
  const taxableTotalTax = taxableDividendTax;
  const taxableNetProfit = totalGrossProfit - taxableTotalTax;

  // 2. ISA 계좌
  // 비과세 한도: 일반형 200만원, 서민형(총급여 5천만원 이하) 400만원
  // ISA 내 금융소득은 종합과세 판정 기준금액(2천만원)에 포함되지 않음
  // 유의: 최근 3년 내 금융소득종합과세 대상자는 ISA 신규 가입이 제한될 수 있음
  const isaTaxFreeLimit = isaType === 'farmer' ? 4000000 : 2000000;
  // 손익통산 적용 후 과세 대상 순이익
  const isaTaxableProfit = Math.max(0, totalGrossProfit - isaTaxFreeLimit);
  // 9.9% 분리과세
  const isaTotalTax = isaTaxableProfit * 0.099;
  const isaNetProfit = totalGrossProfit - isaTotalTax;
  const isaTaxSaved = taxableTotalTax - isaTotalTax;
  // 만기 연금 전환 추가 세액공제 (전환금액의 10%와 300만원 중 작은 금액, 세액공제율 적용)
  const isaPensionTransferTaxCredit = Math.min(3000000, (totalInvestment + isaNetProfit) * 0.1) * (incomeType === 'under55' ? 0.165 : 0.132);

  // 3. 연금저축/IRP 계좌
  // 연간 세액공제 한도: 최대 900만원 (연금저축 600만원 + IRP 300만원 합산)
  const eligibleTaxCreditBase = Math.min(annualInvestment, 9000000);
  const taxCreditRate = incomeType === 'under55' ? 0.165 : 0.132;
  const yearlyTaxCredit = eligibleTaxCreditBase * taxCreditRate;
  const totalTaxCreditRefund = yearlyTaxCredit * investmentYears; // 매년 받는 세액공제 환급금 총액

  // 과세이연: 운용기간 중 세금 0원
  // 연금 수령 시 저율 연금소득세: 연 수령액 1,500만원 이하는 3.3~5.5%(지방세 포함) 중 선택,
  // 초과시 종합과세 또는 16.5% 분리과세 중 선택 가능. 아래 4.4%는 그 범위 내 평균값을 사용한 근사치입니다.
  const pensionWithdrawalTax = totalGrossProfit * 0.044;
  const pensionNetProfit = totalGrossProfit - pensionWithdrawalTax + totalTaxCreditRefund;
  const pensionTotalBenefit = totalTaxCreditRefund + (taxableTotalTax - pensionWithdrawalTax);

  // Chart Data preparation (Comparison over 1 to 5 years)
  const chartData = Array.from({ length: 5 }, (_, i) => {
    const yr = i + 1;
    const avgVal = (annualInvestment * (yr + 1)) / 2;
    const annualDivAvgForYr = avgVal * (dividendYield / 100);
    const div = annualDivAvgForYr * yr;
    const gain = capitalGainsYearly * yr;
    const gross = div + gain;

    // Normal (금융소득종합과세 반영)
    const isGlobalForYr = annualDivAvgForYr > GLOBAL_TAX_THRESHOLD;
    const normTaxPerYear = isGlobalForYr
      ? GLOBAL_TAX_THRESHOLD * 0.154 + (annualDivAvgForYr - GLOBAL_TAX_THRESHOLD) * marginalTaxRate
      : annualDivAvgForYr * 0.154;
    const normTax = normTaxPerYear * yr;

    // ISA
    const isaTaxable = Math.max(0, gross - isaTaxFreeLimit);
    const isaTax = isaTaxable * 0.099;

    // Pension
    const penCredit = Math.min(annualInvestment, 9000000) * taxCreditRate * yr;
    const penTax = gross * 0.044;

    return {
      year: `${yr}년차`,
      일반계좌_수익: Math.round(gross - normTax),
      ISA_수익: Math.round(gross - isaTax),
      연금저축_수익_세액공제포함: Math.round(gross - penTax + penCredit),
    };
  });

  return (
    <div className="flex-1 overflow-auto bg-slate-50/50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xs border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
                <PiggyBank className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">ISA & 연금저축 절세 혜택 비교 계산기</h2>
                <p className="text-xs text-slate-500 mt-1">
                  일반 계좌 vs ISA vs 연금저축/IRP 계좌의 배당 소득세 및 세액공제 절세 효과를 한눈에 비교하세요.
                </p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-3.5 py-2 rounded-xl shrink-0 self-start md:self-auto">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              대한민국 2026 비과세/세액공제 기준
            </div>
          </div>
        </div>

        {/* 금융소득종합과세 경고 배너 */}
        {isGlobalTaxApplicable && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-amber-900">
                연평균 배당소득이 {formatManWon(annualDividendAvg)}으로 금융소득종합과세 기준금액(2,000만원)을 초과합니다.
              </p>
              <p className="text-xs text-amber-800 leading-relaxed">
                일반 계좌에서는 초과분이 다른 종합소득(근로·사업소득 등)과 합산되어 누진세율이 적용됩니다.
                아래에서 예상되는 종합소득 과세표준 구간(한계세율)을 선택하면 더 정확한 세액을 볼 수 있습니다.
                ISA·연금저축 계좌는 이 기준금액 판정에서 제외되므로 종합과세 회피에 유리합니다.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-2">
                {MARGINAL_TAX_BRACKETS.map((b) => (
                  <button
                    key={b.rate}
                    onClick={() => setMarginalTaxRate(b.rate)}
                    className={`px-2.5 py-1 text-[11px] rounded-lg font-bold border transition-colors cursor-pointer ${
                      marginalTaxRate === b.rate
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input Controls Grid */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-6">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            투자 조건 입력
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Annual Investment */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <label className="text-slate-700">연간 납입/투자 금액</label>
                <span className="text-indigo-600 font-mono text-sm">{formatManWon(annualInvestment)}</span>
              </div>
              <input
                type="range"
                min={1000000}
                max={40000000}
                step={1000000}
                value={annualInvestment}
                onChange={(e) => setAnnualInvestment(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
              />
              <div className="flex gap-1.5 pt-1">
                {[3000000, 6000000, 9000000, 20000000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setAnnualInvestment(amt)}
                    className={`flex-1 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                      annualInvestment === amt
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {amt / 10000}만원
                  </button>
                ))}
              </div>
            </div>

            {/* Dividend Yield */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <label className="text-slate-700">예상 연 배당수익률 (%)</label>
                <span className="text-emerald-600 font-mono text-sm">{dividendYield.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min={1.0}
                max={15.0}
                step={0.5}
                value={dividendYield}
                onChange={(e) => setDividendYield(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
              />
              <div className="flex gap-1.5 pt-1">
                {[3.5, 5.0, 7.0, 10.0].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setDividendYield(rate)}
                    className={`flex-1 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                      dividendYield === rate
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {rate}%
                  </button>
                ))}
              </div>
            </div>

            {/* Investment Years */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <label className="text-slate-700">투자 기간 (년)</label>
                <span className="text-blue-600 font-mono text-sm">{investmentYears}년</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={investmentYears}
                onChange={(e) => setInvestmentYears(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
              />
              <div className="flex gap-1.5 pt-1">
                {[3, 5, 7, 10].map((yr) => (
                  <button
                    key={yr}
                    onClick={() => setInvestmentYears(yr)}
                    className={`flex-1 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                      investmentYears === yr
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {yr}년
                  </button>
                ))}
              </div>
            </div>

            {/* Yearly Capital Gains */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <label className="text-slate-700">연간 예상 시세차익 (원)</label>
                <span className="text-purple-600 font-mono text-sm">{formatManWon(capitalGainsYearly)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={10000000}
                step={500000}
                value={capitalGainsYearly}
                onChange={(e) => setCapitalGainsYearly(Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
              />
            </div>

            {/* Income qualification */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">총급여 / 종합소득 구간</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIncomeType('under55')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    incomeType === 'under55'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  5,500만원 이하 (16.5%)
                </button>
                <button
                  type="button"
                  onClick={() => setIncomeType('over55')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    incomeType === 'over55'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  5,500만원 초과 (13.2%)
                </button>
              </div>
            </div>

            {/* ISA Type */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">ISA 자격 유형</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsaType('normal')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    isaType === 'normal'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  일반형 (비과세 200만)
                </button>
                <button
                  type="button"
                  onClick={() => setIsaType('farmer')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    isaType === 'farmer'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  서민형 (비과세 400만, 총급여 5천만원 이하)
                </button>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed pt-1">
                * 최근 3년 내 금융소득종합과세 대상자(연 금융소득 2,000만원 초과)는 ISA 신규 가입이 제한될 수 있습니다.
              </p>
            </div>

          </div>
        </div>

        {/* 3 Account Cards Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Taxable Account */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
                  일반 위탁 계좌
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {isGlobalTaxApplicable ? '종합과세 적용' : '기본'}
                </span>
              </div>
              <h4 className="font-extrabold text-lg text-slate-900 mb-1">일반 계좌</h4>
              <p className="text-xs text-slate-500 mb-4">
                {isGlobalTaxApplicable
                  ? '2,000만원까지 15.4%, 초과분은 종합소득세율 적용'
                  : '배당금 받을 때마다 15.4% 원천징수'}
              </p>

              <div className="space-y-2.5 py-3 border-t border-slate-100 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">총 배당금 + 차익</span>
                  <span className="font-mono font-bold text-slate-800">{formatManWon(totalGrossProfit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    배당소득세{isGlobalTaxApplicable ? ' (15.4% + 종합과세)' : ' (15.4%)'}
                  </span>
                  <span className="font-mono font-bold text-rose-600">-{formatManWon(taxableDividendTax)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">세액공제 환급금</span>
                  <span className="font-mono font-bold text-slate-400">0원</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 bg-slate-50/60 -mx-6 -mb-6 p-6 rounded-b-2xl mt-4">
              <div className="text-xs text-slate-500 font-medium mb-1">최종 세후 순수익</div>
              <div className="text-xl font-black font-mono text-slate-900">{formatManWon(taxableNetProfit)}</div>
            </div>
          </div>

          {/* ISA Account */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border-2 border-emerald-500 relative flex flex-col justify-between">
            <div className="absolute -top-3 right-4 bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
              추천 절세 계좌
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-200">
                  ISA 계좌 ({isaType === 'farmer' ? '서민형' : '일반형'})
                </span>
                <span className="text-xs font-bold text-emerald-600 font-mono">
                  +{formatManWon(isaTaxSaved)} 절세
                </span>
              </div>
              <h4 className="font-extrabold text-lg text-slate-900 mb-1">중개형 ISA</h4>
              <p className="text-xs text-slate-500 mb-4">비과세 {isaTaxFreeLimit / 10000}만원 + 한도초과 9.9% 분리과세</p>

              <div className="space-y-2.5 py-3 border-t border-slate-100 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">총 배당금 + 차익</span>
                  <span className="font-mono font-bold text-slate-800">{formatManWon(totalGrossProfit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ISA 납부 세금 (9.9%)</span>
                  <span className="font-mono font-bold text-emerald-600">-{formatManWon(isaTotalTax)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">만기 연금전환 세액공제</span>
                  <span className="font-mono font-bold text-indigo-600">최대 +{formatManWon(isaPensionTransferTaxCredit)}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-emerald-100 bg-emerald-50/40 -mx-6 -mb-6 p-6 rounded-b-2xl mt-4">
              <div className="text-xs text-emerald-700 font-bold mb-1">최종 세후 순수익</div>
              <div className="text-xl font-black font-mono text-emerald-800">{formatManWon(isaNetProfit)}</div>
            </div>
          </div>

          {/* Pension Savings Account */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border-2 border-indigo-500 relative flex flex-col justify-between">
            <div className="absolute -top-3 right-4 bg-indigo-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
              최대 세액공제
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-200">
                  연금저축 + IRP
                </span>
                <span className="text-xs font-bold text-indigo-600 font-mono">
                  연 {taxCreditRate * 100}% 세액공제
                </span>
              </div>
              <h4 className="font-extrabold text-lg text-slate-900 mb-1">연금저축 / IRP</h4>
              <p className="text-xs text-slate-500 mb-4">과세이연 100% 재투자 + 매년 13월의 월급 환급</p>

              <div className="space-y-2.5 py-3 border-t border-slate-100 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">누적 세액공제 환급금</span>
                  <span className="font-mono font-bold text-indigo-600">+{formatManWon(totalTaxCreditRefund)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">운용 중 세금</span>
                  <span className="font-mono font-bold text-emerald-600">0원 (과세이연)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">인출시 연금소득세(평균 4.4%)</span>
                  <span className="font-mono font-bold text-slate-600">-{formatManWon(pensionWithdrawalTax)}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-indigo-100 bg-indigo-50/40 -mx-6 -mb-6 p-6 rounded-b-2xl mt-4">
              <div className="text-xs text-indigo-700 font-bold mb-1">총 세후 수익 + 세액공제 환급</div>
              <div className="text-xl font-black font-mono text-indigo-800">{formatManWon(pensionNetProfit)}</div>
            </div>
          </div>

        </div>

        {/* Visual Chart Comparison */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900">기간별 세후 총 순수익 비교 차트</h3>
            <span className="text-xs text-slate-400 font-medium">단위: 원</span>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="year" tickLine={false} axisLine={{ stroke: '#E2E8F0' }} tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis 
                  tickLine={false} 
                  axisLine={{ stroke: '#E2E8F0' }} 
                  tick={{ fontSize: 11, fill: '#64748B' }} 
                  tickFormatter={(val) => `${Math.round(val / 10000)}만`} 
                />
                <Tooltip 
                  formatter={(val: number) => [formatCurrency(Number(val)), '']} 
                  contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', color: '#fff', border: 'none', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="일반계좌_수익" name="일반계좌" fill="#94A3B8" radius={[6, 6, 0, 0]} />
                <Bar dataKey="ISA_수익" name="중개형 ISA" fill="#10B981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="연금저축_수익_세액공제포함" name="연금저축 (세액공제 포함)" fill="#6366F1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 overflow-x-auto">
          <h3 className="font-bold text-base text-slate-900 mb-4">계좌별 세무 혜택 한눈에 비교표</h3>
          <table className="w-full text-left text-xs min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                <th className="p-3.5 rounded-l-xl">항목</th>
                <th className="p-3.5">일반 계좌</th>
                <th className="p-3.5 text-emerald-800">중개형 ISA</th>
                <th className="p-3.5 text-indigo-800 rounded-r-xl">연금저축 / IRP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="p-3.5 font-bold text-slate-900 bg-slate-50/50">연간 납입 한도</td>
                <td className="p-3.5">제한 없음</td>
                <td className="p-3.5 font-bold text-emerald-700">연 2,000만원 (이월 가능, 최대 1억)</td>
                <td className="p-3.5 font-bold text-indigo-700">연 1,800만원 (세액공제 한도 900만원)</td>
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-slate-900 bg-slate-50/50">세액공제 혜택</td>
                <td className="p-3.5">없음</td>
                <td className="p-3.5">없음 (단, 연금 전환시 10% 추가 공제)</td>
                <td className="p-3.5 font-bold text-indigo-700">13.2% ~ 16.5% (최대 148.5만원 환급)</td>
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-slate-900 bg-slate-50/50">배당소득 세율</td>
                <td className="p-3.5 text-rose-600 font-bold">15.4% (2천만원 초과시 종합과세 6.6~49.5%)</td>
                <td className="p-3.5 font-bold text-emerald-700">비과세 + 9.9% (분리과세, 종합과세 기준 제외)</td>
                <td className="p-3.5 font-bold text-indigo-700">0% (과세이연 후 인출시 3.3~16.5%)</td>
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-slate-900 bg-slate-50/50">손익 통산 여부</td>
                <td className="p-3.5">불가 (손실나도 배당세 납부)</td>
                <td className="p-3.5 font-bold text-emerald-700">가능 (손실 차감 후 이익에만 과세)</td>
                <td className="p-3.5">과세이연으로 미적용</td>
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-slate-900 bg-slate-50/50">중도 인출 및 의무기간</td>
                <td className="p-3.5">언제든 자율 인출</td>
                <td className="p-3.5">의무가입 3년 (원금 중도인출 가능)</td>
                <td className="p-3.5">55세 이후 연금 수령 (중도 해지시 16.5% 기타소득세)</td>
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-slate-900 bg-slate-50/50">주요 매수 추천 종목</td>
                <td className="p-3.5">국내주식 (매매차익 비과세)</td>
                <td className="p-3.5 font-bold text-emerald-700">국내 상장 해외 ETF (SCHD, S&P500), 고배당주</td>
                <td className="p-3.5 font-bold text-indigo-700">장기 배당 growth ETF, 지수 ETF</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Strategy Tips */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-6 text-white space-y-4">
          <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
            <Info className="w-4 h-4 text-indigo-400" />
            배당 투자자를 위한 실전 절세 테크트리
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed">
            <div className="bg-white/10 p-4 rounded-xl border border-white/10 space-y-2">
              <span className="font-bold text-emerald-400 block text-sm">1단계: 연금저축 600만원 채우기</span>
              <p className="text-slate-300">
                매년 600만원 납입 시 99만원(16.5%)의 확정 수익(세액공제)을 얻을 수 있습니다. 미국 배당 ETF를 담아 과세이연 복리 효과를 극대화하세요.
              </p>
            </div>
            <div className="bg-white/10 p-4 rounded-xl border border-white/10 space-y-2">
              <span className="font-bold text-indigo-400 block text-sm">2단계: ISA 3년 주기 만기 이전 전략</span>
              <p className="text-slate-300">
                ISA를 3년마다 만기 해지 후 연금계좌로 전환하면 전환금의 10%(최대 300만원)를 추가 세액공제 받을 수 있습니다.
              </p>
            </div>
            <div className="bg-white/10 p-4 rounded-xl border border-white/10 space-y-2">
              <span className="font-bold text-purple-400 block text-sm">3단계: IRP 추가 300만원 활용</span>
              <p className="text-slate-300">
                여유 자금이 있다면 IRP에 300만원을 추가 납입하여 총 900만원 세액공제 한도(최대 148.5만원 환급)를 모두 챙기세요.
              </p>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-slate-100 border border-slate-200 rounded-2xl p-5 flex items-start gap-3">
          <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-500 leading-relaxed">
            본 계산기는 이해를 돕기 위한 참고용 시뮬레이션이며, 실제 세액과는 차이가 있을 수 있습니다.
            이자소득 합산, 건강보험료 영향, 국내 상장 '고배당기업' 주식에 대한 배당소득 분리과세 특례(2026년 시행) 등은 반영되지 않았습니다.
            연금 수령 시 세율은 연 수령액 구간에 따라 3.3%~16.5% 사이에서 달라질 수 있습니다.
            정확한 세액 및 신고는 반드시 세무 전문가와 상담하시기 바랍니다.
          </p>
        </div>

      </div>
    </div>
  );
}
