import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ENADE ENG",
  description: "MVP com autenticação e autorização por role.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
