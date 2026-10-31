import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BUILDINGS,
  DOORS,
  GATES,
  MAP_VIEW,
  NEAR_CAMPUS_RADIUS_M,
  getBuilding,
  getGate,
} from './data/campus';
import { FLOORS, groundFloor } from './data/buildings';
import { routeToDoors, roundMeters, targetDoors, walkMinutes } from './lib/campusRoute';
import { floorRoute, resolveRoom } from './lib/floorRoute';
import { dgisDirectionsUrl, nearestGate } from './lib/geo';
import { buildSearchIndex, type SearchItem } from './lib/search';
import { useNavState } from './hooks/useNavState';
import { useLocate } from './hooks/useLocate';
import { DESKTOP_QUERY, REDUCED_MOTION_QUERY, useMediaQuery } from './hooks/useMediaQuery';
import { MapView, type MapPadding } from './components/MapView/MapView';
import { BottomSheet } from './components/BottomSheet/BottomSheet';
import { SearchBar } from './components/SearchBar/SearchBar';
import { QuickPicks } from './components/QuickPicks/QuickPicks';
import { RoutePanel } from './components/RoutePanel/RoutePanel';
import { GatePicker } from './components/GatePicker/GatePicker';
import { EntrancePicker } from './components/EntrancePicker/EntrancePicker';
import { FloorScreen, type FloorInfo } from './pages/FloorScreen';
import { ru } from './i18n/ru';
import styles from './App.module.css';

const SEARCH_INDEX = buildSearchIndex(BUILDINGS, FLOORS);
const DGIS_KEY: string | undefined = import.meta.env.VITE_DGIS_KEY || undefined;
const TOP_BAR_PX = 72;

export function App() {
  const [nav, setNav] = useNavState();
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<string | null>(null);
  const [serviceTapped, setServiceTapped] = useState(false);
  const [locate, requestLocate, resetLocate] = useLocate();
  const desktop = useMediaQuery(DESKTOP_QUERY);
  const reducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);
  const [sheetPx, setSheetPx] = useState(0);

  /* ── Что выбрано ── */
  const found = nav.buildingId ? getBuilding(nav.buildingId) : undefined;
  const building = found && found.kind !== 'foreign' ? found : undefined;
  const floor = building ? groundFloor(building.id) : undefined;
  const entrance =
    floor?.entrances.find((e) => e.id === nav.entrance) ??
    floor?.entrances.find((e) => e.isDefault) ??
    floor?.entrances[0];
  const resolved = floor && nav.room ? resolveRoom(floor, nav.room) : null;
  const roomNumber = resolved ? (resolved.unplaced?.number ?? resolved.room.number) : null;

  /* ── Маршруты ── */
  const campus = useMemo(
    () =>
      building && nav.gate
        ? routeToDoors(nav.gate, targetDoors(building, entrance?.campusDoorId))
        : null,
    [building, nav.gate, entrance],
  );
  const targetRoom = resolved?.room;
  const inside = useMemo(
    () => (floor && entrance && targetRoom ? floorRoute(floor, entrance.id, targetRoom) : null),
    [floor, entrance, targetRoom],
  );

  /* ── GPS ── */
  const userPosition = locate.status === 'done' ? locate.position : null;
  const nearest = userPosition ? nearestGate(userPosition, GATES) : null;
  const far = nearest && nearest.distance > NEAR_CAMPUS_RADIUS_M ? nearest : null;

  useEffect(() => {
    if (nearest && nearest.distance <= NEAR_CAMPUS_RADIUS_M) setNav({ gate: nearest.gate.id });
    // Срабатывает на каждое новое определение места, не на каждый рендер.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locate]);

  /* ── Действия ── */
  const selectItem = (item: SearchItem) => {
    setQuery('');
    if (item.kind === 'building') setNav({ buildingId: item.id, room: null, view: 'map' });
    else setNav({ buildingId: item.buildingId, room: item.number, view: 'map' });
  };
  const selectBuilding = useCallback(
    (id: string) => {
      setQuery('');
      setNav({ buildingId: id, room: null, view: 'map' });
    },
    [setNav],
  );
  const openFloor = () => {
    setPicked(null);
    setServiceTapped(false);
    setNav({ view: 'floor' }, { push: true });
  };
  const routeHere = (number: string) => {
    setPicked(null);
    setNav({ room: number });
  };

  const padding: MapPadding = desktop
    ? { top: 16, right: 0, bottom: 0, left: 380 }
    : { top: TOP_BAR_PX, right: 0, bottom: sheetPx, left: 0 };

  /* ── Экран плана этажа ── */
  if (nav.view === 'floor' && floor && building && entrance) {
    const pickedRoom = picked ? floor.rooms.find((r) => r.number === picked) : undefined;
    const info: FloorInfo = pickedRoom
      ? { kind: 'picked', room: pickedRoom }
      : serviceTapped
        ? { kind: 'service' }
        : resolved && inside
          ? { kind: 'route', resolved, route: inside }
          : { kind: 'hint' };
    return (
      <FloorScreen
        key={`${floor.buildingId}-${floor.level}`}
        floor={floor}
        title={ru.floorTitle(building.label, floor.level)}
        entranceId={entrance.id}
        info={info}
        selectedRoom={resolved?.room.number ?? null}
        pickedRoom={picked}
        onEntrance={(id) => setNav({ entrance: id })}
        onRoomClick={(n) => {
          setServiceTapped(false);
          setPicked(n === resolved?.room.number ? null : n);
        }}
        onServiceClick={() => {
          setPicked(null);
          setServiceTapped(true);
        }}
        onRouteHere={routeHere}
        onBack={() => setNav({ view: 'map' })}
      />
    );
  }

  /* ── Экран карты ── */
  const gate = nav.gate ? getGate(nav.gate) : undefined;
  const meters = campus ? roundMeters(campus.length) : null;
  const toLabel = building
    ? roomNumber
      ? ru.roomTarget(building.label, roomNumber)
      : building.label
    : '';

  const peek = building ? (
    <RoutePanel
      from={gate?.name ?? null}
      to={toLabel}
      meters={meters}
      minutes={campus ? walkMinutes(campus.length) : null}
      onClear={() => setNav({ buildingId: null, room: null, view: 'map' })}
    />
  ) : (
    <SearchBar index={SEARCH_INDEX} query={query} onQueryChange={setQuery} onSelect={selectItem} />
  );

  return (
    <div className={styles.app}>
      <MapView
        apiKey={DGIS_KEY}
        view={MAP_VIEW}
        buildings={BUILDINGS}
        doors={DOORS}
        gates={GATES}
        route={campus?.path ?? null}
        activeGateId={nav.gate}
        activeDoorId={campus?.doorId ?? null}
        userPosition={userPosition}
        padding={padding}
        reducedMotion={reducedMotion}
        onBuildingSelect={selectBuilding}
      />

      <header className={styles.top}>
        <div className={styles.brand}>
          <span className={styles.logo} aria-hidden="true" />
          <span>{ru.appTitle}</span>
        </div>
      </header>

      <BottomSheet
        peek={peek}
        desktop={desktop}
        expandKey={`${nav.buildingId}-${nav.room}`}
        onVisibleHeight={setSheetPx}
      >
        {!building && !query && (
          <QuickPicks
            buildings={BUILDINGS}
            onBuilding={selectBuilding}
            onLibraries={() => setQuery(ru.quickLibrariesQuery)}
          />
        )}

        {building && (
          <>
            <GatePicker
              gates={GATES}
              value={nav.gate}
              onChange={(id) => {
                resetLocate();
                setNav({ gate: id });
              }}
              onLocate={requestLocate}
              locating={locate.status === 'locating'}
            />

            {locate.status === 'unsupported' && <p className={styles.note}>{ru.geoUnsupported}</p>}
            {locate.status === 'error' && (
              <p className={styles.note}>{ru.geoError(locate.message)}</p>
            )}
            {far && (
              <div className={styles.far} role="status">
                <div className={styles.farHead}>
                  <strong>{ru.farTitle((far.distance / 1000).toFixed(1))}</strong>
                  <button
                    type="button"
                    className={styles.farClose}
                    onClick={resetLocate}
                    aria-label={ru.close}
                  >
                    ×
                  </button>
                </div>
                <p>{ru.farText(far.gate.name)}</p>
                <a
                  className={styles.farLink}
                  href={dgisDirectionsUrl(far.gate.at, userPosition ?? undefined)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {ru.farLink}
                </a>
              </div>
            )}

            {floor && building.doorChosenByUser && entrance && (
              <EntrancePicker
                entrances={floor.entrances}
                value={entrance.id}
                onChange={(id) => setNav({ entrance: id })}
              />
            )}

            {floor && (
              <button type="button" className={styles.next} onClick={openFloor}>
                {roomNumber ? ru.nextToRoom(roomNumber) : ru.openFloor(floor.level)}
              </button>
            )}
          </>
        )}
      </BottomSheet>
    </div>
  );
}
