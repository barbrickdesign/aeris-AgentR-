import { NextResponse } from "next/server";

/**
 * Airport status proxy — fetches live delay data from the World Monitor
 * aviation intelligence API and returns a filtered snapshot for the
 * requested IATA code.
 *
 * @see https://github.com/barbrickdesign/worldMonitor-enhancedByAgentR
 */

const WM_AVIATION_API =
  "https://api.worldmonitor.app/api/aviation/v1/list-airport-delays";
const CACHE_TTL_SECONDS = 300; // 5 minutes

export type DelaySeverity =
  | "none"
  | "minor"
  | "moderate"
  | "major"
  | "severe";

export type DelayType =
  | "ground_stop"
  | "ground_delay"
  | "departure_delay"
  | "arrival_delay"
  | "general"
  | "closure";

export type AirportStatusPayload = {
  iata: string;
  hasDelay: boolean;
  severity: DelaySeverity;
  delayType: DelayType | null;
  avgDelayMinutes: number;
  reason: string | null;
  updatedAt: number | null;
};

// ---- Internal types matching World Monitor's aviation service ----

type WmDelaySeverity =
  | "FLIGHT_DELAY_SEVERITY_UNSPECIFIED"
  | "FLIGHT_DELAY_SEVERITY_NORMAL"
  | "FLIGHT_DELAY_SEVERITY_MINOR"
  | "FLIGHT_DELAY_SEVERITY_MODERATE"
  | "FLIGHT_DELAY_SEVERITY_MAJOR"
  | "FLIGHT_DELAY_SEVERITY_SEVERE";

type WmDelayType =
  | "FLIGHT_DELAY_TYPE_UNSPECIFIED"
  | "FLIGHT_DELAY_TYPE_GROUND_STOP"
  | "FLIGHT_DELAY_TYPE_GROUND_DELAY"
  | "FLIGHT_DELAY_TYPE_DEPARTURE_DELAY"
  | "FLIGHT_DELAY_TYPE_ARRIVAL_DELAY"
  | "FLIGHT_DELAY_TYPE_GENERAL"
  | "FLIGHT_DELAY_TYPE_CLOSURE";

type WmAlert = {
  iata: string;
  severity: WmDelaySeverity;
  delayType: WmDelayType;
  avgDelayMinutes: number;
  reason: string;
  updatedAt: number;
};

type WmResponse = {
  alerts?: WmAlert[];
};

function mapSeverity(s: WmDelaySeverity): DelaySeverity {
  switch (s) {
    case "FLIGHT_DELAY_SEVERITY_MINOR":
      return "minor";
    case "FLIGHT_DELAY_SEVERITY_MODERATE":
      return "moderate";
    case "FLIGHT_DELAY_SEVERITY_MAJOR":
      return "major";
    case "FLIGHT_DELAY_SEVERITY_SEVERE":
      return "severe";
    default:
      return "none";
  }
}

function mapDelayType(t: WmDelayType): DelayType | null {
  switch (t) {
    case "FLIGHT_DELAY_TYPE_GROUND_STOP":
      return "ground_stop";
    case "FLIGHT_DELAY_TYPE_GROUND_DELAY":
      return "ground_delay";
    case "FLIGHT_DELAY_TYPE_DEPARTURE_DELAY":
      return "departure_delay";
    case "FLIGHT_DELAY_TYPE_ARRIVAL_DELAY":
      return "arrival_delay";
    case "FLIGHT_DELAY_TYPE_GENERAL":
      return "general";
    case "FLIGHT_DELAY_TYPE_CLOSURE":
      return "closure";
    default:
      return null;
  }
}

const IATA_RE = /^[A-Z]{3}$/;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawIata = searchParams.get("iata")?.trim().toUpperCase() ?? "";

  if (!IATA_RE.test(rawIata)) {
    return NextResponse.json(
      { error: "Missing or invalid IATA code" },
      { status: 400 },
    );
  }

  const noStatus: AirportStatusPayload = {
    iata: rawIata,
    hasDelay: false,
    severity: "none",
    delayType: null,
    avgDelayMinutes: 0,
    reason: null,
    updatedAt: null,
  };

  try {
    const res = await fetch(WM_AVIATION_API, {
      next: { revalidate: CACHE_TTL_SECONDS },
      headers: {
        Accept: "application/json",
        "User-Agent": "aeris/1.0 (+https://github.com/barbrickdesign/aeris-AgentR-)",
      },
    });

    if (!res.ok) {
      return NextResponse.json(noStatus, {
        headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
      });
    }

    const data = (await res.json()) as WmResponse;
    const alerts = Array.isArray(data?.alerts) ? data.alerts : [];

    const match = alerts.find(
      (a) => typeof a.iata === "string" && a.iata.toUpperCase() === rawIata,
    );

    if (!match) {
      return NextResponse.json(noStatus, {
        headers: {
          "Cache-Control": `public, s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=120`,
        },
      });
    }

    const severity = mapSeverity(match.severity);
    const payload: AirportStatusPayload = {
      iata: rawIata,
      hasDelay: severity !== "none",
      severity,
      delayType: mapDelayType(match.delayType),
      avgDelayMinutes: match.avgDelayMinutes ?? 0,
      reason: match.reason || null,
      updatedAt: typeof match.updatedAt === "number" ? match.updatedAt : null,
    };

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": `public, s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=120`,
      },
    });
  } catch {
    return NextResponse.json(noStatus, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  }
}
