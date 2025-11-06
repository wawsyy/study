import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "./components/Header";
import { ErrorHandler } from "./components/ErrorHandler";

export const metadata: Metadata = {
  title: "Encrypted Exam Score Log",
  description: "Privacy-preserving exam score tracking using FHE",
  icons: {
    icon: "/logo.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`exam-bg text-foreground antialiased`}>
        <ErrorHandler />
        <div className="fixed inset-0 w-full h-full exam-bg z-[-20] min-w-[850px]"></div>
        <main className="flex flex-col max-w-screen-lg mx-auto pb-20 min-w-[850px]">
          <Providers>
            <Header />
            {children}
          </Providers>
        </main>
      </body>
    </html>
  );
}

