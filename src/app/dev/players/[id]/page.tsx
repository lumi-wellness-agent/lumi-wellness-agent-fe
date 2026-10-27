import { notFound } from "next/navigation";
import { PROTOCOLS } from "@/fixtures";
import { PlayerPreview } from "./player-preview";

export const dynamicParams = false;

export function generateStaticParams() {
  return PROTOCOLS.map(({ id }) => ({ id }));
}

/** 플레이어 하나를 견본 RUN payload로 띄운다. 운영 배포에서는 404다. */
export default async function PlayerPreviewPage(props: PageProps<"/dev/players/[id]">) {
  if (process.env.VERCEL_ENV === "production") notFound();
  const { id } = await props.params;
  return <PlayerPreview id={id} />;
}
