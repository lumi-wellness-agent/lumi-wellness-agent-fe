"use client";

/**
 * 설정 — 화면 색(하루의 빛)과 회원의 로그아웃 · 탈퇴. 게스트는 로그아웃 · 탈퇴가 없다.
 * 탈퇴(DELETE /me)는 되돌릴 수 없어 확인을 한 번 더 받고, 204를 받으면 이 브라우저의 로그인을 지운다.
 */

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { errorText } from "@/i18n/errors";
import { LOCALE_NAMES, LOCALES } from "@/i18n/locale";
import { setLocale, useLocale, useMessages } from "@/i18n/use-locale";
import { meApi } from "@/lib/api/client";
import { forgetRecords } from "@/lib/api/records";
import { signOut, viewer, type Viewer } from "@/lib/auth";
import { LIGHT_KEYS, pickLight, type Light } from "@/lib/light";
import { useBrowserValue } from "@/lib/use-browser-value";
import { Button, Card, Chip, Heading, Screen } from "@/ui/controls";
import { APP } from "../messages";

const LIGHT_CHOICES: { value: Light | null; key: "follow" | Light }[] = [
  { value: null, key: "follow" },
  { value: "mist", key: "mist" },
  { value: "sunlit", key: "sunlit" },
  { value: "moonlight", key: "moonlight" },
];

export default function SettingsPage() {
  const router = useRouter();
  const [who, setWho] = useState<Viewer | null>(null);
  const stored = useBrowserValue(readPick, null);
  const [picked, setPicked] = useState<Light | null | undefined>(undefined); // 이 화면에서 고른 값
  const light = picked === undefined ? stored : picked;
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const locale = useLocale();
  const t = useMessages(APP).settings;

  useEffect(() => {
    void viewer().then(setWho);
  }, []);

  const member = who && !who.anonymous;
  // 로그아웃 · 탈퇴하면 이 탭에 받아 둔 활동 기록(src/lib/api/records.ts)도 버린다
  const leave = async () => {
    forgetRecords();
    await signOut();
    router.replace("/");
  };
  const withdraw = async () => {
    try {
      await meApi.withdraw();
      await leave();
    } catch (e) {
      setError(e);
    }
  };

  return (
    <Screen tabBar>
      <Heading>{t.title}</Heading>
      <Card>
        <p className="mb-2 font-bold">{t.language}</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t.language}>
          {LOCALES.map((option) => (
            <Chip key={option} selected={locale === option} lang={option} onClick={() => setLocale(option)}>
              {LOCALE_NAMES[option]}
            </Chip>
          ))}
        </div>
      </Card>

      <Card className="mt-4">
        <p className="mb-2 font-bold">{t.light}</p>
        <div className="flex flex-wrap gap-2">
          {LIGHT_CHOICES.map((choice) => (
            <Chip
              key={choice.key}
              selected={light === choice.value}
              onClick={() => {
                pickLight(choice.value);
                setPicked(choice.value);
              }}
            >
              {t.lights[choice.key]}
            </Chip>
          ))}
        </div>
      </Card>

      {member && (
        <Card className="mt-4">
          <p className="mb-3 font-bold">{t.account}</p>
          <div className="flex flex-col gap-2">
            <Button variant="secondary" onClick={leave}>
              {t.logout}
            </Button>
            {confirming ? (
              <>
                <p className="break-keep text-ink-muted">{t.withdrawWarning}</p>
                <Button onClick={withdraw}>{t.withdrawConfirm}</Button>
                <Button variant="quiet" onClick={() => setConfirming(false)}>
                  {t.cancel}
                </Button>
              </>
            ) : (
              <Button variant="quiet" onClick={() => setConfirming(true)}>
                {t.withdraw}
              </Button>
            )}
            {error !== null && <p className="text-caption">{errorText(error, locale, t.withdrawFailed)}</p>}
          </div>
        </Card>
      )}
    </Screen>
  );
}

function readPick(): Light | null {
  try {
    return localStorage.getItem(LIGHT_KEYS.pick) as Light | null;
  } catch {
    return null; // 저장소를 막은 브라우저 — 시간대를 따른다
  }
}
