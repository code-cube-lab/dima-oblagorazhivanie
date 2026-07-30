import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Дима · Дом и участок — подробный проект v18",
  description:
    "Многостраничный проект дома и участка в Ставрополе: фотореалистичные рендеры, кухня, размеры, инженерия, товары, этапы и смета.",
  openGraph: {
    title: "Дима · Облагораживание",
    description: "Проект дома и участка в Ставрополе: рендеры, размеры, кухня, общий балкон, баня, инженерия, товары и стоимость.",
    type: "website",
    locale: "ru_RU",
  },
  twitter: {
    card: "summary_large_image",
    title: "Дима · Облагораживание",
    description: "Рендеры, размеры, кухня, инженерия, товары и стоимость.",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <meta
          property="og:image"
          content="https://code-cube-lab.github.io/dima-oblagorazhivanie/og.png"
        />
        <meta property="og:image:width" content="1737" />
        <meta property="og:image:height" content="910" />
        <meta property="og:image:alt" content="Дима · Облагораживание — дом и участок" />
        <meta
          name="twitter:image"
          content="https://code-cube-lab.github.io/dima-oblagorazhivanie/og.png"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
