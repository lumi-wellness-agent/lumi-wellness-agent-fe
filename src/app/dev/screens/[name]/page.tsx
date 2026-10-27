import { notFound } from "next/navigation";
import { SCREEN_PREVIEWS } from "../previews";
import { ScreenPreview } from "./screen-preview";

export const dynamicParams = false;

export function generateStaticParams() {
  return SCREEN_PREVIEWS.map(({ name }) => ({ name }));
}

/** 세션 화면 하나를 견본 payload로 띄운다. 운영 배포에서는 404다. */
export default async function ScreenPreviewPage(props: PageProps<"/dev/screens/[name]">) {
  if (process.env.VERCEL_ENV === "production") notFound();
  const { name } = await props.params;
  return <ScreenPreview name={name} />;
}
