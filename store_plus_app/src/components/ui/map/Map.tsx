import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import type * as MapLibreGL from "maplibre-gl";
import { cn } from "@/lib/utils";
import { MapContext } from "./MapContext";
import type { MapProps, MapRef, MapStyleOption, MapViewport } from "./MapTypes";
import { loadMapLibre, defaultStyles, blankMapStyle, blankGlobeStyle, useResolvedTheme, useStableValue, type MapLibreModule } from "./mapLib";

function DefaultLoader() {
  return (
    <div className="bg-background/50 absolute inset-0 z-10 flex items-center justify-center backdrop-blur-xs">
      <div className="flex gap-1">
        <span className="bg-muted-foreground/60 size-1.5 animate-pulse rounded-full" />
        <span className="bg-muted-foreground/60 size-1.5 animate-pulse rounded-full [animation-delay:150ms]" />
        <span className="bg-muted-foreground/60 size-1.5 animate-pulse rounded-full [animation-delay:300ms]" />
      </div>
    </div>
  );
}

function getViewport(map: MapLibreGL.Map): MapViewport {
  const center = map.getCenter();
  return {
    center: [center.lng, center.lat],
    zoom: map.getZoom(),
    bearing: map.getBearing(),
    pitch: map.getPitch(),
  };
}

export const Map = forwardRef<MapRef, MapProps>(function Map(
  {
    children,
    className,
    theme: themeProp,
    styles,
    blank = false,
    projection,
    viewport,
    onViewportChange,
    loading = false,
    ...props
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapLib, setMapLib] = useState<MapLibreModule | null>(null);
  const [mapInstance, setMapInstance] = useState<MapLibreGL.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isStyleLoaded, setIsStyleLoaded] = useState(false);
  const [pendingStyle, setPendingStyle] = useState<MapStyleOption | null>(null);
  const currentStyleRef = useRef<MapStyleOption | null>(null);
  const styleSwapInFlightRef = useRef(false);
  const internalUpdateRef = useRef(false);
  const resolvedTheme = useResolvedTheme(themeProp);

  const isControlled = viewport !== undefined && onViewportChange !== undefined;

  const onViewportChangeRef = useRef(onViewportChange);
  onViewportChangeRef.current = onViewportChange;

  const stableStyles = useStableValue(styles);
  const isGlobe = projection?.type === "globe";

  const mapStyles = useMemo(() => {
    // Explicit styles win. Otherwise `blank` opts into the transparent
    // tile-less basemap; with neither, fall back to the Carto defaults.
    if (stableStyles) {
      return {
        dark: stableStyles.dark ?? defaultStyles.dark,
        light: stableStyles.light ?? defaultStyles.light,
      };
    }
    if (blank) {
      const style = isGlobe ? blankGlobeStyle : blankMapStyle;
      return { dark: style, light: style };
    }
    return defaultStyles;
  }, [stableStyles, blank, isGlobe]);

  const initOptionsRef = useRef({ props, viewport, resolvedTheme, mapStyles });
  initOptionsRef.current = { props, viewport, resolvedTheme, mapStyles };

  // Expose the map instance to the parent component
  useImperativeHandle(ref, () => mapInstance as MapLibreGL.Map, [mapInstance]);

  // Initialize the map once maplibre-gl has loaded
  useEffect(() => {
    let cancelled = false;
    let map: MapLibreGL.Map | undefined;

    loadMapLibre()
      .then((lib) => {
        if (cancelled || !containerRef.current) return;

        // Latest props, not the first render's
        const { props, viewport, resolvedTheme, mapStyles } =
          initOptionsRef.current;
        const initialStyle =
          resolvedTheme === "dark" ? mapStyles.dark : mapStyles.light;
        currentStyleRef.current = initialStyle;

        // Create the map (no painter means WebGL2 is unavailable)
        const instance = new lib.Map({
          container: containerRef.current,
          style: initialStyle,
          renderWorldCopies: false,
          attributionControl: {
            compact: true,
          },
          ...props,
          ...viewport,
        });
        if (!instance.painter) throw new lib.GPUInitializationError({}, null);
        map = instance;

        // Track load state
        instance.on("load", () => setIsLoaded(true));
        instance.on("style.load", () => {
          styleSwapInFlightRef.current = false;
          setIsStyleLoaded(true);
        });
        // Skip viewport changes triggered by internal updates
        instance.on("move", () => {
          if (internalUpdateRef.current) return;
          onViewportChangeRef.current?.(getViewport(instance));
        });

        // set values for context
        setMapLib(lib);
        setMapInstance(instance);
      })
      // Rethrow during render so an error boundary catches it
      .catch((error) => {
        if (cancelled) return;
        setMapInstance(() => {
          throw error;
        });
      });

    return () => {
      cancelled = true;
      if (!map) return;
      map.remove();
      setIsLoaded(false);
      setIsStyleLoaded(false);
      setMapInstance(null);
    };
  }, []);

  // Sync controlled viewport to map
  useEffect(() => {
    if (!mapInstance || !isControlled || !viewport) return;
    if (mapInstance.isMoving()) return;

    const current = getViewport(mapInstance);
    const next = {
      center: viewport.center ?? current.center,
      zoom: viewport.zoom ?? current.zoom,
      bearing: viewport.bearing ?? current.bearing,
      pitch: viewport.pitch ?? current.pitch,
    };

    if (
      next.center[0] === current.center[0] &&
      next.center[1] === current.center[1] &&
      next.zoom === current.zoom &&
      next.bearing === current.bearing &&
      next.pitch === current.pitch
    ) {
      return;
    }

    internalUpdateRef.current = true;
    mapInstance.jumpTo(next);
    internalUpdateRef.current = false;
  }, [mapInstance, isControlled, viewport]);

  // Handle style change: close the gate (so layer children tear down and
  // re-add on the incoming style) - the swap itself is staged to the effect below.
  useEffect(() => {
    if (!mapInstance || !resolvedTheme) return;

    const newStyle =
      resolvedTheme === "dark" ? mapStyles.dark : mapStyles.light;

    if (currentStyleRef.current === newStyle) return;

    currentStyleRef.current = newStyle;
    setIsStyleLoaded(false);
    setPendingStyle(newStyle);
  }, [mapInstance, resolvedTheme, mapStyles]);

  useEffect(() => {
    if (!mapInstance || !pendingStyle) return;

    setPendingStyle(null);
    styleSwapInFlightRef.current = true;
    // Full reload (no diff) so `style.load` fires deterministically. A
    // successful diff would never fire it, leaving isStyleLoaded stuck false.
    mapInstance.setStyle(pendingStyle, { diff: false });
  }, [mapInstance, pendingStyle]);

  // Sync projection when the prop changes after mount.
  useEffect(() => {
    if (!mapInstance || !isStyleLoaded || !projection) return;
    if (styleSwapInFlightRef.current) return;
    mapInstance.setProjection(projection);
  }, [mapInstance, isStyleLoaded, projection]);

  const contextValue = useMemo(
    () => ({
      map: mapInstance,
      mapLib,
      isLoaded: isLoaded && isStyleLoaded,
      resolvedTheme,
    }),
    [mapInstance, mapLib, isLoaded, isStyleLoaded, resolvedTheme],
  );

  return (
    <MapContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        className={cn("relative h-full w-full", className)}
      >
        {(!isLoaded || loading) && <DefaultLoader />}
        {/* SSR-safe: children render only when map is loaded on client */}
        {mapInstance && children}
      </div>
    </MapContext.Provider>
  );
});
