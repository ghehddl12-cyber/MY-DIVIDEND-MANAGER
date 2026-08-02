import { LayoutDashboard, Target, Calendar, Calculator, PieChart, Repeat, Scale, BookOpen, PiggyBank, LogOut } from 'lucide-react';
import { ViewState } from '../types';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabaseClient';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  userEmail?: string;
}

export function Sidebar({ currentView, onChangeView, userEmail }: SidebarProps) {
  const navItems = [
    { id: 'dashboard' as ViewState, label: '배당 대시보드', icon: LayoutDashboard },
    { id: 'guide' as ViewState, label: '시작 가이드', icon: BookOpen },
    { id: 'goal' as ViewState, label: '배당 목표', icon: Target },
    { id: 'calendar' as ViewState, label: '배당 캘린더', icon: Calendar },
    { id: 'calculator' as ViewState, label: '배당 계산기', icon: Calculator },
    { id: 'tax' as ViewState, label: '절세 혜택 비교', icon: PiggyBank },
    { id: 'drip' as ViewState, label: 'DRIP 시뮬레이터', icon: Repeat },
    { id: 'rebalance' as ViewState, label: '리밸런싱 가이드', icon: Scale },
    { id: 'report' as ViewState, label: '리포트', icon: PieChart },
  ];

  return (
    <aside className="w-64 bg-white text-slate-800 flex flex-col h-full shrink-0 border-r border-slate-200 shadow-2xs">
      <div className="p-5 border-b border-slate-100">
        <h1 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0 shadow-2xs">
            배
          </div>
          <span>나의 배당 매니저</span>
        </h1>
      </div>
      
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                isActive 
                  ? "bg-slate-900 text-white shadow-2xs" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-emerald-400" : "text-slate-500")} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100 bg-slate-50/60 space-y-2">
        <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          {userEmail && <p className="text-[11px] text-slate-500 font-semibold truncate mb-1">{userEmail}</p>}
          <p className="text-xs text-slate-800 font-bold mb-0.5">나의 배당 매니저</p>
          <p className="text-[10px] text-slate-400 font-medium">© 2026 Dividend Manager</p>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" /> 로그아웃
        </button>
      </div>
    </aside>
  );
}
