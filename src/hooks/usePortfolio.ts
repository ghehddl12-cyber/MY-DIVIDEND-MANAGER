import { useState, useEffect, useMemo } from 'react';
import { Asset, PortfolioStats } from '../types';

const STORAGE_KEY = 'divitrack_portfolio_v2';

const INITIAL_MOCK_DATA: Asset[] = [
  {
    id: '1',
    ticker: '458730',
    name: 'TIGER 미국배당다우존스',
    type: 'ETF',
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

export function usePortfolio() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setAssets(JSON.parse(stored));
      } catch (e) {
        setAssets(INITIAL_MOCK_DATA);
      }
    } else {
      setAssets(INITIAL_MOCK_DATA);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
    }
  }, [assets, isLoaded]);

  const addAsset = (asset: Omit<Asset, 'id'>) => {
    const newAsset: Asset = { ...asset, id: crypto.randomUUID() };
    setAssets((prev) => [...prev, newAsset]);
  };

  const updateAsset = (id: string, updated: Partial<Asset>) => {
    setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, ...updated } : a)));
  };

  const deleteAsset = (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
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

  return { assets, stats, addAsset, updateAsset, deleteAsset };
}
