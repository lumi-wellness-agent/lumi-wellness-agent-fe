/**
 * 로그인: Supabase Auth로 받은 액세스 토큰을 BE 요청의 Authorization: Bearer에 붙인다(BE README 「인증 · 세션 기록」).
 *
 * - 회원은 Google · 카카오로 로그인하고 기록 동의(/consent)를 거쳐 세션을 연다. 로그인 세션은 localStorage에 둔다.
 * - 로그인하지 않은 사용자는 기록을 남기지 않는 1회성 게스트 체험이다. 시작할 때 익명 로그인을 하고,
 *   그 세션은 sessionStorage에 둬서 탭을 닫으면 체험이 끝난다.
 * - 환경 변수(NEXT_PUBLIC_SUPABASE_*)가 비어 있으면 supabase()가 null이고, BE는 세션 API를 503으로 막는다.
 *   개발용 목업 세션(/dev)은 로그인 없이 돈다.
 */

import { createClient, type SupabaseClient, type SupportedStorage } from "@supabase/supabase-js";

export type Provider = "google" | "kakao";
export type Viewer = { id: string; anonymous: boolean; provider: string | null };

const GUEST_KEY = "lumi:guest";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** 로그인 설정이 있는지. 빌드할 때 정해진다(NEXT_PUBLIC_ 값은 번들에 들어간다). */
export const authConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

let client: SupabaseClient | null | undefined;

/** 브라우저 Supabase 클라이언트. 설정이 없거나 서버 렌더링 중이면 null. */
export function supabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  if (typeof window === "undefined") return null;
  client =
    SUPABASE_URL && SUPABASE_KEY
      ? createClient(SUPABASE_URL, SUPABASE_KEY, {
          auth: { storage: authStorage, flowType: "pkce", detectSessionInUrl: true, persistSession: true },
        })
      : null;
  return client;
}

/** 지금 로그인한 사용자. 없으면 null. */
export async function viewer(): Promise<Viewer | null> {
  const session = (await supabase()?.auth.getSession())?.data.session;
  if (!session) return null;
  const { user } = session;
  return { id: user.id, anonymous: user.is_anonymous ?? false, provider: user.app_metadata.provider ?? null };
}

/** BE 요청에 붙일 액세스 토큰. 만료가 가까우면 supabase-js가 갱신한다. */
export async function accessToken(): Promise<string | null> {
  return (await supabase()?.auth.getSession())?.data.session?.access_token ?? null;
}

/** 로그인하지 않았으면 게스트(익명 로그인)로 시작한다. 이미 로그인했으면 그대로 둔다. */
export async function ensureViewer(): Promise<Viewer> {
  const sb = supabase();
  if (!sb) throw new Error("로그인 설정(NEXT_PUBLIC_SUPABASE_URL · NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)이 없습니다.");
  const current = await viewer();
  if (current) return current;
  writeGuest(true);
  const { data, error } = await sb.auth.signInAnonymously();
  if (error || !data.user) {
    writeGuest(false);
    throw error ?? new Error("게스트로 시작하지 못했습니다.");
  }
  return { id: data.user.id, anonymous: true, provider: "anonymous" };
}

/** 소셜 로그인. 공급자 화면으로 갔다가 /auth/callback으로 돌아온다(Supabase Redirect URLs에 등록). */
export async function signIn(provider: Provider, next = "/"): Promise<void> {
  const sb = supabase();
  if (!sb) throw new Error("로그인 설정이 없습니다.");
  await sb.auth.signOut({ scope: "local" }); // 게스트 세션이 남아 있으면 지운다 — 게스트 체험은 이어지지 않는다
  writeGuest(false);
  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
  const { error } = await sb.auth.signInWithOAuth({ provider, options: { redirectTo } });
  if (error) throw error;
}

/** 이 브라우저의 로그인 세션을 지운다. 탈퇴(DELETE /me) 뒤에도 부른다. */
export async function signOut(): Promise<void> {
  await supabase()?.auth.signOut({ scope: "local" });
  writeGuest(false);
}

// 게스트 로그인 세션은 sessionStorage에, 회원은 localStorage에 쓴다. 읽을 때는 둘 다 본다.
const authStorage: SupportedStorage = {
  getItem: (key) => safe(() => sessionStorage.getItem(key) ?? localStorage.getItem(key), null),
  setItem: (key, value) =>
    safe(() => (readGuest() ? sessionStorage : localStorage).setItem(key, value), undefined),
  removeItem: (key) =>
    safe(() => {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    }, undefined),
};

function readGuest(): boolean {
  return safe(() => sessionStorage.getItem(GUEST_KEY) === "1", false);
}

function writeGuest(guest: boolean): void {
  safe(() => (guest ? sessionStorage.setItem(GUEST_KEY, "1") : sessionStorage.removeItem(GUEST_KEY)), undefined);
}

function safe<T>(run: () => T, fallback: T): T {
  try {
    return run();
  } catch {
    return fallback; // 저장소를 막은 브라우저 — 로그인이 이 탭에서만 유지된다
  }
}
