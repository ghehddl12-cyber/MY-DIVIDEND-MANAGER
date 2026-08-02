import { LayoutDashboard, Target, Calendar, Calculator, PieChart, Repeat, Scale, BookOpen, PiggyBank } from 'lucide-react';
import { ViewState } from '../types';
import { cn } from '../lib/utils';

interface MobileNavProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

export function MobileNav({ currentView, onChangeView }: MobileNavProps) {
  const navItems = [
    { id: 'dashboard' as ViewState, label: '대시보드', icon: LayoutDashboard },
    { id: 'guide' as ViewState, label: '가이드', icon: BookOpen },
    { id: 'goal' as ViewState, label: '목표', icon: Target },
    { id: 'tax' as ViewState, label: '절세비교', icon: PiggyBank },
    { id: 'calendar' as ViewState, label: '캘린더', icon: Calendar },
    { id: 'calculator' as ViewState, label: '계산기', icon: Calculator },
    { id: 'drip' as ViewState, label: 'DRIP', icon: Repeat },
    { id: 'rebalance' as ViewState, label: '리밸런싱', icon: Scale },
    { id: 'report' as ViewState, label: '리포트', icon: PieChart },
  ];

  return (
    <div className="bg-white border-t border-slate-200 flex items-center justify-around pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={cn(
              "flex flex-col items-center justify-center w-full py-3 gap-1 text-[10px] font-bold transition-colors",
              isActive 
                ? "text-blue-600" 
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
