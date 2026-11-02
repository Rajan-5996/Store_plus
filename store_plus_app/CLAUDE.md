# CLAUDE.md

StorePulse AI — Dark Store Intelligence (Swiggy Instamart). Goal: improve dark-store productivity, reduce operating costs, improve inventory efficiency and move toward sustainable profitability. All numbers come from the FastAPI backend in `../store_plus_server` (DuckDB over the parquet dataset).

Source wireframe: `../StorePulse AI – Wireframe.html` (reference only; the React app is the source of truth).

## Stack
React 19 + TypeScript + Vite, Tailwind CSS v4 (`@tailwindcss/vite`; tokens exposed in `src/index.css` `@theme`, existing CSS sits in Tailwind layers), Redux Toolkit (`@reduxjs/toolkit`, `react-redux`), React Router (`HashRouter`), no UI component library. Prefer Tailwind utilities for new styling.

Commands: `npm run dev`, `npm run build` (tsc + vite), `npm run lint` (oxlint).

## Hard rules
1. **No file may exceed 250 lines** (TS, TSX and CSS). Split into smaller components/modules before reaching the limit.
2. **No prop drilling.** Props are fine for one level of direct, presentational config (e.g. `<Kpi label value />`). If a value would be passed through components that don't use it, or more than one level down, move it to:
   - **Context API** (`src/context/`) for UI/session state shared across the tree (Ask AI drawer).
   - **Redux Toolkit** (`src/features/`) for domain/app state (store list and any future app data). Components read it with the typed hooks `useAppSelector` / `useAppDispatch` directly.
3. One component per file; file name = component name (PascalCase). Hooks `useX`, slices `xSlice.ts`.
4. Screen data comes from the backend via Redux (`features/dashboard`, `features/filters`); the City / Date-range filters live in the `filters` slice. Static constants live in `src/data/`, never inline in large JSX blocks.

## Scope
The sidebar has one group, "Intelligence solutions" (overview + 6 solution screens). The wireframe's "Decision workspace" group (priority list, store detail, map, simulator, approvals, experiments, competitor analysis) was deliberately removed — do not re-add it.

## Layout
```
src/
  app/          store.ts (configureStore), hooks.ts (typed hooks)
  context/      UIContext.tsx (Ask-AI drawer)
  features/     Redux slices: filters (City / range), dashboard (one async-loaded entry per screen)
  hooks/        useScrollProgress (top bar fade), use-mobile
  components/
    layout/     Sidebar (shadcn, collapsible to icons), Topbar (transparent → white on scroll), AskDrawer
    ui/sidebar/ shadcn sidebar, split into small files (generated file was >250 lines)
    ui/         Kpi, Box, Pill, Note, ScoreBar, KeyValue, SimpleTable, ...
    charts/     BarChart, LineChart, AreaChart, ComposedTrend, DotTrend, RadarTrend, CandleChart
  screens/      one file per route (split large ones into a folder of sections)
  data/         static constants (nav, user, map status colours)
  types/        api.ts: backend response types
  lib/          format helpers, api.ts (fetch client, VITE_API_URL, default http://localhost:8000)
  styles/       split CSS files
```

## Conventions
- The sidebar header is the favicon.png icon + "StorePulse AI" name. It is the shadcn/ui Sidebar (`collapsible="icon"`) with Remix Icon (`@remixicon/react`; do not use lucide or phosphor) (`src/data/screens.ts`). Do not add taglines/subtitles (e.g. "Dark Store Intelligence · FY27") anywhere in the UI. Add shadcn components with `npx shadcn@latest add <name>`, then split any generated file that exceeds 250 lines.
- Routing is hash-based (`#/overview` …) to mirror the wireframe; screen list in `src/data/screens.ts`.
- Theme follows Swiggy brand guidelines: Swiggy Orange `#FF5200`, Salt `#FFEDE3`, Gilroy typeface (falls back to Urbanist, since Gilroy is a licensed font). Design tokens are CSS variables in `src/styles/base.css` (light + dark theme) — change colours/fonts there only.
- No pure white (`#fff`) anywhere: surfaces/text use warm cream tokens (`--surface`, `--paper`, `--brand-ink`) and controls blend white with the Salt peach. Use tokens, never hard-coded white.
- Charts use Recharts (`src/components/charts/`, real complementary colours: blue `#1F6FEB` + orange `#FF5200`).
- The Network screen has a 3D map: MapLibre via the shadcn/mapcn map component (`src/components/ui/map/`, split into small files) plus a three.js custom layer (`src/components/map/warehouseScene.ts`) that draws 3D warehouses and catchment rings. Warehouses come from `/api/network` (Redux selector `selectMapWarehouses`; the map shows the selected city, Bengaluru for "All cities"). The warehouses are two-storey, with animated delivery-partner riders swarming around them. The map is controlled by gestures only (`OrbitGestures.tsx`): drag = rotate/tilt, scroll or swipe = pan, pinch = zoom, click a pin = fly in.
- Currency/number formatting via `src/lib/format.ts` (`fmt`, `rupee`), en-IN locale.

