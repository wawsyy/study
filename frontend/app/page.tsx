"use client";

import dynamic from "next/dynamic";

// Dynamically import ExamScoreDemo to avoid SSR hydration issues
// This ensures the component only renders on the client side
const ExamScoreDemo = dynamic(
  () => import("@/components/ExamScoreDemo").then((mod) => ({ default: mod.ExamScoreDemo })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    ),
  }
);

export default function Home() {
  return (
    <main className="">
      <div className="flex flex-col gap-8 items-center sm:items-start w-full px-3 md:px-0">
        <ExamScoreDemo />
      </div>
    </main>
  );
}
