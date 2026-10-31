import { useEffect, useRef, useState } from 'react';
import { load } from '@2gis/mapgl';
import type { HtmlMarker, Map as MapglMap, Polyline } from '@2gis/mapgl/types';
import type { Building, Door, Gate, GateId, LngLat } from '../../types';
import { boundsOf } from '../../lib/geo';
import { ru } from '../../i18n/ru';
import type { BuildingModel } from './BuildingModel';
import { buildingPin, doorDot, gatePin, userDot } from './markers';
import styles from './MapView.module.css';

type Mapgl = Awaited<ReturnType<typeof load>>;

export interface MapPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface Props {
  apiKey: string | undefined;
  view: { center: LngLat; zoom: number; pitch: number; rotation: number };
  buildings: Building[];
  doors: Door[];
  gates: Gate[];
  route: LngLat[] | null;
  activeGateId: GateId | null;
  activeDoorId: string | null;
  userPosition: LngLat | null;
  /** Сколько места по краям занимают панели: линия маршрута не должна под ними прятаться. */
  padding: MapPadding;
  reducedMotion: boolean;
  onBuildingSelect: (id: string) => void;
  /** TODO: 3D-модели корпусов. В тестовой версии не используется. */
  models?: BuildingModel[];
}

export function MapView(props: Props) {
  const { apiKey, route, activeGateId, activeDoorId, userPosition, padding, reducedMotion } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<Mapgl | null>(null);
  const mapRef = useRef<MapglMap | null>(null);
  const gateEls = useRef(new Map<string, HTMLElement>());
  const doorEls = useRef(new Map<string, HTMLElement>());
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  // Метки создаются один раз при загрузке карты; обработчик берётся всегда свежий.
  const initRef = useRef(props);
  useEffect(() => {
    initRef.current = props;
  });

  useEffect(() => {
    if (!apiKey || !containerRef.current) return;
    let cancelled = false;
    let map: MapglMap | null = null;
    const markers: HtmlMarker[] = [];
    const container = containerRef.current;
    const gateMap = gateEls.current;
    const doorMap = doorEls.current;

    load()
      .then((api) => {
        if (cancelled) return;
        if (!api.isSupported()) throw new UnsupportedError(api.notSupportedReason() ?? '');
        const { view, buildings, doors, gates } = initRef.current;
        map = new api.Map(container, { ...view, key: apiKey, zoomControl: false });
        apiRef.current = api;
        mapRef.current = map;
        const add = (coordinates: LngLat, html: HTMLElement, zIndex = 0) =>
          markers.push(new api.HtmlMarker(map as MapglMap, { coordinates, html, zIndex }));

        for (const b of buildings) {
          add(
            b.labelAt,
            buildingPin(b, (id) => initRef.current.onBuildingSelect(id)),
            2,
          );
        }
        for (const d of doors) {
          const el = doorDot(d, buildings.find((b) => b.id === d.buildingId)?.label ?? '');
          doorMap.set(d.id, el);
          add(d.at, el, 1);
        }
        for (const g of gates) {
          const el = gatePin(g);
          gateMap.set(g.id, el);
          add(g.at, el, 3);
        }
        setReady(true);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        console.error('2GIS MapGL:', e);
        setError(describeMapError(e));
      });

    return () => {
      cancelled = true;
      markers.forEach((m) => m.destroy());
      map?.destroy();
      mapRef.current = null;
      gateMap.clear();
      doorMap.clear();
      setReady(false);
    };
  }, [apiKey, attempt]);

  // Линия маршрута и подгонка масштаба под неё.
  useEffect(() => {
    const api = apiRef.current;
    const map = mapRef.current;
    if (!ready || !api || !map || !route) return;
    const css = getComputedStyle(document.documentElement);
    const line: Polyline = new api.Polyline(map, {
      coordinates: route,
      width: 7,
      color: css.getPropertyValue('--route').trim() || '#3F51B5',
      width2: 12,
      color2: '#ffffff',
    });
    return () => line.destroy();
  }, [ready, route]);

  useEffect(() => {
    const map = mapRef.current;
    const bounds = route && boundsOf(route);
    if (!ready || !map || !bounds) return;
    map.fitBounds(bounds, {
      padding: {
        top: padding.top + 40,
        right: padding.right + 40,
        bottom: padding.bottom + 40,
        left: padding.left + 40,
      },
      considerRotation: true,
      maxZoom: 19,
      animation: { duration: reducedMotion ? 0 : 700, easing: 'easeInOutCubic' },
    });
  }, [ready, route, padding.top, padding.right, padding.bottom, padding.left, reducedMotion]);

  // Подсветка старта (ворота) и финиша (дверь).
  useEffect(() => {
    if (!ready) return;
    gateEls.current.forEach((el, id) =>
      el.classList.toggle(styles.active ?? '', id === activeGateId),
    );
    doorEls.current.forEach((el, id) =>
      el.classList.toggle(styles.active ?? '', id === activeDoorId),
    );
  }, [ready, activeGateId, activeDoorId]);

  useEffect(() => {
    const api = apiRef.current;
    const map = mapRef.current;
    if (!ready || !api || !map || !userPosition) return;
    const marker = new api.HtmlMarker(map, {
      coordinates: userPosition,
      html: userDot(),
      zIndex: 4,
    });
    return () => marker.destroy();
  }, [ready, userPosition]);

  const resetNorth = () => {
    mapRef.current?.setRotation(0, { duration: reducedMotion ? 0 : 400 });
  };

  if (!apiKey || error) {
    return (
      <div className={styles.fallback} role="status">
        <div className={styles.fallbackCard}>
          <strong>{error ? ru.mapErrorTitle : ru.noKeyTitle}</strong>
          <p>{error ?? ru.noKeyText}</p>
          {error && (
            <button
              type="button"
              className={styles.retry}
              onClick={() => {
                setError(null);
                setAttempt((n) => n + 1);
              }}
            >
              {ru.mapRetry}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div ref={containerRef} className={styles.map} />
      {ready && (
        <button
          type="button"
          className={styles.north}
          style={{ top: padding.top + 12, right: padding.right + 12 }}
          onClick={resetNorth}
          aria-label={ru.mapNorth}
          title={ru.mapNorth}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path d="M12 3l5 16-5-3-5 3z" fill="currentColor" />
          </svg>
        </button>
      )}
    </div>
  );
}

class UnsupportedError extends Error {}

/** Понятная причина, почему карта не открылась. */
function describeMapError(e: unknown): string {
  if (e instanceof UnsupportedError) return ru.mapUnsupported(e.message);
  // Ошибка загрузки <script> приходит как Event, а не Error.
  if (e instanceof Error) return ru.mapCreateError(e.message);
  return ru.mapScriptError;
}
