import React, { useState, useEffect, useMemo } from 'react';
import { Asset, DividendRecord } from '../types';
import { formatCurrency } from '../lib/utils';
import { 
  Receipt, 
  Plus, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  DollarSign, 
  Trash2, 
  Edit3, 
  X, 
  Check, 
  Filter
} from 'lucide-react';

interface DividendLedgerProps {
  assets: Asset[];
}

const STORAGE_KEY = 'divitrack_dividend_records_v1';

const INITIAL_RECORDS: DividendRecord[] = [
  {
    id: 'rec-1',
    ticker: '458730',
    assetName: 'TIGER 미국배당다우존스',
    receivedDate: '2026-07-15',
    amount: 19500,
    tax: 3000,
    memo: '7월 정기 분배금 입금',
  },
  {
    id: 'rec-2',
    ticker: '448290',
    assetName: 'SOL 미국배당다우존스',
    receivedDate: '2026-07-02',
    amount: 18750,
    tax: 2800,
    memo: '7월 월배당 수령',
  },
  {
    id: 'rec-3',
    ticker: '441680',
    assetName: 'ACE 미국배당다우존스',
    receivedDate: '2026-06-16',
    amount: 19200,
    tax: 2900,
    memo: '6월 분배금 입금 완료',
  }
];

export function DividendLedger({ assets }: DividendLedgerProps) {
  const [records, setRecords] = useState<DividendRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DividendRecord | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('2026');

  // Form State
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [customTicker, setCustomTicker] = useState('');
  const [customName, setCustomName] = useState('');
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<number | ''>('');
  const [tax, setTax] = useState<number | ''>('');
  const [memo, setMemo] = useState('');

  // Load from local storage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setRecords(JSON.parse(stored));
      } catch (e) {
        setRecords(INITIAL_RECORDS);
      }
    } else {
      setRecords(INITIAL_RECORDS);
    }
    setIsLoaded(true);
  }, []);

  // Save to local storage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    }
  }, [records, isLoaded]);

  // Year options based on records
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    years.add('2026');
    records.forEach(r => {
      const year = r.receivedDate.split('-')[0];
      if (year) years.add(year);
    });
    return Array.from(years).sort().reverse();
  }, [records]);

  // Filtered records by year
  const filteredRecords = useMemo(() => {
    return records
      .filter(r => r.receivedDate.startsWith(selectedYear))
      .sort((a, b) => new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime());
  }, [records, selectedYear]);

  // Summary statistics
  const yearStats = useMemo(() => {
    const totalAmount = filteredRecords.reduce((sum, r) => sum + r.amount, 0);
    const totalTax = filteredRecords.reduce((sum, r) => sum + (r.tax || 0), 0);
    const count = filteredRecords.length;

    // Monthly breakdown for selected year
    const monthlyMap = new Array(12).fill(0);
    filteredRecords.forEach(r => {
      const monthIndex = parseInt(r.receivedDate.split('-')[1], 10) - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        monthlyMap[monthIndex] += r.amount;
      }
    });

    const activeMonthsCount = monthlyMap.filter(m => m > 0).length || 1;
    const monthlyAverage = totalAmount / activeMonthsCount;

    return { totalAmount, totalTax, count, monthlyMap, monthlyAverage };
  }, [filteredRecords]);

  const handleOpenAdd = () => {
    setEditingRecord(null);
    if (assets.length > 0) {
      setSelectedAssetId(assets[0].id);
      setCustomTicker(assets[0].ticker);
      setCustomName(assets[0].name);
    } else {
      setSelectedAssetId('');
      setCustomTicker('');
      setCustomName('');
    }
    setReceivedDate(new Date().toISOString().split('T')[0]);
    setAmount('');
    setTax('');
    setMemo('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: DividendRecord) => {
    setEditingRecord(rec);
    setSelectedAssetId(rec.assetId || '');
    setCustomTicker(rec.ticker);
    setCustomName(rec.assetName);
    setReceivedDate(rec.receivedDate);
    setAmount(rec.amount);
    setTax(rec.tax || '');
    setMemo(rec.memo || '');
    setIsModalOpen(true);
  };

  const handleAssetSelectChange = (assetId: string) => {
    setSelectedAssetId(assetId);
    if (assetId === 'custom') {
      setCustomTicker('');
      setCustomName('');
    } else {
      const found = assets.find(a => a.id === assetId);
      if (found) {
        setCustomTicker(found.ticker);
        setCustomName(found.name);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0 || !customName.trim()) return;

    if (editingRecord) {
      setRecords(prev => prev.map(r => r.id === editingRecord.id ? {
        ...r,
        assetId: selectedAssetId === 'custom' ? undefined : selectedAssetId,
        ticker: customTicker.trim() || 'CUSTOM',
        assetName: customName.trim(),
        receivedDate,
        amount: Number(amount),
        tax: tax ? Number(tax) : 0,
        memo: memo.trim(),
      } : r));
    } else {
      const newRec: DividendRecord = {
        id: `rec-${crypto.randomUUID()}`,
        assetId: selectedAssetId === 'custom' ? undefined : selectedAssetId,
        ticker: customTicker.trim() || 'CUSTOM',
        assetName: customName.trim(),
        receivedDate,
        amount: Number(amount),
        tax: tax ? Number(tax) : 0,
        memo: memo.trim(),
      };
      setRecords(prev => [newRec, ...prev]);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('해당 배당 수령 기록을 삭제하시겠습니까?')) {
      setRecords(prev => prev.filter(r => r.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">배당금 수령 가계부</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">계좌에 실제로 입금된 세후 배당금 내역을 수동 기록하여 관리하세요.</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Year Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent focus:outline-none text-slate-800 font-bold cursor-pointer"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}년 수령 내역</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-2 rounded-xl font-bold transition-all shadow-xs cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" /> 배당 수령 등록
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400">{selectedYear}년 총 실제 수령액</span>
            <div className="text-2xl font-extrabold text-slate-800 font-mono mt-0.5">
              {formatCurrency(yearStats.totalAmount)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              총 {yearStats.count}건 입금 기록됨
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400">월 평균 실제 입금액</span>
            <div className="text-2xl font-extrabold text-blue-600 font-mono mt-0.5">
              {formatCurrency(yearStats.monthlyAverage)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {selectedYear}년 수령 월 기준 평균
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400">납부 원천징수 세금 (추정)</span>
            <div className="text-2xl font-extrabold text-slate-700 font-mono mt-0.5">
              {formatCurrency(yearStats.totalTax)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              배당소득세 (15.4% 등)
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Distribution Visual Breakdown */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span>{selectedYear}년 월별 실제 수령액 현황</span>
        </h3>
        <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
          {yearStats.monthlyMap.map((val, idx) => {
            const maxMonthly = Math.max(...yearStats.monthlyMap, 1);
            const heightPercent = Math.max((val / maxMonthly) * 100, 6);
            return (
              <div key={idx} className="flex flex-col items-center gap-1.5">
                <div className="w-full bg-slate-100 rounded-lg h-24 flex items-end p-1 relative group">
                  <div 
                    className={`w-full rounded-md transition-all ${val > 0 ? 'bg-emerald-500 group-hover:bg-emerald-600' : 'bg-slate-200/50'}`}
                    style={{ height: `${heightPercent}%` }}
                  />
                  {val > 0 && (
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:flex bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-10 font-mono">
                      {formatCurrency(val)}
                    </div>
                  )}
                </div>
                <span className="text-[11px] font-semibold text-slate-500">{idx + 1}월</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ledger Records Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm">{selectedYear}년 배당금 입금 상세 내역</h3>
          <span className="text-xs font-mono text-slate-500">{filteredRecords.length}건 기록</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 text-xs">
              <tr>
                <th className="px-4 py-3">수령일</th>
                <th className="px-4 py-3">종목명 / 티커</th>
                <th className="px-4 py-3 text-right">실제 입금액 (세후)</th>
                <th className="px-4 py-3 text-right">원천징수 세금</th>
                <th className="px-4 py-3">메모 / 비고</th>
                <th className="px-4 py-3 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    {selectedYear}년에 등록된 배당 수령 내역이 없습니다. '배당 수령 등록' 버튼을 눌러 추가해보세요.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-slate-600">{rec.receivedDate}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-800">{rec.assetName}</div>
                      <div className="text-xs text-slate-400 font-mono">{rec.ticker}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600 font-mono text-base">
                      {formatCurrency(rec.amount)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-400 text-xs">
                      {rec.tax ? formatCurrency(rec.tax) : '-'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">
                      {rec.memo || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(rec)}
                          className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                          title="수정"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(rec.id)}
                          className="text-slate-400 hover:text-red-600 transition-colors p-1"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 shadow-2xl relative text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-lg text-slate-800 mb-4">
              {editingRecord ? '배당 수령 내역 수정' : '배당금 입금 내역 등록'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">보유 종목 선택</label>
                <select
                  value={selectedAssetId}
                  onChange={(e) => handleAssetSelectChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                >
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.ticker})
                    </option>
                  ))}
                  <option value="custom">직접 직접 입력...</option>
                </select>
              </div>

              {selectedAssetId === 'custom' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">티커</label>
                    <input
                      type="text"
                      value={customTicker}
                      onChange={(e) => setCustomTicker(e.target.value)}
                      placeholder="예: 458730"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">종목명</label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="예: TIGER 미국배당"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">수령 날짜</label>
                  <input
                    type="date"
                    value={receivedDate}
                    onChange={(e) => setReceivedDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">실제 입금액 (세후 원)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="예: 25000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">공제 세금 (선택)</label>
                <input
                  type="number"
                  value={tax}
                  onChange={(e) => setTax(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="예: 3850"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">메모</label>
                <input
                  type="text"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="예: 7월분 정기 배당 입금 완료"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
                >
                  저장하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
