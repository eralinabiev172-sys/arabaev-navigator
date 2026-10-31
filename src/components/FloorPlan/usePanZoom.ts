import { useCallback, useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react';

type ViewBox = [number, number, number, number];

const DRAG_SLOP = 6;

/**
 * Масштаб и сдвиг SVG через viewBox: один палец — двигать, два — масштабировать,
 * колесо мыши — масштаб вокруг курсора. wasDrag() нужен, чтобы после перетаскивания
 * не срабатывало нажатие на кабинет.
 */
export function usePanZoom(svgRef: RefObject<SVGSVGElement>, initial: ViewBox) {
  const [vb, setVb] = useState<ViewBox>(initial);
  const vbRef = useRef(vb);
  const pointers = useRef(new Map<number, [number, number]>());
  const pinch = useRef<{ dist: number; width: number } | null>(null);
  const moved = useRef(0);
  const [minW, maxW] = [initial[2] / 6, initial[2] * 1.4];
  const aspect = initial[3] / initial[2];

  const apply = useCallback((next: ViewBox) => {
    vbRef.current = next;
    setVb(next);
  }, []);

  const fit = useCallback(() => apply(initial), [apply, initial]);

  /** Пиксели экрана → единицы плана (с учётом preserveAspectRatio="xMidYMid meet"). */
  const unitsPerPx = useCallback(() => {
    const r = svgRef.current?.getBoundingClientRect();
    const [, , w, h] = vbRef.current;
    return r && r.width && r.height ? Math.max(w / r.width, h / r.height) : 1;
  }, [svgRef]);

  const toPlan = useCallback(
    (clientX: number, clientY: number): [number, number] => {
      const ctm = svgRef.current?.getScreenCTM();
      if (!ctm) return [0, 0];
      const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
      return [p.x, p.y];
    },
    [svgRef],
  );

  const zoomTo = useCallback(
    (width: number, center?: [number, number]) => {
      const [x, y, w, h] = vbRef.current;
      const nw = Math.min(maxW, Math.max(minW, width));
      const nh = nw * aspect;
      const [cx, cy] = center ?? [x + w / 2, y + h / 2];
      apply([cx - ((cx - x) * nw) / w, cy - ((cy - y) * nh) / h, nw, nh]);
    },
    [apply, aspect, maxW, minW],
  );

  const zoomBy = useCallback((f: number) => zoomTo(vbRef.current[2] * f), [zoomTo]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomTo(vbRef.current[2] * (1 + e.deltaY * 0.0015), toPlan(e.clientX, e.clientY));
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [svgRef, toPlan, zoomTo]);

  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    pointers.current.set(e.pointerId, [e.clientX, e.clientY]);
    if (pointers.current.size === 1) moved.current = 0;
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()] as [[number, number], [number, number]];
      pinch.current = { dist: Math.hypot(a[0] - b[0], a[1] - b[1]), width: vbRef.current[2] };
    }
  };

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const dx = e.clientX - prev[0];
    const dy = e.clientY - prev[1];
    moved.current += Math.abs(dx) + Math.abs(dy);
    pointers.current.set(e.pointerId, [e.clientX, e.clientY]);
    // Захват указателя — только когда начали тянуть, иначе click уйдёт не туда.
    if (moved.current > DRAG_SLOP && !e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }

    if (pointers.current.size === 1) {
      const k = unitsPerPx();
      const [x, y, w, h] = vbRef.current;
      apply([x - dx * k, y - dy * k, w, h]);
    } else if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()] as [[number, number], [number, number]];
      const dist = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (dist > 0) {
        const center = toPlan((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
        zoomTo((pinch.current.width * pinch.current.dist) / dist, center);
      }
    }
  };

  const onPointerUp = (e: PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  };

  const wasDrag = useCallback(() => moved.current > DRAG_SLOP, []);

  return {
    viewBox: vb.join(' '),
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
    zoomIn: () => zoomBy(0.75),
    zoomOut: () => zoomBy(1.33),
    fit,
    wasDrag,
  };
}
