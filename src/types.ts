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

export type ViewState = 'dashboard' | 'goal' | 'calendar' | 'calculator' | 'report' | 'drip' | 'rebalance' | 'guide' | 'tax';

export interface Portfolio {
  id: string;
  name: string;
  isReal: boolean; // true = 실제 보유 포트폴리오, false = 가상 시뮬레이션 포트폴리오
  description?: string;
  assets: Asset[];
}

export interface DividendRecord {
  id: string;
  assetId?: string;
  ticker: string;
  assetName: string;
  receivedDate: string; // YYYY-MM-DD
  amount: number; // 세후 입금 금액
  tax?: number; // 세금
  memo?: string;
}

export interface PortfolioStats {
  totalValue: number;
  totalCost: number;
  annualDividend: number;
  dividendYield: number;
}
