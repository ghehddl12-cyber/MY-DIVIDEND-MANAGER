import { useState, useMemo } from 'react';
import { Newspaper, ExternalLink, Sparkles, Filter, ChevronRight, X, Clock, Tag } from 'lucide-react';
import { Asset } from '../types';

interface NewsArticle {
  id: string;
  ticker?: string;
  tickerName?: string;
  title: string;
  source: string;
  timeAgo: string;
  category: '배당공시' | '실적발표' | '시장전망' | '기업뉴스';
  categoryColor: string;
  summary: string;
  fullContent: string;
  keyPoints: string[];
}

interface StockNewsFeedProps {
  assets: Asset[];
}

const MOCK_NEWS_ITEMS: NewsArticle[] = [
  {
    id: 'n1',
    ticker: '458730',
    tickerName: 'TIGER 미국배당다우존스',
    title: 'TIGER 미국배당다우존스, 8월 월배당 분배금 확정 발표',
    source: '한국경제',
    timeAgo: '20분 전',
    category: '배당공시',
    categoryColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    summary: '미국 배당다우존스 지수를 추종하는 대표 월배당 ETF의 8월 분배금이 공시되었습니다. 주당 분배금 수준이 안정성을 유지하며 지속적인 배당 현금흐름을 지원합니다.',
    fullContent: '미국 SCHD 지수(Dow Jones U.S. Dividend 100)를 동일하게 추종하는 TIGER 미국배당다우존스 ETF의 월 분배금이 확정되었습니다. 배당락일 기준 보유 주주들에게 지속적이고 안정적인 월 소득 흐름을 제공합니다. 최근 고금리 환경 속에서도 포함 종목들의 강한 배당 성장률이 방어력을 발휘하고 있다는 평가입니다.',
    keyPoints: [
      '월배당 분배금 입금 예정일: 8월 초 순차 지급',
      '배당 성장성 및 기초 지수 종목 우수성 재확인',
      '장기 적립식 투자자에 유리한 현금 재투자 환경 조성'
    ]
  },
  {
    id: 'n2',
    ticker: '448290',
    tickerName: 'SOL 미국배당다우존스',
    title: 'SOL 미국배당다우존스, 순자산 1조원 돌파… 개인 투자자 매수세 지속',
    source: '연합인포맥스',
    timeAgo: '1시간 전',
    category: '시장전망',
    categoryColor: 'bg-blue-50 text-blue-700 border-blue-200',
    summary: '국내 월배당 ETF 시장의 선두 주자인 SOL 미국배당다우존스의 순자산이 빠르게 증가하고 있습니다. 연금저축 및 IRP 계좌를 통한 지속적인 자금 유입이 주요 원인입니다.',
    fullContent: '개인 투자자들의 배당형 ETF에 대한 선호도가 높아짐에 따라 SOL 미국배당다우존스 순자산액이 1조 원 고지를 넘어섰습니다. 연금저축 계좌 및 퇴직연금(IRP) 내 비과세/과세이연 혜택과 월배당의 직관적인 수익성이 부합하면서 장기 자금 유입이 가속화되고 있습니다.',
    keyPoints: [
      '개인 연금계좌 내 필수 담보 자산으로 자리매김',
      '운용보수 경쟁력과 매월 안정적 분배금 지급 리듬 유지',
      '하반기 금리 인하 기대감에 따른 배당주 매력 증대'
    ]
  },
  {
    id: 'n3',
    ticker: '441680',
    tickerName: 'ACE 미국배당다우존스',
    title: 'SCHD 지수 리밸런싱 효과 본격화… 금융·필수소비재 비중 확대',
    source: '매일경제',
    timeAgo: '3시간 전',
    category: '기업뉴스',
    categoryColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    summary: '미국 배당다우존스 지수의 연례 종목 교체 결과, 펀더멘털이 견고하고 배당 지속 가능성이 높은 기업들의 비중이 조정되었습니다.',
    fullContent: 'SCHD 지수 리밸런싱에 따라 부채 비율이 낮고 지난 10년간 꾸준히 배당을 늘려온 우량 기업들의 비중이 재조정되었습니다. 금융, 필수소비재, 헬스케어 부문의 우량 배당주 비중이 강화되면서 변동성 장세에서의 하방 안정성이 더 강화될 것으로 기대됩니다.',
    keyPoints: [
      '10년 이상 연속 배당 지급 기업 조건 충격 완화',
      '재무 건전성 점수 강화로 유망 배당성장주 편입',
      '포트폴리오 변동성 축소 효과 관측'
    ]
  },
  {
    id: 'n4',
    title: '미국 연준 금리 향방 전망… 고배당주·리츠 자산군으로 자금 이동',
    source: 'Bloomberg',
    timeAgo: '5시간 전',
    category: '시장전망',
    categoryColor: 'bg-purple-50 text-purple-700 border-purple-200',
    summary: '글로벌 통화정책 기조 변화 기대감 속에 고배당주 및 리츠(REITs) 상품으로의 자금 재배치 움직임이 포착되고 있습니다.',
    fullContent: '인플레이션 지표 안정세와 함께 시장 금리 하락 가능성이 대두되면서 예금 및 채권에 머물던 시중 자금이 안정적인 배당 수익률을 제공하는 주식 및 부동산 자산군으로 이동하기 시작했습니다. 특히 4% 이상의 시가 배당률을 유지하는 월배당 상품들의 매력이 재조명받고 있습니다.',
    keyPoints: [
      '금리 하락기 배당 수익률의 상대적 가치 증대',
      '배당성장주 및 월배당 ETF로의 글로벌 자금 유입',
      '장기 포트폴리오 채권 대체 역할 강화'
    ]
  },
  {
    id: 'n5',
    title: '리얼티인컴(O) 및 주요 리츠주, 임대 수익성 개선에 주가 탄력',
    source: '배당인사이트',
    timeAgo: '7시간 전',
    category: '실적발표',
    categoryColor: 'bg-amber-50 text-amber-700 border-amber-200',
    summary: '대표적 대표 월배당 리츠 기업들의 분기 임대 계약 이행률이 99% 이상을 기록하며 견조한 실적을 입증했습니다.',
    fullContent: '글로벌 상업용 리츠 대표주인 리얼티인컴(Realty Income)이 높은 점유율과 장기 임대 계약에 힘입어 AFFO(조정운영자금) 호조세를 나타냈습니다. 이에 따라 월 배당금 인상 기조를 꾸준히 이어갈 수 있는 재정적 여력을 증명했습니다.',
    keyPoints: [
      '점유율 98.8% 유지하며 안정적 임대료 회수율 증명',
      '25년 이상 연속 배당 증액(배당귀족주) 지위 견고',
      '금리 안정화 시 주가 상방 모멘텀 기대'
    ]
  }
];

export function StockNewsFeed({ assets }: StockNewsFeedProps) {
  const [selectedTicker, setSelectedTicker] = useState<string>('ALL');
  const [activeArticle, setActiveArticle] = useState<NewsArticle | null>(null);

  // Available tickers for filter
  const tickerOptions = useMemo(() => {
    const list = assets.map(a => ({ ticker: a.ticker, name: a.name }));
    return list;
  }, [assets]);

  const filteredNews = useMemo(() => {
    if (selectedTicker === 'ALL') return MOCK_NEWS_ITEMS;
    return MOCK_NEWS_ITEMS.filter(n => n.ticker === selectedTicker || !n.ticker);
  }, [selectedTicker]);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between h-full space-y-4">
      {/* Top Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shrink-0">
              <Newspaper className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 text-base truncate">포트폴리오 주요 뉴스</h3>
              <p className="text-xs text-slate-500 truncate">배당 공시, 실적 이슈 및 시장 동향</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200/60 shrink-0">
            총 {filteredNews.length}건
          </span>
        </div>

        {/* Ticker Filter Buttons Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-2 border-t border-slate-100">
          <button
            onClick={() => setSelectedTicker('ALL')}
            className={`px-2.5 py-1 text-xs rounded-lg font-semibold border transition-all whitespace-nowrap shrink-0 ${
              selectedTicker === 'ALL'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            전체 뉴스
          </button>
          {tickerOptions.map(item => (
            <button
              key={item.ticker}
              onClick={() => setSelectedTicker(item.ticker)}
              className={`px-2.5 py-1 text-xs rounded-lg font-semibold border transition-all whitespace-nowrap shrink-0 ${
                selectedTicker === item.ticker
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
              }`}
            >
              {item.name || item.ticker}
            </button>
          ))}
        </div>
      </div>

      {/* News List */}
      <div className="space-y-3 flex-1 overflow-y-auto max-h-[220px] pr-1 divide-y divide-slate-100">
        {filteredNews.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            해당 종목에 관련된 뉴스가 없습니다.
          </div>
        ) : (
          filteredNews.map((article, idx) => (
            <div
              key={article.id}
              onClick={() => setActiveArticle(article)}
              className={`pt-3 first:pt-0 group cursor-pointer hover:bg-slate-50/80 p-2 rounded-xl transition-all border border-transparent hover:border-slate-200/60`}
            >
              <div className="flex items-center justify-between gap-2 mb-1 text-[11px]">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${article.categoryColor}`}>
                    {article.category}
                  </span>
                  {article.tickerName && (
                    <span className="font-bold text-slate-700 truncate max-w-[160px]">
                      {article.tickerName} <span className="text-slate-400 font-mono text-[10px]">({article.ticker})</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 text-slate-400 font-medium">
                  <span>{article.source}</span>
                  <span>•</span>
                  <span>{article.timeAgo}</span>
                </div>
              </div>

              <h4 className="font-bold text-xs sm:text-sm text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1 leading-snug">
                {article.title}
              </h4>

              <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-normal">
                {article.summary}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Article Detail Modal */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${activeArticle.categoryColor}`}>
                    {activeArticle.category}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">{activeArticle.source} • {activeArticle.timeAgo}</span>
                </div>
                <h3 className="font-bold text-base text-slate-900 leading-snug">
                  {activeArticle.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveArticle(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed">
              <p className="text-sm font-medium text-slate-800 bg-blue-50/60 p-3.5 rounded-xl border border-blue-100 text-blue-950">
                {activeArticle.summary}
              </p>

              <div>
                <h4 className="font-bold text-slate-900 mb-2 text-xs uppercase tracking-wider text-slate-500">기사 핵심 요약</h4>
                <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  {activeArticle.keyPoints.map((point, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                      <span className="font-medium text-slate-800">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">상세 내용</h4>
                <p className="text-slate-600 text-xs leading-relaxed">{activeArticle.fullContent}</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setActiveArticle(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
