"use client";

import Image from "next/image";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Header() {
  return (
    <nav className="flex w-full px-3 md:px-0 h-fit py-10 justify-between items-center">
      <div className="flex items-center gap-4">
        <div className="relative w-[60px] h-[60px]">
          <Image
            src="/logo.png"
            alt="Exam Score Logo"
            width={60}
            height={60}
            className="rounded-lg"
            style={{ width: "auto", height: "auto" }}
            unoptimized
            onError={(e) => {
              // Fallback to SVG if PNG fails
              const target = e.target as HTMLImageElement;
              if (target.src && !target.src.includes("logo.svg")) {
                target.src = "/logo.svg";
              }
            }}
          />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Encrypted Exam Score</h1>
      </div>
      <div className="flex items-center">
        <ConnectButton />
      </div>
    </nav>
  );
}

