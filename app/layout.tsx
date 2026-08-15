import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const imageUrl = `${protocol}://${host}/og.png`;

  return {
    title: "소제, 시간의 지도",
    description:
      "대전 소제동 철도관사촌의 과거와 현재, 미래를 만나는 인터랙티브 지도",
    openGraph: {
      title: "소제, 시간의 지도",
      description: "골목 위에 겹쳐진 세 개의 시간을 걷다",
      type: "website",
      locale: "ko_KR",
      images: [{ url: imageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: "소제, 시간의 지도",
      description: "골목 위에 겹쳐진 세 개의 시간을 걷다",
      images: [imageUrl],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
