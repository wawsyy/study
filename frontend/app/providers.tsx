"use client";

import type { ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { sepolia, hardhat } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { InMemoryStorageProvider } from "@/hooks/useInMemoryStorage";

const config = getDefaultConfig({
  appName: "Encrypted Exam Score",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID", // Get from https://cloud.walletconnect.com
  chains: [sepolia, hardhat],
  ssr: false, // Set to false to avoid Base Account SDK issues
});

const queryClient = new QueryClient();

type Props = {
  children: ReactNode;
};

export function Providers({ children }: Props) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <InMemoryStorageProvider>{children}</InMemoryStorageProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

