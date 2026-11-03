# CLAUDE.md

StorePulse AI — Dark Store Intelligence (Swiggy Instamart). Goal: improve dark-store productivity, reduce operating costs, improve inventory efficiency and move toward sustainable profitability. All numbers come from the FastAPI backend in `../store_plus_server` (DuckDB over the parquet dataset).

Source wireframe: `../StorePulse AI – Wireframe.html` (reference only; the React app is the source of truth).

## Stack
React 19 + TypeScript + Vite, Tailwind CSS v4 (`@tailwindcss/vite`; tokens exposed in `src/index.css` `@theme`, existing CSS sits in Tailwind layers), Redux Toolkit (`@reduxjs/toolkit`, `react-redux`), React Router (`HashRouter`), no UI component library. Prefer Tailwind utilities for new styling.

Commands: `npm run dev`, `npm run build` (tsc + vite), `npm run lint` (oxlint).

## Hard rules
1. **No file may exceed 250 lines** (TS, TSX and CSS). Split into smaller components/modules before reaching the limit.
2. **No prop drilling.** Props are fine for one level of direct, presentational config (e.g. `<Kpi label value />`). If a value would be passed through components that don't use it, or more than one level down, move it to:
   - **Context API** (`src/context/`) for UI/session state shared across the tree (none today: the Pulse conversation lives in Redux so it survives navigation).
   - **Redux Toolkit** (`src/features/`) for domain/app state (store list and any future app data). Components read it with the typed hooks `useAppSelector` / `useAppDispatch` directly.
3. One component per file; file name = component name (PascalCase). Hooks `useX`, slices `xSlice.ts`.
4. Screen data comes from the backend via Redux (`features/dashboard`, `features/filters`); the City / Date-range filters live in the `filters` slice. Static constants live in `src/data/`, never inline in large JSX blocks.

## Scope
The sidebar has three groups (`NAV_GROUPS` in `src/data/screens.ts`): "Intelligence solutions" (overview + 6 solution screens), "AI assistant" (Pulse AI, `#/pulse`) and "Execution" (Transfer log). The store detail page (`#/store/:code`) is reached from store links and search, not the sidebar. The wireframe's "Decision workspace" group (priority list, store detail, map, simulator, approvals, experiments, competitor analysis) was deliberately removed — do not re-add it.

## Layout
```
src/
  app/          store.ts (configureStore), hooks.ts (typed hooks)
  features/     Redux slices: filters (City / range), dashboard (one async-loaded entry per screen), chat (Pulse conversation + focus), agent actions, ...
  hooks/        useScreen, useAskPulse (open the Pulse page, optionally with a question), usePageTitle, useScrollToTop, useGreeting, use-mobile
  components/
    layout/     Sidebar (dark rail, collapsible to icons), Topbar (breadcrumb, search, Ask Pulse, UserChip), TopbarSearch (Ctrl/⌘ K),
                PageFilters (City + Date range + DataAsOf, used by every page header)
    ui/sidebar/ shadcn sidebar, split into small files (generated file was >250 lines)
    ui/         ScreenHeader, ScreenData (PageSkeleton / ErrorState), Kpi, KpiGrid, Trend, InfoTip, Box, Pill, ScoreBar,
                KeyValue, SimpleTable, ActionsList (compact recommendations, Network side panel), AiBadge, ...
    insights/   AiInsights (the Pulse AI insights section), InsightsHeader, InsightCard, InsightsArt
    charts/     BarChart, LineChart, HBars, PnlBars, CandleChart, ...
  screens/      one file per route (split large ones into a folder of sections); screens/pulse = the Pulse AI page
  data/         static constants (nav + groups, user, map status colours, metricHints = KPI definitions, pulse = suggested questions)
  types/        api.ts: backend response types
  lib/          format helpers, pageMeta (section + title of a route), api.ts (fetch client, VITE_API_URL, default http://localhost:8000)
  styles/       split CSS files
```

## Conventions
- The sidebar header is the favicon.png icon + "StorePulse AI" name. It is the shadcn/ui Sidebar (`collapsible="icon"`) with Remix Icon (`@remixicon/react`; do not use lucide or phosphor) (`src/data/screens.ts`). Do not add taglines/subtitles (e.g. "Dark Store Intelligence · FY27") anywhere in the UI. Add shadcn components with `npx shadcn@latest add <name>`, then split any generated file that exceeds 250 lines.
- Routing is hash-based (`#/overview` …) to mirror the wireframe; screen list in `src/data/screens.ts`.
- Theme follows Swiggy brand guidelines: Swiggy Orange `#FF5200`, Salt `#FFEDE3`, Gilroy typeface (falls back to Urbanist, since Gilroy is a licensed font). Design tokens are CSS variables in `src/styles/base.css` (light + dark theme) — change colours/fonts there only.
- No pure white (`#fff`) anywhere: surfaces/text use warm cream tokens (`--surface`, `--paper`, `--brand-ink`). Use tokens, never hard-coded white.
- Look: calm warm-neutral page and flat cards (no glass, gradients or looping animations); the sidebar is a deep warm-charcoal rail (`--nav*` tokens) with an orange-tinted active item (no left-edge marker) and the abstract Swiggy-orange artwork at its bottom (`SidebarArt.tsx`; keep it). Orange is the brand accent and primary button (Ask Pulse).
- Colour carries meaning only: KPI cards are all the same neutral style; `--loss`/`--gain` for values, `Trend` chips for changes vs the previous period (green = moved the good way), and `Pill` variants for status (`red` bad, `warn` watch, `green` good, `blue`/`high` neutral highlights).
- Every page starts with `ScreenHeader` (title, one-line purpose, `PageFilters`); pass `filters="range"` or `"none"` when a page ignores City / Date range. Give each card a `sub` line saying how to read it.
- Every KPI label has a definition in `src/data/metricHints.ts` (shown as an ⓘ tooltip); add one when adding a KPI, worded from the backend calculation. Content written by the agent carries the `AiBadge`.
- AI recommendations live in their own section: `<AiInsights scope title />` directly under the KPI row of every dashboard page and the store page (dark header matching the sidebar, priority tabs, ranked `InsightCard`s with "Ask Pulse why" and Copy). Do not put recommendations back into a side column next to a chart.
- Pulse AI (the chat agent) is its own page, `#/pulse`, and the page is only the agent, edge to edge with no card around it (no border, radius or shadow; nested cards are not used in agent areas): dark header band (Swiggy logo, status, Focus area, New conversation, delivery-rider illustration) shown only before the first question; once a question is sent it is replaced by a slim light `PulseToolbar` with the same `PulseControls` and `PulseStatus`; then the conversation in a centred column, and the composer. There is no side drawer; every "Ask Pulse" button calls `useAskPulse()`. Illustrations are original flat SVGs in brand colours (`screens/pulse/ScooterRider`, `PulseHeaderArt`, `PulseWelcomeArt`) using `favicon.png` as the brand mark.
- Charts use Recharts (`src/components/charts/`, real complementary colours: blue `#1F6FEB` + orange `#FF5200`).
- The Network screen has a 3D map: MapLibre via the shadcn/mapcn map component (`src/components/ui/map/`, split into small files) plus a three.js custom layer (`src/components/map/warehouseScene.ts`) that draws 3D warehouses and catchment rings. Warehouses come from `/api/network` (Redux selector `selectMapWarehouses`; the map shows the selected city, Bengaluru for "All cities"). The warehouses are two-storey, with animated delivery-partner riders swarming around them. The map is controlled by gestures only (`OrbitGestures.tsx`): drag = rotate/tilt, scroll or swipe = pan, pinch = zoom, click a pin = fly in. Competitor dark stores (`dim_competitor_store`, `competitors` in `/api/network`; each warehouse carries its `rivals` within 3 km) are diamond pins with a brand tag in each brand's own colours (`CompetitorMarkers`, `BrandMark`, `BRANDS` in `src/data/competitors.ts`); selecting a store links it to those rivals with dotted lines (`RivalLines`) and lists them in its side panel (`NearbyRivals`). The legend (city · stores · competitors, status colours, competitor show/hide) sits above the map (`MapLegend`), not on it; the map has no attribution control.
- Currency/number formatting via `src/lib/format.ts` (`fmt`, `rupee`), en-IN locale.

