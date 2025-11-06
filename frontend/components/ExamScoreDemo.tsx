"use client";

import { useState } from "react";
import { useFhevm } from "../fhevm/useFhevm";
import { useInMemoryStorage } from "../hooks/useInMemoryStorage";
import { useRainbowWallet } from "@/hooks/useRainbowWallet";
import { useEncryptedExamScore } from "@/hooks/useEncryptedExamScore";
import { errorNotDeployed } from "./ErrorNotDeployed";

export const ExamScoreDemo = () => {
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const {
    provider,
    chainId,
    accounts,
    isConnected,
    connect,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains,
  } = useRainbowWallet();

  const [scoreInput, setScoreInput] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const {
    instance: fhevmInstance,
    status: fhevmStatus,
    error: fhevmError,
  } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: true,
  });

  const examScore = useEncryptedExamScore({
    instance: fhevmInstance,
    fhevmDecryptionSignatureStorage,
    eip1193Provider: provider,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  const buttonClass =
    "inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 font-semibold text-white shadow-lg " +
    "transition-all duration-200 hover:from-purple-700 hover:to-indigo-700 hover:shadow-xl hover:scale-105 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 " +
    "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed";

  const cardClass = "rounded-xl bg-white/95 backdrop-blur-sm border-2 border-purple-200 shadow-xl hover:shadow-2xl transition-shadow duration-300 p-6";

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-md">
        <div className={cardClass}>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600 mb-6 text-center">
            Connect your Rainbow wallet to start tracking your encrypted exam scores
          </p>
          <button className={buttonClass + " w-full"} onClick={connect}>
            Connect Rainbow Wallet
          </button>
        </div>
      </div>
    );
  }

  if (examScore.isDeployed === false) {
    return errorNotDeployed(chainId);
  }

  const handleSubmit = () => {
    setErrorMessage("");

    const score = parseInt(scoreInput);
    if (isNaN(score) || score < 0 || score > 100) {
      setErrorMessage("Please enter a valid score between 0 and 100");
      return;
    }

    try {
      examScore.submitScore(score);
      setScoreInput("");
    } catch (error) {
      setErrorMessage("Failed to submit score. Please try again.");
    }
  };

  return (
    <div className="grid w-full gap-4 md:gap-6 max-w-4xl mx-auto px-4 md:px-6">
      {/* Header */}
      <div className={cardClass}>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Encrypted Exam Score Log
        </h1>
        <p className="text-gray-600">
          Track your exam scores privately. Your scores are encrypted and only you can decrypt them.
        </p>
      </div>

      {/* Submit Score Section */}
      <div className={cardClass}>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Submit New Score</h2>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <input
            type="number"
            min="0"
            max="100"
            value={scoreInput}
            onChange={(e) => setScoreInput(e.target.value)}
            placeholder="Enter score (0-100)"
            className="flex-1 px-4 py-3 rounded-lg border-2 border-purple-300 focus:border-purple-500 focus:outline-none text-lg"
            disabled={!examScore.canSubmit || examScore.isSubmitting}
          />
          <button
            className={buttonClass + " w-full sm:w-auto sm:flex-shrink-0"}
            disabled={!examScore.canSubmit || examScore.isSubmitting}
            onClick={handleSubmit}
          >
            {examScore.isSubmitting ? "Submitting..." : "Submit Score"}
          </button>
        </div>
        {examScore.isSubmitting && (
          <p className="mt-2 text-sm text-purple-600">{examScore.message}</p>
        )}
        {errorMessage && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{errorMessage}</p>
          </div>
        )}
      </div>

      {/* View Score Section */}
      <div className={cardClass}>
        <h2 className="text-xl font-bold text-gray-800 mb-4">My Encrypted Score</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Encrypted Score Handle</p>
            <p className="font-mono text-xs break-all text-gray-800">
              {examScore.handle && examScore.handle !== "0x0000000000000000000000000000000000000000000000000000000000000000"
                ? examScore.handle
                : "No score submitted yet"}
            </p>
          </div>
          
          <div className="bg-indigo-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Score Count</p>
            <p className="text-2xl font-bold text-indigo-700">
              {examScore.scoreCount !== undefined ? examScore.scoreCount.toString() : "0"}
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            className={buttonClass + " flex-1"}
            disabled={!examScore.canGetScore}
            onClick={examScore.refreshScore}
          >
            {examScore.isRefreshing ? "Loading..." : "Refresh Score"}
          </button>
          
          <button
            className={buttonClass + " flex-1"}
            disabled={!examScore.canDecrypt}
            onClick={examScore.decryptScore}
          >
            {examScore.isDecrypting
              ? "Decrypting..."
              : examScore.isDecrypted
                ? `Decrypted: ${examScore.clear?.toString() || "N/A"}`
                : "Decrypt Score"}
          </button>
        </div>

        {examScore.message && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">{examScore.message}</p>
          </div>
        )}
      </div>

    </div>
  );
};

