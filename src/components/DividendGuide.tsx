import { useState, useEffect } from 'react';
import { BookOpen, CheckCircle2, Circle, ArrowRight, Trophy, Play, Check } from 'lucide-react';
import { ViewState } from '../types';
import { supabase } from '../lib/supabaseClient';

interface DividendGuideProps {
  onChangeView: (view: ViewState) => void;
  userId: string;
}

const GUIDE_SETTING_KEY = 'guide_progress';

interface GuideStep {
  id: string;
  title: string;
  description: string;
  linkText?: string;
  linkView?: ViewState;
  estimatedTime?: string;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    id: 'step_1',
    title: '배당 목표 설정하기',
    description: '매월 얼마의 배당금을 받고 싶은지 구체적인 목표를 세워보세요. 목표가 뚜렷할수록 달성 가능성이 높아집니다.',
    linkText: '배당 목표 설정으로 이동',
    linkView: 'goal',
    estimatedTime: '5분',
  },
  {
    id: 'step_2',
    title: '절세 계좌 준비 (선택사항)',
    description: 'ISA, 연금저축펀드 등 절세 혜택이 있는 계좌를 활용하면 배당 소득세를 크게 아낄 수 있습니다. 본인의 투자 목적에 맞는 계좌를 개설하세요.',
    estimatedTime: '15분',
  },
  {
    id: 'step_3',
    title: '배당 종목 발굴 및 시뮬레이션',
    description: '고배당 ETF나 배당 성장주 등 어떤 종목에 투자할지 찾아보고, 배당 계산기나 DRIP 시뮬레이터를 통해 미래 수익을 예측해 봅니다.',
    linkText: '배당 계산기로 이동',
    linkView: 'calculator',
    estimatedTime: '30분',
  },
  {
    id: 'step_4',
    title: '포트폴리오 생성 및 자산 등록',
    description: '실제 매수한 종목(또는 가상 종목)을 대시보드에 등록하여 나만의 배당 포트폴리오를 만드세요.',
    linkText: '대시보드로 이동',
    linkView: 'dashboard',
    estimatedTime: '10분',
  },
  {
    id: 'step_5',
    title: '배당금 일정 확인 및 기록',
    description: '배당 캘린더를 통해 다가오는 배당일을 확인하고, 실제로 입금된 배당금을 관리하며 성취감을 느껴보세요.',
    linkText: '배당 캘린더로 이동',
    linkView: 'calendar',
    estimatedTime: '5분',
  },
  {
    id: 'step_6',
    title: '배당금 재투자 (DRIP) 및 리밸런싱',
    description: '받은 배당금을 다시 투자하여 복리의 마법을 누리고, 주기적인 리밸런싱으로 포트폴리오의 균형과 안정성을 유지하세요.',
    linkText: '리밸런싱 가이드로 이동',
    linkView: 'rebalance',
    estimatedTime: '15분',
  },
];

export function DividendGuide({ onChangeView, userId }: DividendGuideProps) {
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('user_settings')
      .select('value')
      .eq('user_id', userId)
      .eq('key', GUIDE_SETTING_KEY)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (Array.isArray(data?.value)) {
          setCompletedSteps(data.value as string[]);
        }
        setIsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!isLoaded) return;
    supabase
      .from('user_settings')
      .upsert({ user_id: userId, key: GUIDE_SETTING_KEY, value: completedSteps, updated_at: new Date().toISOString() })
      .then(({ error }) => {
        if (error) console.error('가이드 진행상태 저장 실패', error);
      });
  }, [completedSteps, isLoaded, userId]);

  const toggleStep = (id: string) => {
    setCompletedSteps(prev => 
      prev.includes(id) ? prev.filter(stepId => stepId !== id) : [...prev, id]
    );
  };

  const progressPercentage = (completedSteps.length / GUIDE_STEPS.length) * 100;
  const isAllCompleted = completedSteps.length === GUIDE_STEPS.length;

  return (
    <div className="flex-1 overflow-auto bg-slate-50/50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">배당 투자 완벽 가이드</h2>
              <p className="text-sm text-slate-500 mt-1">성공적인 배당 투자를 위한 6단계 로드맵을 차근차근 따라가 보세요.</p>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-bold text-slate-700">나의 진행률</span>
              <span className="text-sm font-black text-indigo-600">{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3">
              <div 
                className="bg-indigo-600 h-3 rounded-full transition-all duration-500 ease-out relative overflow-hidden" 
                style={{ width: `${progressPercentage}%` }}
              >
                <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3 font-medium">
              총 {GUIDE_STEPS.length}단계 중 <span className="font-bold text-slate-700">{completedSteps.length}단계</span> 완료
            </p>
          </div>
        </div>

        {/* Success Banner */}
        {isAllCompleted && (
          <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600 shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-emerald-800 text-lg">축하합니다! 모든 가이드를 완료했습니다.</h3>
              <p className="text-sm text-emerald-600 mt-1">이제 나만의 훌륭한 배당 파이프라인이 구축되었습니다. 꾸준히 모니터링하며 복리의 마법을 누려보세요.</p>
            </div>
          </div>
        )}

        {/* Steps List */}
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[23px] before:-translate-x-px md:before:ml-[31px] md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-200">
          {GUIDE_STEPS.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id);
            return (
              <div key={step.id} className="relative flex items-start gap-4 md:gap-6 group">
                <div className="relative z-10 flex flex-col items-center justify-start pt-1.5 shrink-0">
                  <button
                    onClick={() => toggleStep(step.id)}
                    className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      isCompleted 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                        : 'bg-white border-slate-300 text-slate-300 hover:border-indigo-400 hover:text-indigo-400'
                    }`}
                  >
                    {isCompleted ? <Check className="w-6 h-6 md:w-7 md:h-7" strokeWidth={3} /> : <span className="font-bold text-base md:text-lg">{index + 1}</span>}
                  </button>
                </div>

                <div className={`flex-1 bg-white border rounded-2xl p-5 md:p-6 shadow-sm transition-all duration-300 ${
                  isCompleted ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                    <h3 className={`font-bold text-lg ${isCompleted ? 'text-indigo-900' : 'text-slate-900'}`}>
                      {index + 1}. {step.title}
                    </h3>
                    {step.estimatedTime && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg self-start whitespace-nowrap">
                        소요 시간: {step.estimatedTime}
                      </span>
                    )}
                  </div>
                  
                  <p className={`text-sm leading-relaxed mb-5 ${isCompleted ? 'text-slate-600' : 'text-slate-500'}`}>
                    {step.description}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => toggleStep(step.id)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                        isCompleted
                          ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" /> 완료 취소
                        </>
                      ) : (
                        <>
                          <Circle className="w-4 h-4" /> 완료 표시하기
                        </>
                      )}
                    </button>
                    
                    {step.linkText && step.linkView && (
                      <button
                        onClick={() => onChangeView(step.linkView!)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors group/btn"
                      >
                        <Play className="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-indigo-500 transition-colors" />
                        {step.linkText}
                        <ArrowRight className="w-3 h-3 opacity-50 group-hover/btn:opacity-100 group-hover/btn:translate-x-0.5 transition-all" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Footer info */}
        <div className="text-center mt-12 pb-8">
          <p className="text-xs text-slate-400 font-medium">진행 상황은 내 계정에 안전하게 저장됩니다.</p>
        </div>
      </div>
    </div>
  );
}
