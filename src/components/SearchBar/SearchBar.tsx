import { useId, useMemo, useState, type KeyboardEvent } from 'react';
import { search, type SearchIndex, type SearchItem } from '../../lib/search';
import { ru } from '../../i18n/ru';
import styles from './SearchBar.module.css';

interface Props {
  index: SearchIndex;
  query: string;
  onQueryChange: (q: string) => void;
  onSelect: (item: SearchItem) => void;
}

export function SearchBar({ index, query, onQueryChange, onSelect }: Props) {
  const id = useId();
  const listId = `${id}-list`;
  const results = useMemo(() => search(index, query), [index, query]);
  const [active, setActive] = useState(0);
  const open = query.trim().length > 0;

  const choose = (item: SearchItem | undefined) => {
    if (item) onSelect(item);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(results[active]);
    } else if (e.key === 'Escape') {
      onQueryChange('');
    }
  };

  return (
    <div className={styles.wrap}>
      <label htmlFor={id} className={styles.label}>
        {ru.searchLabel}
      </label>
      <div className={styles.field}>
        <svg className={styles.icon} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          id={id}
          className={styles.input}
          type="search"
          inputMode="search"
          autoComplete="off"
          enterKeyHint="go"
          placeholder={ru.searchPlaceholder}
          value={query}
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && results[active] ? `${listId}-${active}` : undefined}
          onChange={(e) => {
            setActive(0);
            onQueryChange(e.target.value);
          }}
          onKeyDown={onKeyDown}
        />
        {query && (
          <button
            type="button"
            className={styles.clear}
            onClick={() => onQueryChange('')}
            aria-label={ru.searchClear}
          >
            ×
          </button>
        )}
      </div>
      {open && (
        <ul id={listId} role="listbox" className={styles.list} aria-label={ru.searchLabel}>
          {results.length === 0 && <li className={styles.empty}>{ru.searchEmpty}</li>}
          {results.map((item, i) => (
            <li
              key={item.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              className={styles.option}
              onPointerEnter={() => setActive(i)}
              onClick={() => choose(item)}
            >
              <ResultText item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ResultText({ item }: { item: SearchItem }) {
  if (item.kind === 'building') {
    return <span className={styles.title}>{item.building.label}</span>;
  }
  return (
    <>
      <span className={styles.num}>{item.number}</span>
      <span className={styles.text}>
        <span className={styles.title}>{item.name}</span>
        <span className={styles.sub}>
          {ru.searchFloor(item.buildingLabel, item.level)}
          {item.approximate && ` · ${ru.searchApproximate}`}
        </span>
      </span>
    </>
  );
}
