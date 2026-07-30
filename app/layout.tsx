import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Дима · Дом и участок — интерактивный проект",
  description:
    "Понятный проект дома и участка в Ставрополе: точные чертежи, 3D-прогулка, размеры, этапы, растения и смета.",
  openGraph: {
    title: "Дима · Облагораживание",
    description: "Точный 3D-проект дома и участка в Ставрополе: размеры, комнаты, баня, посадки и стоимость.",
    type: "website",
    locale: "ru_RU",
    images: [
      {
        url: "https://code-cube-lab.github.io/dima-oblagorazhivanie/og.png",
        width: 1737,
        height: 910,
        alt: "Дима · Облагораживание — дом и участок",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Дима · Облагораживание",
    description: "Точный 3D-проект, размеры и стоимость.",
    images: ["https://code-cube-lab.github.io/dima-oblagorazhivanie/og.png"],
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
      <body>{children}</body>
    </html>
  );
}
