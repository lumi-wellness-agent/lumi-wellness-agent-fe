/** 탭 · 흐름 화면 문구 — 시작(page · start-form) · 설정 · 기록 동의 · 로그인 콜백. 기록 탭은 records/messages.ts. */

import { defineMessages } from "@/i18n/locale";

export const APP = defineMessages({
  ko: {
    disclaimer: "LUMI는 의료적 진단이나 치료를 대신하지 않습니다.",
    home: {
      title: ["지친 순간의 휴식,", "루미와 함께."],
      intro: "지금 상황을 들려주면 회복 활동 하나를 추천하고, 추천 이유가 된 심리학 이론과 연구를 Reference 카드로 보여 드려요.",
    },
    start: {
      button: "시작하기",
      failed: "시작하지 못했어요.",
      mock: "목업 세션이 켜져 있어요(BE · 로그인 없이 견본으로 돕니다).",
      signedIn: (provider: string) => `${provider} 계정으로 로그인했어요`,
      providers: { google: "Google", kakao: "카카오" },
      guest: "로그인하지 않으면 체험 내용은 기록으로 남기지 않으며, 진행에 쓴 데이터는 1~2일 안에 지워집니다.",
      // 버튼에 글자가 없어 무엇을 하는 버튼인지 위에 적는다
      quickLogin: "간편 로그인",
    },
    settings: {
      title: "설정",
      language: "언어",
      light: "화면 색",
      lights: { follow: "시간대 따라", mist: "물안개", sunlit: "볕", moonlight: "달빛" },
      account: "계정",
      logout: "로그아웃",
      withdrawWarning: "탈퇴하면 계정과 세션 기록 · 원문 · 동의가 모두 지워지고 되돌릴 수 없어요.",
      withdrawConfirm: "탈퇴하기",
      cancel: "그만두기",
      withdraw: "회원 탈퇴",
      withdrawFailed: "탈퇴하지 못했어요.",
    },
    consent: {
      agree: "동의하고 시작하기",
      once: "처음 한 번만",
      title: "세션 기록에 동의해 주세요",
      records: "(필수) 세션 기록",
      recordsBody:
        "상황 분류, 질문에 고른 답, 측정값, 한 활동과 결과를 기록해요. 심리 상태 측정값이 들어 있어 민감정보로 보고 따로 동의를 받아요. 거두려면 탈퇴하면 돼요.",
      rawText: "(선택) 원문 보관",
      rawTextBody: (days: number) =>
        `처음 입력, 직접 쓴 답, 감정 단어, 멈춘 이유 같은 글을 ${days}일 동안 보관해요. 나중에 끄면 남긴 원문을 바로 지워요.`,
      openai: "입력한 글은 추천을 위해 OpenAI 모델로 보내져요. LUMI는 의료적 진단이나 치료를 대신하지 않습니다.",
      version: (version: string) => ` (동의 문구 ${version})`,
      readFailed: "동의 상태를 읽지 못했어요.",
      saveFailed: "동의를 저장하지 못했어요.",
    },
    callback: {
      signingIn: "로그인하고 있어요",
      failed: "로그인하지 못했어요",
      unfinished: "로그인을 마치지 못했어요.",
    },
  },
  en: {
    disclaimer: "LUMI does not replace medical diagnosis or treatment.",
    home: {
      // 360px 화면(30px)에서 두 줄에 들어가게 짧게 옮긴다
      title: ["Tired? Take a break", "with LUMI."],
      intro: "Tell LUMI how things are right now. It recommends one recovery activity and shows the psychology theory and research behind it on a Reference card.",
    },
    start: {
      button: "Start",
      failed: "Couldn't start. Please try again.",
      mock: "Mock sessions are on (they run on samples, without the BE or sign-in).",
      signedIn: (provider) => `Signed in with ${provider}`,
      providers: { google: "Google", kakao: "Kakao" },
      guest: "If you don't sign in, your trial isn't kept as a record, and the data used to run it is deleted within 1–2 days.",
      quickLogin: "Quick sign-in",
    },
    settings: {
      title: "Settings",
      language: "Language",
      light: "Screen color",
      lights: { follow: "Follow the time of day", mist: "Mist", sunlit: "Sunlight", moonlight: "Moonlight" },
      account: "Account",
      logout: "Sign out",
      withdrawWarning: "Deleting your account erases your account, session records, saved text and consent. This can't be undone.",
      withdrawConfirm: "Delete my account",
      cancel: "Cancel",
      withdraw: "Delete account",
      withdrawFailed: "Couldn't delete your account.",
    },
    consent: {
      agree: "Agree and start",
      once: "Just this once",
      title: "Please agree to session records",
      records: "(Required) Session records",
      recordsBody:
        "We record how your situation was classified, the answers you chose, your check-in scores, and the activities you did with their results. Because the scores describe your psychological state, we treat them as sensitive information and ask for this consent separately. To withdraw it, delete your account.",
      rawText: "(Optional) Keep what you wrote",
      rawTextBody: (days) =>
        `We keep what you write — your first message, typed answers, emotion words and reasons for stopping — for ${days} days. If you turn this off later, we delete it right away.`,
      openai: "What you type is sent to an OpenAI model to make recommendations. LUMI does not replace medical diagnosis or treatment.",
      version: (version) => ` (consent text ${version})`,
      readFailed: "Couldn't read your consent status.",
      saveFailed: "Couldn't save your consent.",
    },
    callback: {
      signingIn: "Signing you in",
      failed: "Couldn't sign you in",
      unfinished: "Couldn't finish signing in.",
    },
  },
});
