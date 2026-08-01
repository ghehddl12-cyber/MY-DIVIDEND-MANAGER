export type AssetType = 'Stock' | 'ETF';

export type Sector = 
  | '기술 (IT)'
  | '금융'
  | '배당 / 지수 ETF'
  | '리츠 / 부동산'
  | '헬스케어'
  | '필수소비재'
  | '에너지 / 유틸리티'
  | '커뮤니케이션'
  | '기타';

export interface Asset {
  id: string;
  ticker: string;
  name: string;
  type: AssetType;
  sector?: Sector;
  price: number;
  dividendYield: number; // in percentage (e.g., 4.5)
  dividendFrequency: 'Monthly' | 'Quarterly' | 'Semi-Annually' | 'Annually';
  exDividendDate?: string; // YYYY-MM-DD
  paymentDate?: string; // YYYY-MM-DD
  shares: number;
  averageCost: number;
  lastPurchasePrice?: number;
}

export type ViewState = 'dashboard' | 'goal' | 'calendar' | 'calculator' | 'report';

export interface PortfolioStats {
  totalValue: number;
  totalCost: number;
  annualDividend: number;
  dividendYield: number;
}
