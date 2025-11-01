import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GeradorCursoProvider } from "@/context/GeradorCursoContext";
import { ProgressoProvider } from "@/context/ProgressoContext";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gerador de Cursos SCORM",
  description: "Crie e exporte cursos em formato SCORM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <GeradorCursoProvider>
          <ProgressoProvider>
            {children}
          </ProgressoProvider>
        </GeradorCursoProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
