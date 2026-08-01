import React, { useState, useEffect } from 'react';
import { Asset, Sector } from '../types';
import { X } from 'lucide-react';

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (asset: Omit<Asset, 'id'>) => void;
  initialData?: Asset | null;
}

const SECTORS: Sector[] = [
  '배당 / 지수 ETF',
  '기술 (IT)',
  '금융',
  '리츠 / 부동산',
  '헬스케어',
  '필수소비재',
  '에너지 / 유틸리티',
  '커뮤니케이션',
  '기타'
];

export function AssetModal({ isOpen, onClose, onSave, initialData }: AssetModalProps) {
  const [formData, setFormData] = useState<Omit<Asset, 'id'>>(
    initialData || {
      ticker: '',
      name: '',
      type: 'Stock',
      sector: '배당 / 지수 ETF',
      price: 0,
      dividendYield: 0,
      dividendFrequency: 'Quarterly',
      exDividendDate: '',
      paymentDate: '',
      shares: 0,
      averageCost: 0,
    }
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let parsedValue: string | number = value;

    if (type === 'number') {
      parsedValue = parseFloat(value) || 0;
    }

    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={onClose} aria-label="Close modal background" />
      <div className="relative bg-white rounded-xl shadow-lg border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-full z-10">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-bold text-slate-800">
            {initialData ? '종목 수정' : '새 종목 추가'}
          </h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors" title="닫기 (Esc)">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 block">티커 심볼</label>
              <input required name="ticker" value={formData.ticker} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="e.g. AAPL" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 block">종목명</label>
              <input required name="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="e.g. Apple Inc." />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 block">섹터 / 업종</label>
              <select name="sector" value={formData.sector || '배당 / 지수 ETF'} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                {SECTORS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 block">종류</label>
              <select name="type" value={formData.type} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                <option value="Stock">주식 (Stock)</option>
                <option value="ETF">ETF</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 block">배당 주기</label>
              <select name="dividendFrequency" value={formData.dividendFrequency} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                <option value="Monthly">월배당</option>
                <option value="Quarterly">분기배당</option>
                <option value="Semi-Annually">반기배당</option>
                <option value="Annually">연배당</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 block">현재가 (원)</label>
              <input required type="number" step="1" name="price" value={formData.price} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 block">배당률 (%)</label>
              <input required type="number" step="0.01" name="dividendYield" value={formData.dividendYield} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 block">보유 수량</label>
              <input required type="number" step="0.01" name="shares" value={formData.shares} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 block">평균 단가 (원)</label>
              <input required type="number" step="1" name="averageCost" value={formData.averageCost} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 block">최근 매수가 (원)</label>
              <input type="number" step="1" name="lastPurchasePrice" value={formData.lastPurchasePrice || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono" placeholder="선택 사항" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 block">배당락일 (예정)</label>
              <input type="date" name="exDividendDate" value={formData.exDividendDate} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 block">배당지급일 (예정)</label>
              <input type="date" name="paymentDate" value={formData.paymentDate} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700" />
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
              취소
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors">
              {initialData ? '저장하기' : '추가하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
