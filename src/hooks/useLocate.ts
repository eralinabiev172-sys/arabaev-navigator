import { useCallback, useState } from 'react';
import type { LngLat } from '../types';

export type LocateState =
  | { status: 'idle' }
  | { status: 'locating' }
  | { status: 'unsupported' }
  | { status: 'error'; message: string }
  | { status: 'done'; position: LngLat; at: number };

/** Однократный запрос GPS: высокая точность, таймаут 10 с. */
export function useLocate(): [LocateState, () => void, () => void] {
  const [state, setState] = useState<LocateState>({ status: 'idle' });

  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setState({ status: 'unsupported' });
      return;
    }
    setState({ status: 'locating' });
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setState({
          status: 'done',
          position: [pos.coords.longitude, pos.coords.latitude],
          at: Date.now(),
        }),
      (err) => setState({ status: 'error', message: err.message }),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  const reset = useCallback(() => setState({ status: 'idle' }), []);
  return [state, locate, reset];
}
