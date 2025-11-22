"use client";

import { ethers } from "ethers";
import {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { FhevmInstance } from "@/fhevm/fhevmTypes";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { GenericStringStorage } from "@/fhevm/GenericStringStorage";
import { EncryptedExamScoreAddresses } from "@/abi/EncryptedExamScoreAddresses";
import { EncryptedExamScoreABI } from "@/abi/EncryptedExamScoreABI";

function getEncryptedExamScoreByChainId(
  chainId: number | undefined
): { abi: typeof EncryptedExamScoreABI.abi; address?: `0x${string}`; chainId?: number; chainName?: string } {
  if (!chainId) {
    return { abi: EncryptedExamScoreABI.abi };
  }

  const entry =
    EncryptedExamScoreAddresses[chainId.toString() as keyof typeof EncryptedExamScoreAddresses];

  if (!("address" in entry) || entry.address === ethers.ZeroAddress) {
    return { abi: EncryptedExamScoreABI.abi, chainId };
  }

  return {
    address: entry?.address as `0x${string}` | undefined,
    chainId: entry?.chainId ?? chainId,
    chainName: entry?.chainName,
    abi: EncryptedExamScoreABI.abi,
  };
}

export const useEncryptedExamScore = (parameters: {
  instance: FhevmInstance | undefined;
  fhevmDecryptionSignatureStorage: GenericStringStorage;
  eip1193Provider: ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  sameChain: RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: RefObject<
    (ethersSigner: ethers.JsonRpcSigner | undefined) => boolean
  >;
}) => {
  const {
    instance,
    fhevmDecryptionSignatureStorage,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  } = parameters;

  const encryptedExamScore = useMemo(
    () => getEncryptedExamScoreByChainId(chainId),
    [chainId]
  );

  const encryptedExamScoreRef = useRef(encryptedExamScore);
  useEffect(() => {
    encryptedExamScoreRef.current = encryptedExamScore;
  }, [encryptedExamScore]);

  const [scoreHandle, setScoreHandle] = useState<string | undefined>(undefined);
  const [scoreCount, setScoreCount] = useState<bigint | undefined>(undefined);
  const [clearScore, setClearScore] = useState<{ handle: string; clear: bigint } | undefined>(undefined);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string>("");

  const isRefreshingRef = useRef(false);
  const isDecryptingRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const clearScoreRef = useRef<{ handle: string; clear: bigint } | undefined>(undefined);

  const canGetScore = useMemo(() => {
    return (
      encryptedExamScore.address &&
      ethersReadonlyProvider &&
      !isRefreshing
    );
  }, [encryptedExamScore.address, ethersReadonlyProvider, isRefreshing]);

  const refreshScore = useCallback(() => {
    if (isRefreshingRef.current) {
      return;
    }

    if (!encryptedExamScore.address || !ethersReadonlyProvider) {
      setScoreHandle(undefined);
      setScoreCount(undefined);
      return;
    }

    isRefreshingRef.current = true;
    setIsRefreshing(true);
    setMessage("Loading score...");

    const thisEncryptedExamScoreAddress = encryptedExamScore.address;
    const thisEthersReadonlyProvider = ethersReadonlyProvider;
    const thisChainId = chainId;

    const contract = new ethers.Contract(
      thisEncryptedExamScoreAddress,
      encryptedExamScore.abi,
      thisEthersReadonlyProvider
    );

    // First check scoreCount, then conditionally call getMyScore
    contract.getMyScoreCount()
      .then((count: bigint) => {
        if (
          thisEncryptedExamScoreAddress !== encryptedExamScoreRef.current?.address ||
          !sameChain.current(thisChainId)
        ) {
          setMessage("Ignore refresh");
          isRefreshingRef.current = false;
          setIsRefreshing(false);
          return;
        }

        setScoreCount(count);

        // Only call getMyScore if count > 0 to avoid decoding uninitialized euint32
        if (count > BigInt(0)) {
          return contract.getMyScore()
            .then((encryptedScore: string) => {
              if (
                thisEncryptedExamScoreAddress !== encryptedExamScoreRef.current?.address ||
                !sameChain.current(thisChainId)
              ) {
                setMessage("Ignore refresh");
                return;
              }

              setScoreHandle(encryptedScore);
              setMessage("Score loaded");
            })
            .catch((e: any) => {
              // If getMyScore fails, still keep the count but clear the handle
              console.warn("[useEncryptedExamScore] Failed to get score:", e);
              setScoreHandle(undefined);
              setMessage("Score count loaded, but failed to load encrypted score");
            });
        } else {
          // No score exists, clear the handle
          setScoreHandle(undefined);
          setMessage("No score found");
        }
      })
      .catch((e: any) => {
        // Suppress network errors that don't affect functionality
        if (
          e instanceof TypeError &&
          (e.message?.includes("fetch") ||
            e.message?.includes("Failed to fetch"))
        ) {
          // Only log in development
          if (process.env.NODE_ENV === "development") {
            console.debug("[useEncryptedExamScore] Network error (suppressed):", e);
          }
          setMessage("Network error - please check your connection");
        } else {
          setMessage("Failed to load score: " + e);
        }
        setScoreHandle(undefined);
        setScoreCount(undefined);
      })
      .finally(() => {
        isRefreshingRef.current = false;
        setIsRefreshing(false);
      });
  }, [ethersReadonlyProvider, sameChain, chainId, encryptedExamScore]);

  useEffect(() => {
    refreshScore();
  }, [refreshScore]);

  const canDecrypt = useMemo(() => {
    return (
      encryptedExamScore.address &&
      instance &&
      ethersSigner &&
      !isRefreshing &&
      !isDecrypting &&
      scoreHandle &&
      scoreHandle !== ethers.ZeroHash &&
      scoreHandle !== clearScore?.handle
    );
  }, [
    encryptedExamScore.address,
    instance,
    ethersSigner,
    isRefreshing,
    isDecrypting,
    scoreHandle,
    clearScore,
  ]);

  const decryptScore = useCallback(() => {
    if (isRefreshingRef.current || isDecryptingRef.current) {
      return;
    }

    if (!encryptedExamScore.address || !instance || !ethersSigner) {
      return;
    }

    if (scoreHandle === clearScoreRef.current?.handle) {
      return;
    }

    if (!scoreHandle || scoreHandle === ethers.ZeroHash) {
      setClearScore(undefined);
      clearScoreRef.current = undefined;
      return;
    }

    const thisChainId = chainId;
    const thisAddress = encryptedExamScore.address;
    const thisScoreHandle = scoreHandle;
    const thisEthersSigner = ethersSigner;

    isDecryptingRef.current = true;
    setIsDecrypting(true);
    setMessage("Decrypting score...");

    const run = async () => {
      const isStale = () =>
        thisAddress !== encryptedExamScoreRef.current?.address ||
        !sameChain.current(thisChainId) ||
        !sameSigner.current(thisEthersSigner);

      try {
        const sig: FhevmDecryptionSignature | null =
          await FhevmDecryptionSignature.loadOrSign(
            instance,
            [encryptedExamScore.address as `0x${string}`],
            ethersSigner,
            fhevmDecryptionSignatureStorage
          );

        if (!sig) {
          setMessage("Unable to build FHEVM decryption signature");
          return;
        }

        if (isStale()) {
          setMessage("Ignore FHEVM decryption");
          return;
        }

        setMessage("Calling FHEVM userDecrypt...");

        const res = await instance.userDecrypt(
          [{ handle: thisScoreHandle, contractAddress: thisAddress }],
          sig.privateKey,
          sig.publicKey,
          sig.signature,
          sig.contractAddresses,
          sig.userAddress,
          sig.startTimestamp,
          sig.durationDays
        );

        setMessage("Decryption completed!");

        if (isStale()) {
          setMessage("Ignore FHEVM decryption");
          return;
        }

        const decryptedValue = res[thisScoreHandle];
        const clearValue: bigint = typeof decryptedValue === 'bigint' 
          ? decryptedValue 
          : typeof decryptedValue === 'string' 
            ? BigInt(decryptedValue) 
            : BigInt(Number(decryptedValue));
        
        setClearScore({ handle: thisScoreHandle, clear: clearValue });
        clearScoreRef.current = {
          handle: thisScoreHandle,
          clear: clearValue,
        };

        setMessage("Score decrypted: " + clearScoreRef.current.clear);
      } finally {
        isDecryptingRef.current = false;
        setIsDecrypting(false);
      }
    };

    run();
  }, [
    fhevmDecryptionSignatureStorage,
    ethersSigner,
    encryptedExamScore.address,
    instance,
    scoreHandle,
    chainId,
    sameChain,
    sameSigner,
  ]);

  const canSubmit = useMemo(() => {
    return (
      encryptedExamScore.address &&
      instance &&
      ethersSigner &&
      !isRefreshing &&
      !isSubmitting
    );
  }, [encryptedExamScore.address, instance, ethersSigner, isRefreshing, isSubmitting]);

  const submitScore = useCallback(
    (score: number) => {
      if (isRefreshingRef.current || isSubmittingRef.current) {
        return;
      }

      if (!encryptedExamScore.address || !instance || !ethersSigner || score < 0 || score > 100) {
        return;
      }

      const thisChainId = chainId;
      const thisAddress = encryptedExamScore.address;
      const thisEthersSigner = ethersSigner;
      const thisContract = new ethers.Contract(
        thisAddress,
        encryptedExamScore.abi,
        thisEthersSigner
      );

      isSubmittingRef.current = true;
      setIsSubmitting(true);
      setMessage(`Encrypting score ${score}...`);

      const run = async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));

        const isStale = () =>
          thisAddress !== encryptedExamScoreRef.current?.address ||
          !sameChain.current(thisChainId) ||
          !sameSigner.current(thisEthersSigner);

        try {
          const input = instance.createEncryptedInput(
            thisAddress,
            thisEthersSigner.address
          );
          input.add32(score);

          const enc = await input.encrypt();

          if (isStale()) {
            setMessage("Ignore submit");
            return;
          }

          setMessage(`Submitting encrypted score...`);

          const tx: ethers.TransactionResponse = await thisContract.submitScore(
            enc.handles[0],
            enc.inputProof
          );

          setMessage(`Waiting for tx:${tx.hash}...`);

          const receipt = await tx.wait();

          setMessage(`Score submitted! status=${receipt?.status}`);

          if (isStale()) {
            setMessage("Ignore submit");
            return;
          }

          refreshScore();
        } catch (e: any) {
          setMessage(`Submit failed: ${e.message || e}`);
        } finally {
          isSubmittingRef.current = false;
          setIsSubmitting(false);
        }
      };

      run();
    },
    [
      ethersSigner,
      encryptedExamScore.address,
      encryptedExamScore.abi,
      instance,
      chainId,
      refreshScore,
      sameChain,
      sameSigner,
    ]
  );

  return {
    contractAddress: encryptedExamScore.address,
    canDecrypt,
    canGetScore,
    canSubmit,
    submitScore,
    decryptScore,
    refreshScore,
    isDecrypted: Boolean(clearScore),
    message,
    clear: clearScore?.clear,
    handle: scoreHandle,
    scoreCount,
    isDecrypting,
    isRefreshing,
    isSubmitting,
    isDeployed: Boolean(encryptedExamScore.address && encryptedExamScore.address !== ethers.ZeroAddress),
  };
};

