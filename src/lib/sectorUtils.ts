import { Asset, Sector } from '../types';

export const SECTOR_COLORS: Record<Sector, string> = {
  '배당 / 지수 ETF': '#3b82f6', // blue-500
  '기술 (IT)': '#8b5cf6',      // violet-500
  '금융': '#10b981',         // emerald-500
  '리츠 / 부동산': '#f59e0b',   // amber-500
  '헬스케어': '#ec4899',       // pink-500
  '필수소비재': '#06b6d4',     // cyan-500
  '에너지 / 유틸리티': '#ef4444', // red-500
  '커뮤니케이션': '#6366f1',  // indigo-500
  '기타': '#64748b',         // slate-500
};

export function getAssetSector(asset: Asset): Sector {
  if (asset.sector) return asset.sector;

  const text = `${asset.ticker} ${asset.name}`.toUpperCase();

  if (text.includes('TIGER') || text.includes('SOL') || text.includes('ACE') || text.includes('KODEX') || text.includes('SCHD') || text.includes('SPY') || text.includes('QQQ') || text.includes('JEPI') || text.includes('JEPQ') || text.includes('ETF')) {
    return '배당 / 지수 ETF';
  }
  if (text.includes('AAPL') || text.includes('MSFT') || text.includes('NVDA') || text.includes('GOOG') || text.includes('AMZN') || text.includes('삼성전자') || text.includes('하이닉스') || text.includes('APPLE')) {
    return '기술 (IT)';
  }
  if (text.includes('REALTY') || text.includes(' O ') || text.startsWith('O') || text.includes('REIT') || text.includes('리츠') || text.includes('VNQ') || text.includes('AGNC')) {
    return '리츠 / 부동산';
  }
  if (text.includes('JNJ') || text.includes('PFE') || text.includes('ABBV') || text.includes('LLY') || text.includes('UNH') || text.includes('바이오') || text.includes('제약')) {
    return '헬스케어';
  }
  if (text.includes('JPM') || text.includes('BAC') || text.includes('WFC') || text.includes('금융') || text.includes('은행') || text.includes('카드') || text.includes('증권')) {
    return '금융';
  }
  if (text.includes('KO') || text.includes('PG') || text.includes('PEP') || text.includes('COCA') || text.includes('MO') || text.includes('필수소비')) {
    return '필수소비재';
  }
  if (text.includes('XOM') || text.includes('CVX') || text.includes('NEE') || text.includes('에너지') || text.includes('전력')) {
    return '에너지 / 유틸리티';
  }
  if (text.includes(' VZ ') || text.includes('TMUS') || text.includes('텔레콤') || text.includes('KT')) {
    return '커뮤니케이션';
  }

  if (asset.type === 'ETF') return '배당 / 지수 ETF';

  return '기타';
}

export interface SectorBreakdownItem {
  name: Sector;
  value: number; // Total evaluation value
  percentage: number; // % of portfolio
  count: number; // Number of holdings
  color: string;
}

export function calculateSectorBreakdown(assets: Asset[], totalValue: number): SectorBreakdownItem[] {
  if (assets.length === 0 || totalValue === 0) return [];

  const map = new Map<Sector, { value: number; count: number }>();

  assets.forEach((asset) => {
    const sector = getAssetSector(asset);
    const value = asset.price * asset.shares;
    const current = map.get(sector) || { value: 0, count: 0 };
    map.set(sector, {
      value: current.value + value,
      count: current.count + 1,
    });
  });

  const items: SectorBreakdownItem[] = [];

  map.forEach((data, sector) => {
    const percentage = totalValue > 0 ? (data.value / totalValue) * 100 : 0;
    items.push({
      name: sector,
      value: data.value,
      percentage,
      count: data.count,
      color: SECTOR_COLORS[sector] || '#64748b',
    });
  });

  return items.sort((a, b) => b.value - a.value);
}
