import { useState, useMemo } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  addWeeks, 
  subWeeks, 
  addYears,
  subYears,
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  startOfWeek, 
  endOfWeek,
  parseISO
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Bell, 
  Calendar as CalendarIcon, 
  List, 
  LayoutGrid, 
  Clock, 
  PieChart,
  Building2,
  ChevronRight as ArrowRightIcon,
  Filter,
  ChevronDown,
  Receipt
} from 'lucide-react';
import { Asset } from '../types';
import { cn, formatCurrency } from '../lib/utils';
import { AssetDetailModal } from './AssetDetailModal';
import { ThisMonthDividendModal } from './ThisMonthDividendModal';
import { DividendLedger } from './DividendLedger';

interface CalendarViewProps {
  assets: Asset[];
}

type ViewMode = 'calendar' | 'list' | 'grid';

export function CalendarView({ assets }: CalendarViewProps) {
  const [tabMode, setTabMode] = useState<'calendar' | 'ledger'>('calendar');
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [calendarScale, setCalendarScale] = useState<'month' | 'week' | 'year'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAssetId, setSelectedAssetId] = useState<string>('all');
  const [notifications, setNotifications] = useState<Record<string, boolean>>({});
  const [modalAsset, setModalAsset] = useState<Asset | null>(null);
  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);

  const toggleNotification = (assetId: string) => {
    setNotifications(prev => ({ ...prev, [assetId]: !prev[assetId] }));
  };

  const handleNext = () => {
    if (calendarScale === 'year') {
      setCurrentDate(addYears(currentDate, 1));
    } else if (calendarScale === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const handlePrev = () => {
    if (calendarScale === 'year') {
      setCurrentDate(subYears(currentDate, 1));
    } else if (calendarScale === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);

  const startDate = calendarScale === 'month' ? startOfWeek(monthStart) : startOfWeek(currentDate);
  const endDate = calendarScale === 'month' ? endOfWeek(monthEnd) : endOfWeek(currentDate);

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  const getCalendarTitle = () => {
    if (calendarScale === 'year') {
      return format(currentDate, 'yyyy년');
    } else if (calendarScale === 'month') {
      return format(currentDate, 'yyyy년 MM월');
    } else {
      const wStart = startOfWeek(currentDate);
      const wEnd = endOfWeek(currentDate);
      return `${format(wStart, 'yyyy년 MM월 dd일')} ~ ${format(wEnd, 'MM월 dd일')}`;
    }
  };

  const filteredAssets = selectedAssetId === 'all' 
    ? assets 
    : assets.filter(a => a.id === selectedAssetId);

  // Calculate current month's overview summary
  const currentMonthIdx = currentDate.getMonth();
  const { thisMonthEventsCount, thisMonthEstSum } = useMemo(() => {
    let eventsCount = 0;
    let estSum = 0;

    filteredAssets.forEach(asset => {
      const annualDiv = (asset.price * asset.shares) * (asset.dividendYield / 100);
      const frequencyDivisor = 
        asset.dividendFrequency === 'Monthly' ? 12 :
        asset.dividendFrequency === 'Quarterly' ? 4 :
        asset.dividendFrequency === 'Semi-Annually' ? 2 : 1;
        
      const payoutPerPeriod = annualDiv / frequencyDivisor;

      let paysThisMonth = false;
      if (asset.dividendFrequency === 'Monthly') {
        paysThisMonth = true;
      } else if (asset.dividendFrequency === 'Quarterly' && [2, 5, 8, 11].includes(currentMonthIdx)) {
        paysThisMonth = true;
      } else if (asset.dividendFrequency === 'Semi-Annually' && [5, 11].includes(currentMonthIdx)) {
        paysThisMonth = true;
      } else if (asset.dividendFrequency === 'Annually' && currentMonthIdx === 11) {
        paysThisMonth = true;
      }

      if (paysThisMonth) {
        estSum += payoutPerPeriod;
        eventsCount++;
      }
    });

    return { thisMonthEventsCount: eventsCount, thisMonthEstSum: estSum };
  }, [filteredAssets, currentMonthIdx]);

  // Group events by date string (YYYY-MM-DD)
  const eventsByDate = useMemo(() => {
    const map: Record<string, { type: 'ex' | 'pay', asset: Asset }[]> = {};
    
    filteredAssets.forEach(asset => {
      if (asset.exDividendDate) {
        if (!map[asset.exDividendDate]) map[asset.exDividendDate] = [];
        map[asset.exDividendDate].push({ type: 'ex', asset });
      }
      if (asset.paymentDate) {
        if (!map[asset.paymentDate]) map[asset.paymentDate] = [];
        map[asset.paymentDate].push({ type: 'pay', asset });
      }
    });
    return map;
  }, [filteredAssets]);

  // Upcoming sorted schedule list
  const upcomingSchedule = useMemo(() => {
    const list: { dateStr: string; type: 'ex' | 'pay'; asset: Asset; parsedDate: Date }[] = [];
    
    filteredAssets.forEach(asset => {
      if (asset.exDividendDate) {
        try {
          const d = parseISO(asset.exDividendDate);
          list.push({ dateStr: asset.exDividendDate, type: 'ex', asset, parsedDate: d });
        } catch (e) {
          // ignore invalid date
        }
      }
      if (asset.paymentDate) {
        try {
          const d = parseISO(asset.paymentDate);
          list.push({ dateStr: asset.paymentDate, type: 'pay', asset, parsedDate: d });
        } catch (e) {
          // ignore invalid date
        }
      }
    });

    return list.sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());
  }, [filteredAssets]);

  const getFreqLabel = (freq: Asset['dividendFrequency']) => {
    switch (freq) {
      case 'Monthly': return '월배당';
      case 'Quarterly': return '분기배당';
      case 'Semi-Annually': return '반기배당';
      case 'Annually': return '연배당';
      default: return freq;
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-5 animate-in fade-in duration-500 w-full grow shrink-0 flex flex-col">
      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setTabMode('calendar')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
            tabMode === 'calendar'
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          <CalendarIcon className="w-4 h-4" /> 배당 일정 캘린더
        </button>
        <button
          onClick={() => setTabMode('ledger')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
            tabMode === 'ledger'
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          <Receipt className="w-4 h-4" /> 실제 배당 수령 가계부
        </button>
      </div>

      {tabMode === 'ledger' ? (
        <DividendLedger assets={assets} />
      ) : (
        <>
          {/* Title & Quick Stats Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-100">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">배당 캘린더</h2>
              <p className="text-slate-500 text-sm mt-0.5">배당락일 및 배당 지급일 일정을 한눈에 확인하세요.</p>
            </div>

            {/* Overview Badges */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsMonthModalOpen(true)}
                className="bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-300 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer group active:scale-95 shadow-2xs"
                title="클릭하여 이번 달 배당 지급 종목 목록 보기"
              >
                <span className="text-slate-600 group-hover:text-blue-700 font-medium">이번 달 지급 종목</span>
                <span className="font-bold text-blue-600 bg-blue-100/80 group-hover:bg-blue-600 group-hover:text-white px-2 py-0.5 rounded-md font-mono transition-colors">{thisMonthEventsCount}개</span>
              </button>
              <button
                type="button"
                onClick={() => setIsMonthModalOpen(true)}
                className="bg-slate-50 hover:bg-emerald-50/70 border border-slate-200/80 hover:border-emerald-300 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer group active:scale-95 shadow-2xs"
                title="클릭하여 이번 달 배당금 내역 보기"
              >
                <span className="text-slate-600 group-hover:text-emerald-700 font-medium">이번 달 예상 배당</span>
                <span className="font-bold text-emerald-600 group-hover:text-emerald-700 font-mono text-xs sm:text-sm">{formatCurrency(thisMonthEstSum)}</span>
              </button>
            </div>
          </div>

      {/* Unified Toolbar */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/60">
          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer",
              viewMode === 'calendar' 
                ? "bg-white text-blue-600 shadow-xs" 
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            달력 보기
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer",
              viewMode === 'list' 
                ? "bg-white text-blue-600 shadow-xs" 
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <List className="w-3.5 h-3.5" />
            일정 리스트
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer",
              viewMode === 'grid' 
                ? "bg-white text-blue-600 shadow-xs" 
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            종목 카드
          </button>
        </div>

        {/* Clean Dropdown Filter */}
        <div className="flex items-center gap-2 ml-auto">
          <div className="relative flex items-center">
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
            <select 
              value={selectedAssetId} 
              onChange={(e) => setSelectedAssetId(e.target.value)}
              className="pl-8 pr-8 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-xs transition-all cursor-pointer appearance-none"
            >
              <option value="all">전체 종목 보기 ({assets.length})</option>
              {assets.map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.ticker})</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: CALENDAR VIEW */}
      {viewMode === 'calendar' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs grow shrink-0 flex flex-col overflow-hidden animate-in fade-in-50 duration-200">
          {/* Calendar Header */}
          <div className="p-3.5 sm:p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
            {/* Date Navigation & Label */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center bg-white rounded-lg border border-slate-200 shadow-2xs">
                <button onClick={handlePrev} className="p-1.5 hover:bg-slate-50 text-slate-600 rounded-l-lg transition-colors cursor-pointer" title="이전">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setCurrentDate(new Date())} className="px-2.5 py-1 text-xs font-bold text-slate-700 border-x border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
                  오늘
                </button>
                <button onClick={handleNext} className="p-1.5 hover:bg-slate-50 text-slate-600 rounded-r-lg transition-colors cursor-pointer" title="다음">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
                {getCalendarTitle()}
              </h3>
            </div>

            {/* Calendar Scale Pills */}
            <div className="bg-slate-100 p-0.5 rounded-lg flex items-center border border-slate-200/60">
              <button
                type="button"
                onClick={() => setCalendarScale('month')}
                className={cn(
                  "px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer",
                  calendarScale === 'month' 
                    ? "bg-white text-blue-600 shadow-xs font-bold" 
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                월별
              </button>
              <button
                type="button"
                onClick={() => setCalendarScale('week')}
                className={cn(
                  "px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer",
                  calendarScale === 'week' 
                    ? "bg-white text-blue-600 shadow-xs font-bold" 
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                주별
              </button>
              <button
                type="button"
                onClick={() => setCalendarScale('year')}
                className={cn(
                  "px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer",
                  calendarScale === 'year' 
                    ? "bg-white text-blue-600 shadow-xs font-bold" 
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                연간
              </button>
            </div>
          </div>

          {/* Calendar Content */}
          {calendarScale === 'year' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-4 grow bg-slate-50/50 overflow-y-auto no-scrollbar">
              {Array.from({ length: 12 }).map((_, i) => {
                const targetMonth = new Date(currentDate.getFullYear(), i, 1);
                const isCurrentMonthObj = isSameMonth(targetMonth, new Date());
                
                let monthlyEst = 0;
                let payCount = 0;
                
                filteredAssets.forEach(asset => {
                  const annualDiv = (asset.price * asset.shares) * (asset.dividendYield / 100);
                  const frequencyDivisor = 
                    asset.dividendFrequency === 'Monthly' ? 12 :
                    asset.dividendFrequency === 'Quarterly' ? 4 :
                    asset.dividendFrequency === 'Semi-Annually' ? 2 : 1;
                    
                  const payoutPerPeriod = annualDiv / frequencyDivisor;

                  let paysThisMonth = false;
                  if (asset.dividendFrequency === 'Monthly') {
                    paysThisMonth = true;
                  } else if (asset.dividendFrequency === 'Quarterly' && [2, 5, 8, 11].includes(i)) {
                    paysThisMonth = true;
                  } else if (asset.dividendFrequency === 'Semi-Annually' && [5, 11].includes(i)) {
                    paysThisMonth = true;
                  } else if (asset.dividendFrequency === 'Annually' && i === 11) {
                    paysThisMonth = true;
                  }

                  if (paysThisMonth) {
                    monthlyEst += payoutPerPeriod;
                    payCount++;
                  }
                });

                return (
                  <div 
                    key={i} 
                    className={cn(
                      "bg-white p-3 rounded-xl border flex flex-col justify-between min-h-[110px] transition-all hover:shadow-md cursor-pointer",
                      isCurrentMonthObj ? "border-blue-300 ring-1 ring-blue-100 shadow-sm" : "border-slate-200"
                    )}
                    onClick={() => {
                      setCurrentDate(targetMonth);
                      setCalendarScale('month');
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={cn(
                        "text-sm font-bold",
                        isCurrentMonthObj ? "text-blue-600" : "text-slate-700"
                      )}>
                        {i + 1}월
                      </span>
                      {payCount > 0 && (
                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {payCount}종목 지급
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-auto">
                      <p className="text-[10px] font-medium text-slate-500 mb-0.5">예상 배당금</p>
                      <p className="font-mono font-bold text-slate-800 text-sm">
                        {monthlyEst > 0 ? formatCurrency(monthlyEst) : '-'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
                {weekDays.map(day => (
                  <div key={day} className="py-2 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 grow shrink-0 bg-slate-100 gap-px p-px">
                {days.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const dayEvents = eventsByDate[dateStr] || [];
                  const isCurrentMonth = isSameMonth(day, monthStart);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div 
                      key={day.toString()} 
                      className={cn(
                        "p-1.5 sm:p-2 bg-white flex flex-col transition-all",
                        calendarScale === 'week' ? "min-h-[220px] sm:min-h-[280px]" : "min-h-[85px] sm:min-h-[105px]",
                        !isCurrentMonth && calendarScale === 'month' && "bg-slate-50/50"
                      )}
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <span className={cn(
                          "text-[11px] sm:text-xs font-bold px-1.5 py-0.5 rounded-md",
                          isToday ? "bg-blue-600 text-white" : isCurrentMonth ? "text-slate-700" : "text-slate-400"
                        )}>
                          {calendarScale === 'week' ? format(day, 'M월 d일 (EEE)', { locale: undefined }) : format(day, 'd')}
                        </span>
                        {calendarScale === 'week' && dayEvents.length > 0 && (
                          <span className="text-[10px] font-semibold text-slate-400">
                            {dayEvents.length}개 일정
                          </span>
                        )}
                      </div>
                      
                      <div className={cn(
                        "space-y-1.5 grow",
                        calendarScale === 'week' ? "overflow-visible" : "max-h-[85px] overflow-y-auto no-scrollbar"
                      )}>
                        {dayEvents.map((evt, eIdx) => {
                          if (calendarScale === 'week') {
                            const totalValue = evt.asset.price * evt.asset.shares;
                            const annualDiv = totalValue * (evt.asset.dividendYield / 100);
                            const estDiv = evt.asset.dividendFrequency === 'Monthly' ? annualDiv / 12 : annualDiv / 4;

                            return (
                              <div 
                                key={eIdx}
                                onClick={() => setModalAsset(evt.asset)}
                                className={cn(
                                  "p-2 sm:p-2.5 rounded-xl flex flex-col justify-between group cursor-pointer hover:shadow-md transition-all border",
                                  evt.type === 'ex' 
                                    ? "bg-orange-50/90 hover:bg-orange-100/90 border-orange-200 text-orange-950" 
                                    : "bg-emerald-50/90 hover:bg-emerald-100/90 border-emerald-200 text-emerald-950"
                                )}
                                title={`${evt.asset.name} (${evt.asset.ticker}) 상세보기`}
                              >
                                <div className="flex items-start justify-between gap-1 mb-1">
                                  <span className={cn(
                                    "text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 shadow-xs",
                                    evt.type === 'ex' 
                                      ? "bg-orange-200/80 text-orange-800" 
                                      : "bg-emerald-200/80 text-emerald-800"
                                  )}>
                                    {evt.type === 'ex' ? '배당락' : '지급일'}
                                  </span>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleNotification(evt.asset.id);
                                    }}
                                    className="p-0.5 hover:bg-white/50 rounded transition-colors"
                                    title="알림 설정"
                                  >
                                    <Bell className={cn("w-3 h-3", notifications[evt.asset.id] ? "fill-current text-amber-600" : "text-slate-400")} />
                                  </button>
                                </div>

                                <div className="my-1">
                                  <h4 className="text-xs sm:text-sm font-bold leading-snug break-keep text-slate-800 group-hover:text-blue-700 transition-colors">
                                    {evt.asset.name}
                                  </h4>
                                  <span className="text-[10px] font-mono font-medium text-slate-500 block mt-0.5">
                                    {evt.asset.ticker}
                                  </span>
                                </div>

                                <div className="mt-1 pt-1 border-t border-black/5 flex items-center justify-between text-[11px] font-mono">
                                  <span className="text-slate-500 text-[10px]">{evt.asset.shares}주</span>
                                  <span className="font-bold text-slate-700">
                                    {formatCurrency(estDiv)}
                                  </span>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div 
                              key={eIdx} 
                              onClick={() => setModalAsset(evt.asset)}
                              className={cn(
                                "p-1.5 sm:p-1 rounded-md flex items-center justify-between group cursor-pointer hover:shadow-xs hover:opacity-90 transition-all",
                                evt.type === 'ex' 
                                  ? "bg-orange-100 text-orange-800 border border-orange-200/60" 
                                  : "bg-emerald-100 text-emerald-800 border border-emerald-200/60"
                              )}
                              title={`${evt.asset.name} (${evt.asset.ticker}) 상세보기`}
                            >
                              <span className="text-[10px] font-bold truncate leading-tight flex-1 mr-1">
                                {evt.asset.name}
                              </span>
                              <span className="text-[9px] font-semibold shrink-0 px-1 rounded bg-white/70">
                                {evt.type === 'ex' ? '배당락' : '지급'}
                              </span>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleNotification(evt.asset.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 p-0.5"
                                title="알림 설정"
                              >
                                <Bell className={cn("w-2.5 h-2.5", notifications[evt.asset.id] ? "fill-current text-amber-600" : "")} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* VIEW MODE 2: UPCOMING SCHEDULE LIST VIEW */}
      {viewMode === 'list' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden animate-in fade-in-50 duration-200">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-sm">
                {selectedAssetId === 'all' ? '전체 다가오는 배당 일정 목록' : '선택 종목 배당 일정 목록'}
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-full">
              총 {upcomingSchedule.length}건의 일정
            </span>
          </div>

          {upcomingSchedule.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              등록된 배당 일정이 없습니다.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {upcomingSchedule.map((item, idx) => {
                const totalValue = item.asset.price * item.asset.shares;
                const estAnnual = totalValue * (item.asset.dividendYield / 100);
                const estPayment = item.asset.dividendFrequency === 'Monthly' 
                  ? estAnnual / 12 
                  : estAnnual / 4;

                return (
                  <div 
                    key={idx}
                    onClick={() => setModalAsset(item.asset)}
                    className="p-4 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 border font-mono",
                        item.type === 'ex' 
                          ? "bg-orange-50 border-orange-200 text-orange-700" 
                          : "bg-emerald-50 border-emerald-200 text-emerald-700"
                      )}>
                        <span className="text-[10px] font-bold uppercase leading-none">
                          {item.type === 'ex' ? '배당락' : '지급일'}
                        </span>
                        <span className="text-sm font-bold mt-1 leading-none">
                          {format(item.parsedDate, 'MM.dd')}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                            {item.asset.name}
                          </h4>
                          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {item.asset.ticker}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          <span>일정: <strong className="text-slate-700 font-mono">{item.dateStr}</strong></span>
                          <span>•</span>
                          <span>주기: <strong className="text-slate-700">{getFreqLabel(item.asset.dividendFrequency)}</strong></span>
                          <span>•</span>
                          <span>보유: <strong className="text-slate-700 font-mono">{item.asset.shares}주</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block">예상 지급액</span>
                        <span className="text-sm font-bold font-mono text-slate-800">
                          {formatCurrency(estPayment)}
                        </span>
                      </div>
                      <button 
                        type="button"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <ArrowRightIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 3: ASSET CARDS GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in-50 duration-200">
          {filteredAssets.map((asset) => {
            const totalValue = asset.price * asset.shares;
            const annualDiv = totalValue * (asset.dividendYield / 100);
            const monthlyDiv = annualDiv / 12;

            return (
              <div 
                key={asset.id}
                onClick={() => setModalAsset(asset)}
                className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between group space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        {asset.type === 'ETF' ? <PieChart className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors leading-snug">
                          {asset.name}
                        </h4>
                        <span className="text-xs font-mono text-slate-400 block mt-0.5">
                          {asset.ticker}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 shrink-0">
                      {getFreqLabel(asset.dividendFrequency)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block">배당 수익률</span>
                      <span className="font-bold text-slate-800 font-mono text-sm">{asset.dividendYield}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">보유 수량</span>
                      <span className="font-bold text-slate-800 font-mono text-sm">{asset.shares}주</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">배당락일</span>
                    <span className="font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-100 font-mono">
                      {asset.exDividendDate || '미정'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">배당 지급일</span>
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-mono">
                      {asset.paymentDate || '미정'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1">
                    <span className="text-slate-500">예상 월 배당금</span>
                    <span className="font-bold text-emerald-600 font-mono text-sm">
                      {formatCurrency(monthlyDiv)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Asset Detail Modal */}
      <AssetDetailModal 
        asset={modalAsset} 
        onClose={() => setModalAsset(null)} 
      />

      {/* This Month's Dividend Breakdown Modal */}
      <ThisMonthDividendModal
        isOpen={isMonthModalOpen}
        onClose={() => setIsMonthModalOpen(false)}
        currentDate={currentDate}
        assets={filteredAssets}
        onSelectAsset={(asset) => setModalAsset(asset)}
      />
        </>
      )}
    </div>
  );
}


