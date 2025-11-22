"use client";

import { useEffect } from "react";

/**
 * Global error handler component to catch and suppress non-critical fetch errors
 * This prevents console noise from failed network requests that don't affect functionality
 */
export function ErrorHandler() {
  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      
      // Suppress "Failed to fetch" and network-related errors that don't affect functionality
      if (
        error instanceof TypeError &&
        (error.message?.includes("fetch") ||
          error.message?.includes("Failed to fetch") ||
          error.message?.includes("NetworkError") ||
          error.message?.includes("Network request failed"))
      ) {
        event.preventDefault();
        // Only log in development mode
        if (process.env.NODE_ENV === "development") {
          console.debug(
            "[ErrorHandler] Suppressed network error:",
            error.message
          );
        }
        return;
      }
      
      // Suppress errors from Base Account SDK or other non-critical SDKs
      if (
        typeof error === "string" &&
        (error.includes("Base Account SDK") ||
          error.includes("Cross-Origin-Opener-Policy") ||
          error.includes("Analytics SDK"))
      ) {
        event.preventDefault();
        if (process.env.NODE_ENV === "development") {
          console.debug("[ErrorHandler] Suppressed SDK error:", error);
        }
        return;
      }
      
      // Suppress Coinbase-related errors (COEP issues)
      if (
        error instanceof TypeError &&
        (error.message?.includes("coinbase") ||
          error.message?.includes("COEP") ||
          error.message?.includes("NotSameOriginAfterDefaultedToSameOriginByCoep"))
      ) {
        event.preventDefault();
        if (process.env.NODE_ENV === "development") {
          console.debug("[ErrorHandler] Suppressed Coinbase/COEP error:", error.message);
        }
        return;
      }
      
      // Let other errors through for proper error handling
    };

    // Handle console errors (like Analytics SDK errors)
    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => {
      const errorString = args.join(" ");
      
      // Suppress Analytics SDK and Coinbase-related console errors
      if (
        errorString.includes("Analytics SDK") ||
        errorString.includes("Failed to fetch") ||
        errorString.includes("coinbase") ||
        errorString.includes("COEP") ||
        errorString.includes("NotSameOriginAfterDefaultedToSameOriginByCoep")
      ) {
        // Suppress these errors
        if (process.env.NODE_ENV === "development") {
          console.debug("[ErrorHandler] Suppressed console error:", errorString);
        }
        return;
      }
      
      // Call original console.error for other errors
      originalConsoleError.apply(console, args);
    };

    // Handle network errors from resource loading
    const handleError = (event: ErrorEvent) => {
      // Check if target has src property (HTMLImageElement, HTMLScriptElement, etc.)
      const target = event.target as HTMLElement & { src?: string };
      
      // Suppress Coinbase and COEP-related resource errors
      if (
        target &&
        (target.src?.includes("coinbase") ||
          target.src?.includes("cca-lite") ||
          event.message?.includes("COEP") ||
          event.message?.includes("NotSameOriginAfterDefaultedToSameOriginByCoep"))
      ) {
        event.preventDefault();
        if (process.env.NODE_ENV === "development") {
          console.debug("[ErrorHandler] Suppressed resource error:", event.message);
        }
        return;
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleError);

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      window.removeEventListener("error", handleError);
      console.error = originalConsoleError;
    };
  }, []);

  return null;
}

