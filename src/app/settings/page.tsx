"use client";

/**
 * 설정 — 화면 색(하루의 빛)과 회원의 로그아웃 · 탈퇴. 게스트는 로그아웃 · 탈퇴가 없다.
 * 탈퇴(DELETE /me)는 되돌릴 수 없어 확인을 한 번 더 받고, 204를 받으면 이 브라우저의 로그인을 지운다.
 */

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { meApi } from "@/lib/api/client";
import { signOut, viewer, type Viewer } from "@/lib/auth";
import { LIGHT_KEYS, pickLight, type Light } from "@/lib/light";
import { useBrowserValue } from "@/lib/use-browser-value";
import { Button, ButtonLink, Card, Chip, Heading, Screen } from "@/ui/controls";

const LIGHT_CHOICES: { value: Light | null; label: string }[] = [
  { value: null, label: "시간대 따라" },
  { value: "mist", label: "물안개" },
  { value: "sunlit", label: "볕" },
  { value: "moonlight", label: "달빛" },
];

export default function SettingsPage() {
  const router = useRouter();
  const [who, setWho] = useState<Viewer | null>(null);
  const stored = useBrowserValue(readPick, null);
  const [picked, setPicked] = useState<Light | null | undefined>(undefined); // 이 화면에서 고른 값
  const light = picked === undefined ? stored : picked;
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void viewer().then(setWho);
  }, []);

  const member = who && !who.anonymous;
  const withdraw = async () => {
    try {
      await meApi.withdraw();
      await signOut();
      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "탈퇴하지 못했어요.");
    }
  };

  return (
    <Screen
      footer={
        <ButtonLink href="/" variant="secondary">
          처음으로
        </ButtonLink>
      }
    >
      <Heading>설정</Heading>
      <Card>
        <p className="mb-2 font-bold">화면 색</p>
        <div className="flex flex-wrap gap-2">
          {LIGHT_CHOICES.map((choice) => (
            <Chip
              key={choice.label}
              selected={light === choice.value}
              onClick={() => {
                pickLight(choice.value);
                setPicked(choice.value);
              }}
            >
              {choice.label}
            </Chip>
          ))}
        </div>
      </Card>

      {member && (
        <Card className="mt-4">
          <p className="mb-3 font-bold">계정</p>
          <div className="flex flex-col gap-2">
            <Button variant="secondary" onClick={() => signOut().then(() => router.replace("/"))}>
              로그아웃
            </Button>
            {confirming ? (
              <>
                <p className="break-keep text-ink-muted">
                  탈퇴하면 계정과 세션 기록 · 원문 · 동의가 모두 지워지고 되돌릴 수 없어요.
                </p>
                <Button onClick={withdraw}>탈퇴하기</Button>
                <Button variant="quiet" onClick={() => setConfirming(false)}>
                  그만두기
                </Button>
              </>
            ) : (
              <Button variant="quiet" onClick={() => setConfirming(true)}>
                회원 탈퇴
              </Button>
            )}
            {error && <p className="text-caption">{error}</p>}
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
