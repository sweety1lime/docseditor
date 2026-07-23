import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Шаблонизатор документов ПДн",
  description: "Генератор документов по персональным данным (152-ФЗ)",
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
