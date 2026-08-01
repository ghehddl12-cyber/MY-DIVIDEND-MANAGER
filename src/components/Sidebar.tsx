import { LayoutDashboard, Target, Calendar, Calculator, PieChart } from 'lucide-react';
import { ViewState } from '../types';
import { cn } from '../lib/utils';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

export function Sidebar({ currentView, onChangeView }: SidebarProps) {
  const navItems = [
    { id: 'dashboard' as ViewState, label: '배당 대시보드', icon: LayoutDashboard },
    { id: 'goal' as ViewState, label: '배당 목표', icon: Target },
    { id: 'calendar' as ViewState, label: '배당 캘린더', icon: Calendar },
    { id: 'calculator' as ViewState, label: '배당 계산기', icon: Calculator },
    { id: 'report' as ViewState, label: '리포트', icon: PieChart },
  ];

  return (
    <aside className="w-64 bg-[#0F172A] text-slate-300 flex flex-col h-full shrink-0">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold shrink-0">
            배
          </div>
          <span>나의 배당 매니저</span>
        </h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2 rounded-md text-sm transition-colors",
                isActive 
                  ? "bg-slate-800 text-white" 
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="p-3 bg-blue-600/10 rounded-lg border border-blue-500/20">
          <p className="text-xs text-blue-400 font-semibold mb-1">나의 배당 매니저</p>
          <p className="text-[10px] text-slate-400">© 2026 Dividend Manager</p>
        </div>
      </div>
    </aside>
  );
}
