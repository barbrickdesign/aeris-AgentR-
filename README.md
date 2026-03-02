# Aeris

Real-time 3D flight tracking — altitude-aware, visually stunning. Powered by [World Monitor](https://worldmonitor.app) aviation intelligence.

Aeris renders live air traffic over the world's busiest airspaces on a premium dark-mode map. Flights are separated by altitude in true 3D: low altitudes glow cyan, high altitudes shift to gold. Select a city, and the camera glides to that airspace with spring-eased animation. Airport delay intelligence is surfaced inline via the [World Monitor](https://github.com/barbrickdesign/worldMonitor-enhancedByAgentR) aviation service — ground stops, departure delays, and severity ratings refresh automatically every 5 minutes.

[Live Demo](https://aeris.edbn.me)

 
<img width="2559" height="1380" alt="Screenshot 2026-02-15 112222" src="https://github.com/user-attachments/assets/9d1f50ed-be4e-4ef5-95ac-257e9129f8c8" />


<img width="2555" height="1387" alt="image" src="https://github.com/user-attachments/assets/a1d2f673-dfdc-4c82-8ee2-7629d91ad94b" />



## Stack

| Layer          | Technology                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------ |
| Framework      | Next.js 16 (App Router, Turbopack)                                                                                 |
| Language       | TypeScript                                                                                                         |
| Styling        | Tailwind CSS v4                                                                                                     |
| Map            | MapLibre GL JS                                                                                                      |
| WebGL          | Deck.gl 9 (IconLayer, PathLayer, MapboxOverlay)                                                                    |
| Animation      | Motion (Framer Motion)                                                                                              |
| Flight data    | OpenSky Network API                                                                                                 |
| Delay intel    | [World Monitor aviation API](https://github.com/barbrickdesign/worldMonitor-enhancedByAgentR) (FAA + Eurocontrol) |
| Hosting        | Vercel                                                                                                              |

## World Monitor Integration

Aeris is deeply integrated with [World Monitor](https://github.com/barbrickdesign/worldMonitor-enhancedByAgentR) — a real-time global intelligence dashboard that aggregates geopolitical events, military activity, vessel tracking, and aviation intelligence from dozens of live sources.

### Features

| Feature | Description |
| ------- | ----------- |
| **Airport delay badge** | Live ground stops, departure/arrival delays, and closures sourced from World Monitor's aviation service (FAA + Eurocontrol) |
| **Delay severity** | Color-coded severity levels: minor → moderate → major → severe |
| **World Monitor link** | One-click navigation to worldmonitor.app with city context for broader geopolitical intelligence |
| **Auto-refresh** | Delay data refreshes every 5 minutes via `/api/airport-status` (server-side cached) |

### How it works

```
Client                   Aeris (Next.js)               World Monitor
  │                            │                              │
  │ GET /api/airport-status    │                              │
  │ ?iata=SFO ──────────────►  │                              │
  │                            │  GET /api/aviation/v1/       │
  │                            │  list-airport-delays ──────► │
  │                            │                              │
  │                            │ ◄── { alerts: [...] } ───── │
  │                            │                              │
  │ ◄── { severity, type,  ── │                              │
  │        avgDelayMinutes }   │                              │
```

### New files

```
src/
├── app/api/airport-status/
│   └── route.ts           World Monitor aviation API proxy (5-min cache)
├── hooks/
│   └── use-airport-status.ts  Polling hook — refreshes delay data every 5 min
└── components/ui/
    └── world-monitor-link.tsx  Delay badge + worldmonitor.app deep-link
```

## Getting Started

```bash
pnpm install
cp .env.example .env.local
# Optionally add OpenSky credentials — see .env.example
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

```
src/
├── app/
│   ├── globals.css            Tailwind config, theme vars
│   ├── layout.tsx             Root layout (Inter font)
│   ├── page.tsx               Entry — renders <FlightTracker />
│   └── api/
│       └── airport-status/    World Monitor aviation proxy (delay intel)
├── components/
│   ├── flight-tracker.tsx     Orchestrator — state, camera, layers, UI
│   ├── map/
│   │   ├── map.tsx            MapLibre GL wrapper with React context
│   │   └── flight-layers.tsx  Deck.gl overlay — icons, trails, shadows, animation
│   └── ui/
│       ├── altitude-legend.tsx
│       ├── control-panel.tsx  Tabbed dialog — search, map style, settings
│       ├── flight-card.tsx    Hover card with flight details
│       ├── scroll-area.tsx    Custom scrollbar
│       ├── slider.tsx         Orbit speed slider (Radix)
│       ├── status-bar.tsx     Live status + World Monitor delay badge
│       └── world-monitor-link.tsx  World Monitor intelligence link
├── hooks/
│   ├── use-airport-status.ts  World Monitor delay polling hook
│   ├── use-flights.ts         Adaptive polling hook with credit-aware throttling
│   ├── use-settings.tsx       Settings context with localStorage persistence
│   └── use-trail-history.ts   Trail accumulation + Catmull-Rom smoothing
└── lib/
    ├── cities.ts              Curated aviation hub presets
    ├── flight-utils.ts        Altitude→color, unit conversions
    ├── map-styles.ts          Map style definitions
    ├── opensky.ts             OpenSky API client + types
    └── utils.ts               cn() utility
```

## Design

- **Dark-first**: CARTO Dark Matter base map, theme-aware UI
- **3D depth**: 55° pitch, altitude-based z-displacement via Deck.gl
- **Smooth animation**: Catmull-Rom spline trails, per-frame interpolation between polls
- **Glassmorphism**: `backdrop-blur-2xl`, `bg-black/60`, `border-white/[0.08]`
- **Spring physics**: All UI transitions use spring easing
- **Responsive**: Desktop sidebar dialog, mobile bottom-sheet with thumb-zone tab bar
- **API efficiency**: Adaptive polling (30 s → 5 min) based on remaining credits, Page Visibility pause, grid-snapped cache
- **Persistence**: Settings + map style in localStorage, `?city=IATA` URL deep links

## Environment Variables

| Variable                | Required | Description                     |
| ----------------------- | -------- | ------------------------------- |
| `OPENSKY_CLIENT_ID`     | No       | OAuth2 client ID (recommended)  |
| `OPENSKY_CLIENT_SECRET` | No       | OAuth2 client secret            |
| `OPENSKY_USERNAME`      | No       | Basic auth username (legacy)    |
| `OPENSKY_PASSWORD`      | No       | Basic auth password (legacy)    |
| `NEXT_PUBLIC_GA_ID`     | No       | Google Analytics measurement ID |

Without credentials, anonymous access is used (~10 requests/minute).

The World Monitor aviation integration requires no API key — delay data is fetched server-side via the public `https://api.worldmonitor.app` endpoint.

## License

AGPL-3.0
