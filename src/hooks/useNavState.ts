import { useCallback, useEffect, useRef, useState } from 'react';
import { formatHash, parseHash, type NavState } from '../lib/hashState';

/**
 * Состояние маршрута, синхронизированное с адресом страницы.
 * push: true — новая запись в истории (кнопка «Назад» вернёт на шаг назад).
 */
export function useNavState(): [
  NavState,
  (patch: Partial<NavState>, opts?: { push?: boolean }) => void,
] {
  const [state, setState] = useState<NavState>(() => parseHash(window.location.hash));
  const stateRef = useRef(state);

  useEffect(() => {
    const sync = () => {
      stateRef.current = parseHash(window.location.hash);
      setState(stateRef.current);
    };
    window.addEventListener('hashchange', sync);
    window.addEventListener('popstate', sync);
    return () => {
      window.removeEventListener('hashchange', sync);
      window.removeEventListener('popstate', sync);
    };
  }, []);

  const update = useCallback((patch: Partial<NavState>, opts?: { push?: boolean }) => {
    const next = { ...stateRef.current, ...patch };
    const url = formatHash(next) || window.location.pathname + window.location.search;
    if (opts?.push) window.history.pushState(null, '', url);
    else window.history.replaceState(null, '', url);
    stateRef.current = next;
    setState(next);
  }, []);

  return [state, update];
}
