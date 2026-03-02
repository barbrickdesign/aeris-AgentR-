"use client";

import { motion } from "motion/react";
import type { AirportStatusPayload, DelaySeverity } from "@/app/api/airport-status/route";

const WM_BASE_URL = "https://worldmonitor.app";

export type WorldMonitorLinkProps = {
  cityName: string;
  iata: string;
  status: AirportStatusPayload | null;
  isDark?: boolean;
};

const SEVERITY_COLORS: Record<DelaySeverity, string> = {
  none: "text-emerald-400/70",
  minor: "text-yellow-400/80",
  moderate: "text-orange-400/80",
  major: "text-red-400/80",
  severe: "text-red-500/90",
};

const SEVERITY_BG: Record<DelaySeverity, string> = {
  none: "",
  minor: "bg-yellow-500/10 border-yellow-500/15",
  moderate: "bg-orange-500/10 border-orange-500/15",
  major: "bg-red-500/10 border-red-500/15",
  severe: "bg-red-600/15 border-red-600/20",
};

const DELAY_TYPE_LABELS: Record<string, string> = {
  ground_stop: "Ground Stop",
  ground_delay: "Ground Delay",
  departure_delay: "Dep. Delay",
  arrival_delay: "Arr. Delay",
  general: "Delays",
  closure: "Closure",
};

/**
 * World Monitor intelligence link — opens worldmonitor.app for broader
 * geopolitical and aviation context around the active airport.
 *
 * When the World Monitor aviation service reports delays for the active
 * airport, a severity badge is shown inline.
 *
 * @see https://github.com/barbrickdesign/worldMonitor-enhancedByAgentR
 */
export function WorldMonitorLink({
  cityName,
  iata,
  status,
  isDark = true,
}: WorldMonitorLinkProps) {
  const wmUrl = `${WM_BASE_URL}?ref=aeris&city=${encodeURIComponent(cityName)}`;
  const hasDelay = status?.hasDelay ?? false;
  const severity = status?.severity ?? "none";
  const delayType = status?.delayType ?? null;
  const avgDelay = status?.avgDelayMinutes ?? 0;

  const baseColor = isDark
    ? "rgb(var(--ui-fg) / 0.5)"
    : "rgb(var(--ui-fg) / 0.65)";

  return (
    <motion.a
      href={wmUrl}
      target="_blank"
      rel="noreferrer"
      aria-label={`Open World Monitor intelligence for ${cityName} (${iata})`}
      title={`World Monitor — global intelligence for ${cityName}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 24, delay: 0.52 }}
      className={`inline-flex h-9 items-center gap-2 rounded-xl border px-3 backdrop-blur-2xl transition-colors hover:opacity-80 ${
        hasDelay ? SEVERITY_BG[severity] : ""
      }`}
      style={{
        borderColor: hasDelay ? undefined : "rgb(var(--ui-fg) / 0.06)",
        backgroundColor: hasDelay ? undefined : "rgb(var(--ui-bg) / 0.5)",
        color: hasDelay ? undefined : baseColor,
      }}
    >
      {/* Globe icon */}
      <svg
        viewBox="0 0 24 24"
        className={`h-3.5 w-3.5 shrink-0 ${hasDelay ? SEVERITY_COLORS[severity] : ""}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        <path d="M2 12h20" />
      </svg>

      <span
        className={`text-[11px] font-medium tracking-wide ${
          hasDelay ? SEVERITY_COLORS[severity] : ""
        }`}
        style={{ color: hasDelay ? undefined : baseColor }}
      >
        World Monitor
      </span>

      {hasDelay && delayType && (
        <>
          <div
            className={`h-3 w-px ${SEVERITY_COLORS[severity]} opacity-30`}
          />
          <span className={`text-[10px] font-semibold tracking-wide uppercase ${SEVERITY_COLORS[severity]}`}>
            {DELAY_TYPE_LABELS[delayType] ?? "Delay"}
            {avgDelay > 0 && ` +${avgDelay}m`}
          </span>
        </>
      )}
    </motion.a>
  );
}
