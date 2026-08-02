import { useState, useEffect, useMemo } from 'react';
import { Asset, Portfolio, PortfolioStats } from '../types';

const PORTFOLIOS_STORAGE_KEY = 'divitrack_portfolios_v3';
const ACTIVE_KEY = 'divitrack_active_portfolio_id_v3';
const OLD_STORAGE_KEY = 'divitrack_portfolio_v2';

const DEFAULT_REAL_ASSETS: Asset[] = [
  {
    id: '1',
    ticker: '458730',
    name: 'TIGER 미국배당다우존스',
    type: 'ETF',
    sector: '배당 / 지수 ETF',
    price: 10850,
    dividendYield: 3.8,
    dividendFrequency: 'Monthly',
    exDividendDate: '2026-07-29',
    paymentDate: '2026-08-04',
    shares: 500,
    averageCost: 10200,
    lastPurchasePrice: 10450,
  },
  {
    id: '2',
    ticker: '448290',
    name: 'SOL 미국배당다우존스',
    type: 'ETF',
    sector: '배당 / 지수 ETF',
    price: 10600,
    dividendYield: 3.75,
    dividendFrequency: 'Monthly',
    exDividendDate: '2026-07-29',
    paymentDate: '2026-08-03',
    shares: 300,
    averageCost: 10100,
    lastPurchasePrice: 10300,
  },
  {
    id: '3',
    ticker: '441680',
    name: 'ACE 미국배당다우존스',
    type: 'ETF',
    sector: '배당 / 지수 ETF',
    price: 11200,
    dividendYield: 3.85,
    dividendFrequency: 'Monthly',
    exDividendDate: '2026-07-29',
    paymentDate: '2026-08-05',
    shares: 400,
    averageCost: 10800,
    lastPurchasePrice: 10950,
  }
];

const DEFAULT_SIMULATION_ASSETS: Asset[] = [
  {
    id: 'sim-1',
    ticker: 'AAPL',
    name: '애플 (Apple)',
    type: 'Stock',
    sector: '기술 (IT)',
    price: 220000,
    dividendYield: 0.6,
    dividendFrequency: 'Quarterly',
    shares: 50,
    averageCost: 195000,
  },
  {
    id: 'sim-2',
    ticker: 'JEPI',
    name: 'JPMorgan Equity Premium Income',
    type: 'ETF',
    sector: '배당 / 지수 ETF',
    price: 76000,
    dividendYield: 7.2,
    dividendFrequency: 'Monthly',
    shares: 200,
    averageCost: 73000,
  },
  {
    id: 'sim-3',
    ticker: 'O',
    name: '리얼티인컴 (Realty Income)',
    type: 'Stock',
    sector: '리츠 / 부동산',
    price: 72000,
    dividendYield: 5.5,
    dividendFrequency: 'Monthly',
    shares: 150,
    averageCost: 68000,
  },
  {
    id: 'sim-4',
    ticker: '458730',
    name: 'TIGER 미국배당다우존스',
    type: 'ETF',
    sector: '배당 / 지수 ETF',
    price: 10850,
    dividendYield: 3.8,
    dividendFrequency: 'Monthly',
    shares: 1000,
    averageCost: 10500,
  }
];

const INITIAL_PORTFOLIOS: Portfolio[] = [
  {
    id: 'real-main',
    name: '실제 보유 포트폴리오',
    isReal: true,
    description: '현재 증권계좌에서 실제로 보유 중인 핵심 자산',
    assets: DEFAULT_REAL_ASSETS,
  },
  {
    id: 'sim-retirement',
    name: '🌴 은퇴 대비 월 100만원 시뮬레이션',
    isReal: false,
    description: '목표 배당금을 달성하기 위한 고배당 및 월배당 ETF 조합 실험',
    assets: DEFAULT_SIMULATION_ASSETS,
  }
];

export function usePortfolio() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [activePortfolioId, setActivePortfolioId] = useState<string>('real-main');
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize
  useEffect(() => {
    const storedPortfolios = localStorage.getItem(PORTFOLIOS_STORAGE_KEY);
    const storedActiveId = localStorage.getItem(ACTIVE_KEY);

    if (storedPortfolios) {
      try {
        const parsed = JSON.parse(storedPortfolios);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPortfolios(parsed);
          if (storedActiveId && parsed.some((p: Portfolio) => p.id === storedActiveId)) {
            setActivePortfolioId(storedActiveId);
          } else {
            setActivePortfolioId(parsed[0].id);
          }
          setIsLoaded(true);
          return;
        }
      } catch (e) {
        console.error('Failed to parse portfolios storage', e);
      }
    }

    // Migration from old STORAGE_KEY
    const oldStored = localStorage.getItem(OLD_STORAGE_KEY);
    if (oldStored) {
      try {
        const oldAssets = JSON.parse(oldStored);
        if (Array.isArray(oldAssets)) {
          const migratedPortfolios: Portfolio[] = [
            {
              id: 'real-main',
              name: '실제 보유 포트폴리오',
              isReal: true,
              description: '현재 실제 보유 중인 계좌 자산',
              assets: oldAssets,
            },
            INITIAL_PORTFOLIOS[1]
          ];
          setPortfolios(migratedPortfolios);
          setActivePortfolioId('real-main');
          setIsLoaded(true);
          return;
        }
      } catch (e) {
        console.error('Migration failed', e);
      }
    }

    // Default Fallback
    setPortfolios(INITIAL_PORTFOLIOS);
    setActivePortfolioId(INITIAL_PORTFOLIOS[0].id);
    setIsLoaded(true);
  }, []);

  // Sync to LocalStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(PORTFOLIOS_STORAGE_KEY, JSON.stringify(portfolios));
      localStorage.setItem(ACTIVE_KEY, activePortfolioId);
    }
  }, [portfolios, activePortfolioId, isLoaded]);

  // Active Portfolio object
  const activePortfolio = useMemo(() => {
    return portfolios.find((p) => p.id === activePortfolioId) || portfolios[0] || {
      id: 'default',
      name: '기본 포트폴리오',
      isReal: true,
      assets: [],
    };
  }, [portfolios, activePortfolioId]);

  const assets = activePortfolio.assets || [];

  // Asset CRUD inside active portfolio
  const addAsset = (asset: Omit<Asset, 'id'>) => {
    const newAsset: Asset = { ...asset, id: crypto.randomUUID() };
    setPortfolios((prev) =>
      prev.map((p) =>
        p.id === activePortfolioId
          ? { ...p, assets: [...p.assets, newAsset] }
          : p
      )
    );
  };

  const updateAsset = (id: string, updated: Partial<Asset>) => {
    setPortfolios((prev) =>
      prev.map((p) =>
        p.id === activePortfolioId
          ? {
              ...p,
              assets: p.assets.map((a) => (a.id === id ? { ...a, ...updated } : a)),
            }
          : p
      )
    );
  };

  const deleteAsset = (id: string) => {
    setPortfolios((prev) =>
      prev.map((p) =>
        p.id === activePortfolioId
          ? {
              ...p,
              assets: p.assets.filter((a) => a.id !== id),
            }
          : p
      )
    );
  };

  // Portfolio Management Methods
  const selectPortfolio = (id: string) => {
    if (portfolios.some((p) => p.id === id)) {
      setActivePortfolioId(id);
    }
  };

  const createPortfolio = (name: string, isReal: boolean, description?: string, initialAssets?: Asset[]) => {
    const newId = `p-${crypto.randomUUID()}`;
    const newPortfolio: Portfolio = {
      id: newId,
      name,
      isReal,
      description: description || (isReal ? '실제 자산 포트폴리오' : '가상 시뮬레이션 포트폴리오'),
      assets: initialAssets ? JSON.parse(JSON.stringify(initialAssets)) : [],
    };
    setPortfolios((prev) => [...prev, newPortfolio]);
    setActivePortfolioId(newId);
  };

  const duplicatePortfolio = (sourceId: string, newName?: string) => {
    const source = portfolios.find((p) => p.id === sourceId);
    if (!source) return;
    const newId = `p-${crypto.randomUUID()}`;
    const duplicated: Portfolio = {
      id: newId,
      name: newName || `${source.name} (사본)`,
      isReal: false, // 복사본은 시뮬레이션으로 지정
      description: `'${source.name}' 포트폴리오에서 복사하여 생성한 가상 시뮬레이션`,
      assets: JSON.parse(JSON.stringify(source.assets)),
    };
    setPortfolios((prev) => [...prev, duplicated]);
    setActivePortfolioId(newId);
  };

  const updatePortfolioMeta = (id: string, meta: { name?: string; description?: string; isReal?: boolean }) => {
    setPortfolios((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...meta } : p))
    );
  };

  const deletePortfolio = (id: string) => {
    if (portfolios.length <= 1) {
      alert('최소 하나의 포트폴리오는 유지되어야 합니다.');
      return;
    }
    const filtered = portfolios.filter((p) => p.id !== id);
    setPortfolios(filtered);
    if (activePortfolioId === id) {
      setActivePortfolioId(filtered[0].id);
    }
  };

  const stats: PortfolioStats = useMemo(() => {
    let totalValue = 0;
    let totalCost = 0;
    let annualDividend = 0;

    assets.forEach((asset) => {
      const value = asset.price * asset.shares;
      const cost = asset.averageCost * asset.shares;
      const div = value * (asset.dividendYield / 100);

      totalValue += value;
      totalCost += cost;
      annualDividend += div;
    });

    const dividendYield = totalValue > 0 ? (annualDividend / totalValue) * 100 : 0;

    return { totalValue, totalCost, annualDividend, dividendYield };
  }, [assets]);

  return {
    portfolios,
    activePortfolio,
    activePortfolioId,
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
  };
}

