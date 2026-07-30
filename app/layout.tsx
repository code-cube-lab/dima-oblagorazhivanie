import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Дима · Дом и участок — интерактивный проект",
  description:
    "Понятный проект дома и участка в Ставрополе: точные чертежи, 3D-прогулка, размеры, этапы, растения и смета.",
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
