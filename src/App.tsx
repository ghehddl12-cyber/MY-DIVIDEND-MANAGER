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
import { DripSimulator } from './components/DripSimulator';
import { RebalanceGuide } from './components/RebalanceGuide';
import { PortfolioSelector } from './components/PortfolioSelector';
import { DividendGuide } from './components/DividendGuide';
import { TaxCalculator } from './components/TaxCalculator';
import { usePortfolio } from './hooks/usePortfolio';
import { ViewState } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const {
    portfolios,
    activePortfolio,
    assets,
    stats,
    addAsset,
    updateAsset,
    deleteAsset,
    selectPortfolio,
    createPortfolio,
    duplicatePortfolio,
    updatePortfolioMeta,
    deletePortfolio,
  } = usePortfolio();

  return (
    <div className="flex h-screen bg-[#F1F5F9] text-slate-900 overflow-hidden font-sans flex-col md:flex-row">
      <div className="hidden md:flex">
        <Sidebar currentView={currentView} onChangeView={setCurrentView} />
      </div>

      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-sm">배</div>
          <span className="text-base font-extrabold text-slate-900 tracking-tight">나의 배당 매니저</span>
        </div>
      </div>
      
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0 relative flex flex-col">
        {/* Global Multi-Portfolio Selector Header Bar */}
        <PortfolioSelector
          portfolios={portfolios}
          activePortfolio={activePortfolio}
          onSelectPortfolio={selectPortfolio}
          onCreatePortfolio={createPortfolio}
          onDuplicatePortfolio={duplicatePortfolio}
          onUpdatePortfolio={updatePortfolioMeta}
          onDeletePortfolio={deletePortfolio}
        />

        {/* View Router */}
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
        {currentView === 'drip' && <DripSimulator assets={assets} stats={stats} />}
        {currentView === 'rebalance' && <RebalanceGuide assets={assets} stats={stats} />}
        {currentView === 'report' && (
          <ReportView 
            assets={assets} 
            stats={stats} 
          />
        )}
        {currentView === 'guide' && <DividendGuide onChangeView={setCurrentView} />}
        {currentView === 'tax' && <TaxCalculator />}
      </main>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <MobileNav currentView={currentView} onChangeView={setCurrentView} />
      </div>
    </div>
  );
}
