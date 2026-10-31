import type { Building, Door, Gate } from '../../types';
import { ru } from '../../i18n/ru';
import styles from './MapView.module.css';

/** HTML-элементы меток для mapgl.HtmlMarker. Только разметка, без логики карты. */

export function buildingPin(b: Building, onSelect: (id: string) => void): HTMLElement {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = `${styles.pin} ${styles[b.kind] ?? ''}`;
  el.textContent = b.label;
  if (b.kind === 'foreign') {
    el.setAttribute('aria-label', `${b.label}. ${ru.foreignHint}`);
    el.addEventListener('click', () => flashHint(el, ru.foreignHint));
  } else {
    el.addEventListener('click', () => onSelect(b.id));
  }
  return el;
}

export function doorDot(d: Door, buildingLabel: string): HTMLElement {
  const el = document.createElement('div');
  el.className = `${styles.door} ${d.inactive ? styles.doorInactive : ''}`;
  el.title = d.inactive ? ru.gymHint : ru.doorTitle(buildingLabel);
  if (d.inactive) el.addEventListener('click', () => flashHint(el, ru.gymHint));
  return el;
}

export function gatePin(g: Gate): HTMLElement {
  const el = document.createElement('div');
  el.className = styles.gate ?? '';
  el.textContent = g.short;
  return el;
}

export function userDot(): HTMLElement {
  const el = document.createElement('div');
  el.className = styles.me ?? '';
  return el;
}

/** Короткая всплывающая подсказка над меткой. */
function flashHint(el: HTMLElement, text: string): void {
  el.querySelector(`.${styles.hint}`)?.remove();
  const hint = document.createElement('span');
  hint.className = styles.hint ?? '';
  hint.setAttribute('role', 'status');
  hint.textContent = text;
  el.appendChild(hint);
  window.setTimeout(() => hint.remove(), 3000);
}
