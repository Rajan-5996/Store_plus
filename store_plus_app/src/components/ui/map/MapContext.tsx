import type { MapLibreModule, Theme } from "./mapLib";
import { createContext, useContext } from "react";
import type * as MapLibreGL from "maplibre-gl";

export type MapContextValue = {
  map: MapLibreGL.Map | null;
  mapLib: MapLibreModule | null;
  isLoaded: boolean;
  resolvedTheme: Theme;
};

export const MapContext = createContext<MapContextValue | null>(null);

export function useMap() {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error("useMap must be used within a Map component");
  }
  return context;
}

export function useMapLib() {
  const { mapLib } = useMap();
  if (!mapLib) {
    throw new Error("useMapLib must be used within a Map component");
  }
  return mapLib;
}

