import type { ReactNode } from "react";
import type { Provider } from "@/lib/auth";

/*
 * 소셜 로그인 버튼. 마크만 둔 원형 아이콘 버튼이라 화면에 글자가 없고, aria-label이 버튼 이름이다(마크는 aria-hidden).
 * 색 · 마크 · 이름은 각 사의 로그인 버튼 가이드를 따르므로 하루의 빛 토큰 규칙의 예외다(AGENTS.md).
 * - Google(developers.google.com/identity/branding-guidelines): 버튼 테두리가 있으면 G만 둘 수 있다. 테마 색과 4색 G를
 *   그대로 쓰고, 밝은 세트는 라이트, 어두운 세트는 다크 테마다(globals.css의 --lumi-google*).
 * - 카카오(developers.kakao.com/docs/latest/ko/kakaologin/design-guide): 바탕 #FEE500 · 심볼 검정이고 다크 짝이 없다
 *   (@theme의 kakao 토큰). 가이드에 심볼만 쓰는 형태는 따로 없어 cure-agent-fe처럼 이름에 완성형 '카카오 로그인'을 쓴다.
 * 마크의 색 · 모양 · 비율은 바꾸지 않는다.
 */

/** 구글 4색 G. 공식 배포본(48×48) 그대로이고, Google이 그리는 로그인 버튼처럼 18px로 둔다. */
function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" className="size-4.5" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

/**
 * 카카오 말풍선 심볼. 카카오는 SVG를 배포하지 않아 공식 버튼 이미지와 픽셀로 맞춘 path를 쓴다(cure-agent-fe와 같다).
 * 공식 버튼의 심볼 높이는 버튼 높이의 0.38이다. viewBox가 23×21이라 20px 상자에서 심볼 높이가 18.3px이고, 지름 48px
 * 버튼의 0.38이 된다. 버튼 지름을 바꾸면 이 크기도 함께 맞춘다.
 */
function KakaoLogo() {
  return (
    <svg viewBox="0 0 23 21" className="size-5" aria-hidden>
      <path
        fill="#000000"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.0447 0C4.94804 0 0 3.84358 0 8.57074C0 11.5197 1.91074 14.0931 4.82655 15.6615L3.60058 20.1567C3.57745 20.2461 3.58221 20.3405 3.61423 20.4271C3.64624 20.5137 3.70398 20.5885 3.77969 20.6414C3.85541 20.6943 3.94549 20.7227 4.03784 20.723C4.1302 20.7232 4.22042 20.6952 4.2964 20.6427L9.66414 17.0752C10.117 17.0752 10.5809 17.1525 11.0447 17.1525C17.1414 17.1525 22.0895 13.309 22.0895 8.57074C22.0895 3.83254 17.1414 0 11.0447 0Z"
      />
    </svg>
  );
}

const BRANDS = {
  google: { label: "Google로 로그인", look: "border border-google-line bg-google", Logo: GoogleLogo },
  kakao: { label: "카카오 로그인", look: "bg-kakao", Logo: KakaoLogo },
} satisfies Record<Provider, { label: string; look: string; Logo: () => ReactNode }>;

/** 로그인 버튼. 지름 48px은 터치 영역 하한이자 카카오 심볼 비율이 맞는 크기라 줄이지 않는다. */
export function SocialLoginButton({ provider, onClick }: { provider: Provider; onClick: () => void }) {
  const { label, look, Logo } = BRANDS[provider];
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`flex size-12 items-center justify-center rounded-full ${look}`}
    >
      <Logo />
    </button>
  );
}
