import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { ru } from '../../i18n/ru';
import styles from './BottomSheet.module.css';

interface Props {
  /** Верх шторки, виден и в свёрнутом положении. */
  peek: ReactNode;
  children: ReactNode;
  /** На компьютере шторка становится колонкой слева и не тянется. */
  desktop: boolean;
  /** При изменении этого значения шторка разворачивается. */
  expandKey?: string;
  /** Сколько пикселей снизу занимает шторка (для отступа карты). */
  onVisibleHeight: (px: number) => void;
}

const TAP_SLOP = 6;

/** Нижняя шторка с двумя положениями: свёрнута / развёрнута. Тянется за ручку. */
export function BottomSheet({ peek, children, desktop, expandKey, onVisibleHeight }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const peekRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(true);
  const [drag, setDrag] = useState<number | null>(null);
  const [size, setSize] = useState({ full: 0, peek: 0 });
  const startY = useRef(0);
  const dragged = useRef(false);

  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    const peekEl = peekRef.current;
    if (!sheet || !peekEl) return;
    const measure = () => {
      const s = sheet.getBoundingClientRect();
      const p = peekEl.getBoundingClientRect();
      setSize({ full: s.height, peek: Math.min(s.height, p.bottom - s.top + 12) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(sheet);
    ro.observe(peekEl);
    if (bodyRef.current) ro.observe(bodyRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (expandKey !== undefined) setExpanded(true);
  }, [expandKey]);

  const collapsedY = Math.max(0, size.full - size.peek);
  const baseY = desktop || expanded ? 0 : collapsedY;
  const y = drag === null ? baseY : Math.min(Math.max(baseY + drag, 0), collapsedY);

  useEffect(() => {
    onVisibleHeight(desktop ? 0 : Math.round(size.full - baseY));
  }, [desktop, size.full, baseY, onVisibleHeight]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.inert = !desktop && !expanded;
    if (!expanded && scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [desktop, expanded]);

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    startY.current = e.clientY;
    dragged.current = false;
    setDrag(0);
  };
  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (drag === null) return;
    const dy = e.clientY - startY.current;
    if (Math.abs(dy) > TAP_SLOP) dragged.current = true;
    setDrag(dy);
  };
  const onPointerUp = () => {
    if (drag === null) return;
    if (dragged.current) setExpanded(baseY + drag < collapsedY / 2);
    setDrag(null);
  };
  const onClick = () => {
    if (dragged.current) {
      dragged.current = false;
      return;
    }
    setExpanded((v) => !v);
  };

  return (
    <div
      ref={sheetRef}
      className={`${styles.sheet} ${drag !== null ? styles.dragging : ''}`}
      style={desktop ? undefined : { transform: `translateY(${y}px)` }}
    >
      {!desktop && (
        <button
          type="button"
          className={styles.handle}
          aria-label={ru.sheetToggle}
          aria-expanded={expanded}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClick={onClick}
        >
          <span className={styles.grip} />
        </button>
      )}
      <div ref={scrollRef} className={styles.scroll}>
        <div ref={peekRef}>{peek}</div>
        <div ref={bodyRef} className={styles.body}>
          {children}
        </div>
      </div>
    </div>
  );
}
