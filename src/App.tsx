/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { Dashboard } from './components/Dashboard';
import { DividendGoalTracker } from './components/DividendGoalTracker';
import { CalendarView } from './components/CalendarView';
import { Calculator } from './components/Calculator';
import { ReportView } from './components/ReportView';
import { usePortfolio } from './hooks/usePortfolio';
import { ViewState } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const { assets, stats, addAsset, updateAsset, deleteAsset } = usePortfolio();

  return (
    <div className="flex h-screen bg-[#F1F5F9] text-slate-900 overflow-hidden font-sans flex-col md:flex-row">
      <div className="hidden md:flex">
        <Sidebar currentView={currentView} onChangeView={setCurrentView} />
      </div>

      <div className="md:hidden bg-[#0F172A] p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">배</div>
          <span className="text-lg font-bold text-white tracking-tight">나의 배당 매니저</span>
        </div>
      </div>
      
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0 relative flex flex-col">
        {currentView === 'dashboard' && (
          <Dashboard 
            assets={assets} 
            stats={stats} 
            onAdd={addAsset} 
            onUpdate={updateAsset} 
            onDelete={deleteAsset} 
          />
        )}
        {currentView === 'goal' && <DividendGoalTracker stats={stats} assets={assets} />}
        {currentView === 'calendar' && <CalendarView assets={assets} />}
        {currentView === 'calculator' && <Calculator assets={assets} />}
        {currentView === 'report' && (
          <ReportView 
            assets={assets} 
            stats={stats} 
          />
        )}
      </main>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <MobileNav currentView={currentView} onChangeView={setCurrentView} />
      </div>
    </div>
  );
}
