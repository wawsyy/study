"use client";

import { useAccount, useChainId, useConnect, useDisconnect, useWalletClient, usePublicClient } from "wagmi";
import { ethers } from "ethers";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Rainbow wallet hook that provides Eip1193Provider interface for FHEVM
 * This adapter allows FHEVM to work with Rainbow wallet through wagmi
 */
export function useRainbowWallet() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [provider, setProvider] = useState<ethers.Eip1193Provider | undefined>(undefined);
  const [ethersSigner, setEthersSigner] = useState<ethers.JsonRpcSigner | undefined>(undefined);
  const [ethersReadonlyProvider, setEthersReadonlyProvider] = useState<ethers.ContractRunner | undefined>(undefined);

  // Create Eip1193Provider adapter from wagmi walletClient
  useEffect(() => {
    if (!walletClient || !isConnected) {
      setProvider(undefined);
      setEthersSigner(undefined);
      setEthersReadonlyProvider(undefined);
      return;
    }

    // Create an Eip1193Provider adapter
    const eip1193Provider: ethers.Eip1193Provider = {
      request: async (args: { method: string; params?: unknown[] }) => {
        if (args.method === "eth_requestAccounts") {
          return [address];
        }
        if (args.method === "eth_accounts") {
          return address ? [address] : [];
        }
        if (args.method === "eth_chainId") {
          return `0x${chainId.toString(16)}`;
        }
        // For other methods, use the walletClient
        return await walletClient.request(args as any);
      },
      on: () => {},
      removeListener: () => {},
    };

    setProvider(eip1193Provider);

    // Create ethers BrowserProvider and signer
    const browserProvider = new ethers.BrowserProvider(eip1193Provider);
    const signer = new ethers.JsonRpcSigner(browserProvider, address!);
    setEthersSigner(signer);
    setEthersReadonlyProvider(browserProvider);
  }, [walletClient, isConnected, address, chainId]);

  const handleConnect = useCallback(() => {
    const rainbowConnector = connectors.find((c) => c.id === "rainbow" || c.name.toLowerCase().includes("rainbow"));
    if (rainbowConnector) {
      connect({ connector: rainbowConnector });
    } else {
      // Fallback to first available connector
      if (connectors.length > 0) {
        connect({ connector: connectors[0] });
      }
    }
  }, [connect, connectors]);

  const handleDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

  const chainIdRef = useRef<number | undefined>(chainId);
  const ethersSignerRef = useRef<ethers.JsonRpcSigner | undefined>(undefined);

  useEffect(() => {
    chainIdRef.current = chainId;
  }, [chainId]);

  useEffect(() => {
    ethersSignerRef.current = ethersSigner;
  }, [ethersSigner]);

  const sameChain = useRef((currentChainId: number | undefined) => {
    return currentChainId === chainIdRef.current;
  });

  const sameSigner = useRef((currentSigner: ethers.JsonRpcSigner | undefined) => {
    return currentSigner === ethersSignerRef.current;
  });

  return {
    provider,
    chainId,
    accounts: address ? [address] : [],
    isConnected,
    connect: handleConnect,
    disconnect: handleDisconnect,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    address,
    initialMockChains: { 31337: "http://localhost:8545" } as Readonly<Record<number, string>>,
  };
}

