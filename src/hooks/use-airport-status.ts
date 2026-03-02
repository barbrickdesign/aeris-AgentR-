"use client";

import { useState, useEffect, useRef } from "react";
import type { AirportStatusPayload } from "@/app/api/airport-status/route";

export type { AirportStatusPayload };

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes — matches server cache TTL
const FETCH_TIMEOUT_MS = 8_000;

/**
 * Fetches and periodically refreshes World Monitor airport delay intelligence
 * for the given IATA airport code.
 *
 * Returns null while loading or when no IATA is provided. Silently
 * degrades on network errors so the main flight tracker is never blocked.
 *
 * @see https://github.com/barbrickdesign/worldMonitor-enhancedByAgentR
 */
export function useAirportStatus(iata: string | null) {
  const [status, setStatus] = useState<AirportStatusPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const iataRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const code = iata?.trim().toUpperCase() ?? null;

    // Clear state immediately when the airport changes.
    if (code !== iataRef.current) {
      setStatus(null);
      iataRef.current = code;
    }

    if (!code || !/^[A-Z]{3}$/.test(code)) {
      setLoading(false);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    abortRef.current?.abort();

    async function fetchStatus(currentCode: string) {
      const controller = new AbortController();
      abortRef.current = controller;
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      setLoading(true);
      try {
        const res = await fetch(
          `/api/airport-status?iata=${encodeURIComponent(currentCode)}`,
          { signal: controller.signal, cache: "no-store" },
        );
        if (!res.ok) return;
        const data = (await res.json()) as AirportStatusPayload;
        if (iataRef.current === currentCode) {
          setStatus(data);
        }
      } catch {
        // Silently degrade — delay data is informational only.
      } finally {
        clearTimeout(timer);
        if (iataRef.current === currentCode) {
          setLoading(false);
        }
      }
    }

    fetchStatus(code);

    // Refresh periodically to pick up new delay programs.
    timerRef.current = setInterval(() => {
      const latest = iataRef.current;
      if (latest) fetchStatus(latest);
    }, POLL_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      abortRef.current?.abort();
    };
  }, [iata]);

  return { status, loading };
}
