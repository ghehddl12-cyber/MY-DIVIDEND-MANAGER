import { createClient } from '@supabase/supabase-js';

// Supabase anon/publishable key는 클라이언트에 노출되도록 설계된 값이며
// 실제 데이터 보호는 DB의 RLS(Row Level Security) 정책이 담당합니다.
// 배포 환경변수(VITE_SUPABASE_URL 등)가 설정되어 있으면 그 값을 우선 사용하고,
// 없으면 기본값으로 폴백합니다.
const FALLBACK_SUPABASE_URL = 'https://mqtkbayesgvpfetfqfdl.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'sb_publishable_b86pGSwiNE7mn7CafRsXng_5vhzaW5C';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || FALLBACK_SUPABASE_URL;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || FALLBACK_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
