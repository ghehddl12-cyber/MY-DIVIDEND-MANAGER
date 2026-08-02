import React, { useState } from 'react';
import { Portfolio } from '../types';
import { 
  FolderCheck, 
  FlaskConical, 
  ChevronDown, 
  Plus, 
  Copy, 
  Trash2, 
  Edit3, 
  BarChart2, 
  X, 
  Check,
  Sparkles,
  Layers
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';

interface PortfolioSelectorProps {
  portfolios: Portfolio[];
  activePortfolio: Portfolio;
  onSelectPortfolio: (id: string) => void;
  onCreatePortfolio: (name: string, isReal: boolean, description?: string) => void;
  onDuplicatePortfolio: (id: string, newName?: string) => void;
  onUpdatePortfolio: (id: string, meta: { name?: string; description?: string; isReal?: boolean }) => void;
  onDeletePortfolio: (id: string) => void;
}

export function PortfolioSelector({
  portfolios,
  activePortfolio,
  onSelectPortfolio,
  onCreatePortfolio,
  onDuplicatePortfolio,
  onUpdatePortfolio,
  onDeletePortfolio,
}: PortfolioSelectorProps) {
  const [isOpenDropdown, setIsOpenDropdown] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Form states
  const [nameInput, setNameInput] = useState('');
  const [isRealInput, setIsRealInput] = useState(false);
  const [descInput, setDescInput] = useState('');

  const handleOpenCreate = (defaultIsReal = false) => {
    setNameInput(defaultIsReal ? '새 실제 보유 계좌' : '가상 배당 시뮬레이션');
    setIsRealInput(defaultIsReal);
    setDescInput('');
    setIsCreateModalOpen(true);
    setIsOpenDropdown(false);
  };

  const handleOpenEdit = (p: Portfolio) => {
    setNameInput(p.name);
    setIsRealInput(p.isReal);
    setDescInput(p.description || '');
    setIsEditModalOpen(true);
    setIsOpenDropdown(false);
  };

  const handleSaveCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    onCreatePortfolio(nameInput.trim(), isRealInput, descInput.trim());
    setIsCreateModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    onUpdatePortfolio(activePortfolio.id, {
      name: nameInput.trim(),
      isReal: isRealInput,
      description: descInput.trim(),
    });
    setIsEditModalOpen(false);
  };

  // Helper to calculate summary for comparison
  const getPortfolioStats = (p: Portfolio) => {
    let totalValue = 0;
    let annualDividend = 0;
    p.assets.forEach((a) => {
      const val = a.price * a.shares;
      totalValue += val;
      annualDividend += val * (a.dividendYield / 100);
    });
    const yieldRate = totalValue > 0 ? (annualDividend / totalValue) * 100 : 0;
    return {
      totalValue,
      annualDividend,
      monthlyDividend: annualDividend / 12,
      yieldRate,
      itemCount: p.assets.length,
    };
  };

  return (
    <div className="w-full bg-white border-b border-slate-200 text-slate-800 px-4 py-3 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Portfolio Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsOpenDropdown(!isOpenDropdown)}
            className="flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100/90 text-slate-800 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all border border-slate-200 shadow-2xs cursor-pointer"
          >
            {activePortfolio.isReal ? (
              <span className="flex items-center gap-1.5 text-xs font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">
                <FolderCheck className="w-3.5 h-3.5" /> 실제 보유
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">
                <FlaskConical className="w-3.5 h-3.5" /> 가상 시뮬레이션
              </span>
            )}

            <span className="font-bold text-slate-900 tracking-tight max-w-[180px] sm:max-w-[260px] truncate">
              {activePortfolio.name}
            </span>

            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpenDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {isOpenDropdown && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsOpenDropdown(false)} 
              />
              <div className="absolute left-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center">
                  <span>내 포트폴리오 목록 ({portfolios.length})</span>
                  <button 
                    onClick={() => setIsCompareModalOpen(true)}
                    className="text-blue-600 hover:text-blue-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <BarChart2 className="w-3 h-3" /> 전체 비교
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {portfolios.map((p) => {
                    const stats = getPortfolioStats(p);
                    const isSelected = p.id === activePortfolio.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          onSelectPortfolio(p.id);
                          setIsOpenDropdown(false);
                        }}
                        className={`group p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between border ${
                          isSelected
                            ? 'bg-slate-100 border-slate-300 text-slate-900'
                            : 'hover:bg-slate-50 border-transparent text-slate-700'
                        }`}
                      >
                        <div className="space-y-1 min-w-0 flex-1 pr-2">
                          <div className="flex items-center gap-1.5">
                            {p.isReal ? (
                              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">실제</span>
                            ) : (
                              <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">시뮬레이션</span>
                            )}
                            <span className="text-xs font-bold truncate text-slate-800">{p.name}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            총 {formatCurrency(stats.totalValue)} · 월 {formatCurrency(stats.monthlyDividend)}
                          </div>
                        </div>

                        {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => handleOpenCreate(false)}
                    className="flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs py-2 rounded-xl font-bold transition-colors cursor-pointer"
                  >
                    <FlaskConical className="w-3.5 h-3.5" /> 가상 생성
                  </button>
                  <button
                    onClick={() => handleOpenCreate(true)}
                    className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs py-2 rounded-xl font-bold transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> 새 계좌
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right: Portfolio Quick Actions */}
        <div className="flex items-center gap-2">
          {/* Compare Button */}
          <button
            onClick={() => setIsCompareModalOpen(true)}
            className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border border-slate-200 cursor-pointer"
            title="여러 포트폴리오 비교하기"
          >
            <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">포트폴리오 비교</span>
          </button>

          {/* Duplicate Current Portfolio Button */}
          <button
            onClick={() => onDuplicatePortfolio(activePortfolio.id)}
            className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border border-slate-200 cursor-pointer"
            title="현재 포트폴리오 복사해서 가상으로 실험하기"
          >
            <Copy className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">복사하여 시뮬레이션</span>
          </button>

          {/* Edit Portfolio Meta */}
          <button
            onClick={() => handleOpenEdit(activePortfolio)}
            className="p-2 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 cursor-pointer"
            title="포트폴리오 설정 수정"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          {/* Delete Portfolio */}
          {portfolios.length > 1 && (
            <button
              onClick={() => {
                if (confirm(`'${activePortfolio.name}' 포트폴리오를 정말 삭제하시겠습니까?`)) {
                  onDeletePortfolio(activePortfolio.id);
                }
              }}
              className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-xl transition-colors border border-slate-200 cursor-pointer"
              title="포트폴리오 삭제"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* CREATE PORTFOLIO MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 shadow-2xl relative text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-800">새 포트폴리오 만들기</h3>
                <p className="text-xs text-slate-500">실제 계좌 또는 가상 시뮬레이션 포트폴리오를 작성하세요.</p>
              </div>
            </div>

            <form onSubmit={handleSaveCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">포트폴리오 구분</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRealInput(false)}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      !isRealInput
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <FlaskConical className="w-4 h-4" /> 가상 시뮬레이션
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRealInput(true)}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isRealInput
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <FolderCheck className="w-4 h-4" /> 실제 보유 포트폴리오
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">포트폴리오 이름</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="예: 은퇴 후 월배당 200만원 플랜"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">설명 (선택사항)</label>
                <textarea
                  value={descInput}
                  onChange={(e) => setDescInput(e.target.value)}
                  placeholder="이 포트폴리오의 목표나 전략을 간단히 적어보세요."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  만들기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PORTFOLIO MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 shadow-2xl relative text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-lg text-slate-800 mb-4">포트폴리오 정보 수정</h3>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">포트폴리오 구분</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRealInput(false)}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      !isRealInput
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <FlaskConical className="w-4 h-4" /> 가상 시뮬레이션
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRealInput(true)}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isRealInput
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <FolderCheck className="w-4 h-4" /> 실제 보유 포트폴리오
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">포트폴리오 이름</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-slate-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">설명</label>
                <textarea
                  value={descInput}
                  onChange={(e) => setDescInput(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PORTFOLIO COMPARISON MODAL - Modern Light Fintech UI */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-6xl rounded-2xl p-6 md:p-8 shadow-2xl relative text-slate-800 max-h-[90vh] overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsCompareModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200">
                <Layers className="w-6 h-6 text-slate-700" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-slate-900 tracking-tight">포트폴리오 한눈에 비교하기</h3>
                <p className="text-xs text-slate-500">보유 자산과 여러 가상 시뮬레이션의 총 자산, 배당 수익률 및 예상 월 배당금을 한 화면에서 비교하세요.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
              {portfolios.map((p) => {
                const stats = getPortfolioStats(p);
                const isActive = p.id === activePortfolio.id;
                return (
                  <div
                    key={p.id}
                    className={`bg-white border rounded-2xl p-5 flex flex-col justify-between relative transition-all ${
                      isActive ? 'border-slate-900 ring-2 ring-slate-900/10 shadow-sm bg-slate-50/50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        {p.isReal ? (
                          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">
                            실제 보유
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">
                            시뮬레이션
                          </span>
                        )}
                        {isActive && (
                          <span className="text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded-md">
                            현재 선택됨
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-base text-slate-900 tracking-tight mb-1">{p.name}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px] mb-4">{p.description || '설명 없음'}</p>

                      <div className="space-y-3 pt-3 border-t border-slate-100">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-medium">총 자산 평가액</span>
                          <span className="font-mono font-bold text-slate-900 text-sm">{formatCurrency(stats.totalValue)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-medium">평균 배당률</span>
                          <span className="font-mono font-bold text-emerald-600">{stats.yieldRate.toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-medium">예상 연간 배당금</span>
                          <span className="font-mono font-bold text-slate-900">{formatCurrency(stats.annualDividend)}</span>
                        </div>
                        <div className="bg-slate-100/80 p-3 rounded-xl flex justify-between items-center text-xs border border-slate-200/60">
                          <span className="text-slate-700 font-bold">예상 월 평균 배당금</span>
                          <span className="font-mono font-extrabold text-emerald-600 text-sm">{formatCurrency(stats.monthlyDividend)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-400">
                          <span>보유 종목 수</span>
                          <span className="font-mono text-slate-600 font-medium">{stats.itemCount}개 종목</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      {!isActive ? (
                        <button
                          onClick={() => {
                            onSelectPortfolio(p.id);
                            setIsCompareModalOpen(false);
                          }}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs py-2 rounded-xl font-bold transition-colors cursor-pointer"
                        >
                          이 포트폴리오로 전환
                        </button>
                      ) : (
                        <span className="w-full text-center text-xs text-slate-500 font-semibold py-2 bg-slate-100 rounded-xl">
                          현재 편집 중
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
