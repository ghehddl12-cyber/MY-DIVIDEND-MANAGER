import { useState, useEffect, useMemo, useCallback } from 'react';
import { Asset, Portfolio, PortfolioStats } from '../types';
import { supabase } from '../lib/supabaseClient';

const DEFAULT_REAL_ASSETS: Omit<Asset, 'id'>[] = [
  {
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
  },
];

const DEFAULT_SIMULATION_ASSETS: Omit<Asset, 'id'>[] = [
  {
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
    ticker: '458730',
    name: 'TIGER 미국배당다우존스',
    type: 'ETF',
    sector: '배당 / 지수 ETF',
    price: 10850,
    dividendYield: 3.8,
    dividendFrequency: 'Monthly',
    shares: 1000,
    averageCost: 10500,
  },
];

// ---- DB <-> App 타입 매핑 ----
type AssetRow = {
  id: string;
  portfolio_id: string;
  ticker: string;
  name: string;
  type: string;
  sector: string | null;
  price: number;
  dividend_yield: number;
  dividend_frequency: string;
  ex_dividend_date: string | null;
  payment_date: string | null;
  shares: number;
  average_cost: number;
  last_purchase_price: number | null;
};

type PortfolioRow = {
  id: string;
  name: string;
  is_real: boolean;
  description: string | null;
};

function assetFromRow(row: AssetRow): Asset {
  return {
    id: row.id,
    ticker: row.ticker,
    name: row.name,
    type: row.type as Asset['type'],
    sector: (row.sector ?? undefined) as Asset['sector'],
    price: Number(row.price),
    dividendYield: Number(row.dividend_yield),
    dividendFrequency: row.dividend_frequency as Asset['dividendFrequency'],
    exDividendDate: row.ex_dividend_date ?? undefined,
    paymentDate: row.payment_date ?? undefined,
    shares: Number(row.shares),
    averageCost: Number(row.average_cost),
    lastPurchasePrice: row.last_purchase_price != null ? Number(row.last_purchase_price) : undefined,
  };
}

function assetToRow(asset: Omit<Asset, 'id'>, portfolioId: string, userId: string) {
  return {
    portfolio_id: portfolioId,
    user_id: userId,
    ticker: asset.ticker,
    name: asset.name,
    type: asset.type,
    sector: asset.sector ?? null,
    price: asset.price,
    dividend_yield: asset.dividendYield,
    dividend_frequency: asset.dividendFrequency,
    ex_dividend_date: asset.exDividendDate ?? null,
    payment_date: asset.paymentDate ?? null,
    shares: asset.shares,
    average_cost: asset.averageCost,
    last_purchase_price: asset.lastPurchasePrice ?? null,
  };
}

function assetUpdatesToRow(updated: Partial<Asset>) {
  const row: Record<string, unknown> = {};
  if (updated.ticker !== undefined) row.ticker = updated.ticker;
  if (updated.name !== undefined) row.name = updated.name;
  if (updated.type !== undefined) row.type = updated.type;
  if (updated.sector !== undefined) row.sector = updated.sector ?? null;
  if (updated.price !== undefined) row.price = updated.price;
  if (updated.dividendYield !== undefined) row.dividend_yield = updated.dividendYield;
  if (updated.dividendFrequency !== undefined) row.dividend_frequency = updated.dividendFrequency;
  if (updated.exDividendDate !== undefined) row.ex_dividend_date = updated.exDividendDate ?? null;
  if (updated.paymentDate !== undefined) row.payment_date = updated.paymentDate ?? null;
  if (updated.shares !== undefined) row.shares = updated.shares;
  if (updated.averageCost !== undefined) row.average_cost = updated.averageCost;
  if (updated.lastPurchasePrice !== undefined) row.last_purchase_price = updated.lastPurchasePrice ?? null;
  row.updated_at = new Date().toISOString();
  return row;
}

export function usePortfolio(userId: string) {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [activePortfolioId, setActivePortfolioId] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  // 최초 로드: DB에서 포트폴리오 + 자산을 가져오고, 데이터가 없으면 기본값을 시딩
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: portfolioRows, error: pErr } = await supabase
        .from('portfolios')
        .select('id, name, is_real, description')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (pErr) {
        console.error('포트폴리오 조회 실패', pErr);
        setIsLoaded(true);
        return;
      }

      let rows: PortfolioRow[] = portfolioRows ?? [];

      if (rows.length === 0) {
        // 신규 사용자: 기본 포트폴리오 2개 + 자산 시딩
        const { data: seeded, error: seedErr } = await supabase
          .from('portfolios')
          .insert([
            { user_id: userId, name: '실제 보유 포트폴리오', is_real: true, description: '현재 증권계좌에서 실제로 보유 중인 핵심 자산' },
            { user_id: userId, name: '🌴 은퇴 대비 월 100만원 시뮬레이션', is_real: false, description: '목표 배당금을 달성하기 위한 고배당 및 월배당 ETF 조합 실험' },
          ])
          .select('id, name, is_real, description');

        if (seedErr || !seeded) {
          console.error('기본 포트폴리오 생성 실패', seedErr);
          setIsLoaded(true);
          return;
        }
        rows = seeded;

        const realPortfolioId = seeded[0].id;
        const simPortfolioId = seeded[1].id;

        const assetInserts = [
          ...DEFAULT_REAL_ASSETS.map((a) => assetToRow(a, realPortfolioId, userId)),
          ...DEFAULT_SIMULATION_ASSETS.map((a) => assetToRow(a, simPortfolioId, userId)),
        ];
        const { error: assetSeedErr } = await supabase.from('assets').insert(assetInserts);
        if (assetSeedErr) {
          console.error('기본 자산 생성 실패', assetSeedErr);
        }
      }

      const { data: assetRows, error: aErr } = await supabase
        .from('assets')
        .select('*')
        .eq('user_id', userId);

      if (aErr) {
        console.error('자산 조회 실패', aErr);
      }

      const assetsByPortfolio = new Map<string, Asset[]>();
      (assetRows ?? []).forEach((row) => {
        const list = assetsByPortfolio.get(row.portfolio_id) ?? [];
        list.push(assetFromRow(row as AssetRow));
        assetsByPortfolio.set(row.portfolio_id, list);
      });

      const assembled: Portfolio[] = rows.map((r) => ({
        id: r.id,
        name: r.name,
        isReal: r.is_real,
        description: r.description ?? undefined,
        assets: assetsByPortfolio.get(r.id) ?? [],
      }));

      // 마지막으로 선택했던 포트폴리오 복원
      const { data: settingRow } = await supabase
        .from('user_settings')
        .select('value')
        .eq('user_id', userId)
        .eq('key', 'active_portfolio_id')
        .maybeSingle();

      const savedActiveId = (settingRow?.value as string | undefined) ?? undefined;

      if (!cancelled) {
        setPortfolios(assembled);
        setActivePortfolioId(
          savedActiveId && assembled.some((p) => p.id === savedActiveId) ? savedActiveId : assembled[0]?.id ?? ''
        );
        setIsLoaded(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // 활성 포트폴리오 선택을 user_settings에 저장 (기기 간 동기화)
  useEffect(() => {
    if (isLoaded && activePortfolioId) {
      supabase
        .from('user_settings')
        .upsert({ user_id: userId, key: 'active_portfolio_id', value: activePortfolioId, updated_at: new Date().toISOString() })
        .then(({ error }) => {
          if (error) console.error('활성 포트폴리오 저장 실패', error);
        });
    }
  }, [activePortfolioId, isLoaded, userId]);

  const activePortfolio = useMemo(() => {
    return (
      portfolios.find((p) => p.id === activePortfolioId) ||
      portfolios[0] || { id: 'default', name: '기본 포트폴리오', isReal: true, assets: [] }
    );
  }, [portfolios, activePortfolioId]);

  const assets = activePortfolio.assets || [];

  const addAsset = useCallback(
    async (asset: Omit<Asset, 'id'>) => {
      const { data, error } = await supabase
        .from('assets')
        .insert(assetToRow(asset, activePortfolioId, userId))
        .select('*')
        .single();

      if (error || !data) {
        console.error('자산 추가 실패', error);
        return;
      }
      const newAsset = assetFromRow(data as AssetRow);
      setPortfolios((prev) =>
        prev.map((p) => (p.id === activePortfolioId ? { ...p, assets: [...p.assets, newAsset] } : p))
      );
    },
    [activePortfolioId, userId]
  );

  const updateAsset = useCallback(
    async (id: string, updated: Partial<Asset>) => {
      // 낙관적 업데이트
      setPortfolios((prev) =>
        prev.map((p) =>
          p.id === activePortfolioId
            ? { ...p, assets: p.assets.map((a) => (a.id === id ? { ...a, ...updated } : a)) }
            : p
        )
      );
      const { error } = await supabase.from('assets').update(assetUpdatesToRow(updated)).eq('id', id);
      if (error) console.error('자산 수정 실패', error);
    },
    [activePortfolioId]
  );

  const deleteAsset = useCallback(
    async (id: string) => {
      setPortfolios((prev) =>
        prev.map((p) => (p.id === activePortfolioId ? { ...p, assets: p.assets.filter((a) => a.id !== id) } : p))
      );
      const { error } = await supabase.from('assets').delete().eq('id', id);
      if (error) console.error('자산 삭제 실패', error);
    },
    [activePortfolioId]
  );

  const selectPortfolio = useCallback(
    (id: string) => {
      if (portfolios.some((p) => p.id === id)) {
        setActivePortfolioId(id);
      }
    },
    [portfolios]
  );

  const createPortfolio = useCallback(
    async (name: string, isReal: boolean, description?: string, initialAssets?: Asset[]) => {
      const { data, error } = await supabase
        .from('portfolios')
        .insert({
          user_id: userId,
          name,
          is_real: isReal,
          description: description || (isReal ? '실제 자산 포트폴리오' : '가상 시뮬레이션 포트폴리오'),
        })
        .select('id, name, is_real, description')
        .single();

      if (error || !data) {
        console.error('포트폴리오 생성 실패', error);
        return;
      }

      let copiedAssets: Asset[] = [];
      if (initialAssets && initialAssets.length > 0) {
        const inserts = initialAssets.map((a) => assetToRow(a, data.id, userId));
        const { data: insertedAssets, error: assetErr } = await supabase.from('assets').insert(inserts).select('*');
        if (assetErr) {
          console.error('자산 복사 실패', assetErr);
        } else {
          copiedAssets = (insertedAssets ?? []).map((row) => assetFromRow(row as AssetRow));
        }
      }

      const newPortfolio: Portfolio = {
        id: data.id,
        name: data.name,
        isReal: data.is_real,
        description: data.description ?? undefined,
        assets: copiedAssets,
      };
      setPortfolios((prev) => [...prev, newPortfolio]);
      setActivePortfolioId(newPortfolio.id);
    },
    [userId]
  );

  const duplicatePortfolio = useCallback(
    async (sourceId: string, newName?: string) => {
      const source = portfolios.find((p) => p.id === sourceId);
      if (!source) return;
      await createPortfolio(
        newName || `${source.name} (사본)`,
        false,
        `'${source.name}' 포트폴리오에서 복사하여 생성한 가상 시뮬레이션`,
        source.assets
      );
    },
    [portfolios, createPortfolio]
  );

  const updatePortfolioMeta = useCallback(
    async (id: string, meta: { name?: string; description?: string; isReal?: boolean }) => {
      setPortfolios((prev) => prev.map((p) => (p.id === id ? { ...p, ...meta } : p)));
      const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (meta.name !== undefined) row.name = meta.name;
      if (meta.description !== undefined) row.description = meta.description;
      if (meta.isReal !== undefined) row.is_real = meta.isReal;
      const { error } = await supabase.from('portfolios').update(row).eq('id', id);
      if (error) console.error('포트폴리오 수정 실패', error);
    },
    []
  );

  const deletePortfolio = useCallback(
    async (id: string) => {
      if (portfolios.length <= 1) {
        alert('최소 하나의 포트폴리오는 유지되어야 합니다.');
        return;
      }
      const filtered = portfolios.filter((p) => p.id !== id);
      setPortfolios(filtered);
      if (activePortfolioId === id) {
        setActivePortfolioId(filtered[0].id);
      }
      const { error } = await supabase.from('portfolios').delete().eq('id', id);
      if (error) console.error('포트폴리오 삭제 실패', error);
    },
    [portfolios, activePortfolioId]
  );

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
    isLoaded,
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
