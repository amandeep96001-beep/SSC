import { useMemo, useState, useEffect, useId, useRef } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { daysUntil } from '@/shared/examProfiles';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEAR_SPAN = 8; // current year … +7

function formatLong(iso) {
  if (!iso) return '';
  try {
    const [y, m, d] = iso.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function toIso(year, monthIndex, day) {
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function parseIso(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return { year: y, month: m - 1, day: d };
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function buildMonthCells(year, monthIndex) {
  const first = new Date(year, monthIndex, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells = [];

  for (let i = 0; i < startPad; i += 1) {
    cells.push({ type: 'pad', key: `pad-${i}` });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ type: 'day', key: `d-${day}`, day, iso: toIso(year, monthIndex, day) });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ type: 'pad', key: `pad-end-${cells.length}` });
  }
  return cells;
}

/** Compact exam date field + lightweight calendar popover */
export function ExamDatePicker({
  value = '',
  onChange,
  accent = 'var(--color-primary)',
  examName = 'Exam',
}) {
  const labelId = useId();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);

  const left = useMemo(() => daysUntil(value), [value]);
  const today = useMemo(() => startOfToday(), []);
  const todayIso = useMemo(
    () => toIso(today.getFullYear(), today.getMonth(), today.getDate()),
    [today]
  );

  const initial = parseIso(value);
  const [viewYear, setViewYear] = useState(() => initial?.year ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => initial?.month ?? today.getMonth());

  useEffect(() => {
    const parsed = parseIso(value);
    if (!parsed) return;
    setViewYear(parsed.year);
    setViewMonth(parsed.month);
  }, [value]);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const cells = useMemo(() => buildMonthCells(viewYear, viewMonth), [viewYear, viewMonth]);
  const yearOptions = useMemo(() => {
    const start = today.getFullYear();
    return Array.from({ length: YEAR_SPAN }, (_, i) => start + i);
  }, [today]);

  const canGoPrev = useMemo(() => {
    const prev = new Date(viewYear, viewMonth, 1);
    const floor = new Date(today.getFullYear(), today.getMonth(), 1);
    return prev > floor;
  }, [viewYear, viewMonth, today]);

  const shiftMonth = (delta) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    const floor = new Date(today.getFullYear(), today.getMonth(), 1);
    const max = new Date(today.getFullYear() + YEAR_SPAN - 1, 11, 1);
    if (next < floor || next > max) return;
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const onMonthChange = (monthIndex) => {
    const next = new Date(viewYear, monthIndex, 1);
    const floor = new Date(today.getFullYear(), today.getMonth(), 1);
    if (next < floor) {
      setViewYear(today.getFullYear());
      setViewMonth(today.getMonth());
      return;
    }
    setViewMonth(monthIndex);
  };

  const onYearChange = (year) => {
    const nextMonth =
      year === today.getFullYear() && viewMonth < today.getMonth()
        ? today.getMonth()
        : viewMonth;
    setViewYear(year);
    setViewMonth(nextMonth);
  };

  const selectDay = (iso) => {
    if (iso < todayIso) return;
    onChange?.(iso);
    setOpen(false);
  };

  const monthDisabled = (monthIndex) =>
    viewYear === today.getFullYear() && monthIndex < today.getMonth();

  return (
    <div className="edp-simple" style={{ '--edp-accent': accent }} ref={rootRef}>
      <div className="edp-simple__top">
        <div className="edp-simple__icon" aria-hidden>
          <CalendarDays size={20} />
        </div>
        <div className="edp-simple__copy">
          <h3 id={labelId}>{examName} date</h3>
          <p>Set your exam date to track the countdown.</p>
        </div>
      </div>

      <div className="edp-simple__field">
        <span>Exam date</span>
        <div className="edp-simple__input-row">
          <button
            type="button"
            className={`edp-simple__trigger${open ? ' is-open' : ''}`}
            aria-labelledby={labelId}
            aria-expanded={open}
            aria-haspopup="dialog"
            onClick={() => setOpen((v) => !v)}
          >
            <CalendarDays size={16} aria-hidden />
            <span>{value ? formatLong(value) : 'Select date'}</span>
          </button>
          {value && (
            <button
              type="button"
              className="edp-simple__clear"
              onClick={() => {
                onChange?.('');
                setOpen(false);
              }}
              aria-label="Clear date"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {open && (
          <div className="edp-cal" role="dialog" aria-label="Choose exam date">
            <div className="edp-cal__toolbar">
              <button
                type="button"
                className="edp-cal__nav"
                onClick={() => shiftMonth(-1)}
                disabled={!canGoPrev}
                aria-label="Previous month"
              >
                <ChevronLeft size={14} />
              </button>

              <div className="edp-cal__selects">
                <label className="edp-cal__select-wrap">
                  <span className="sr-only">Month</span>
                  <select
                    className="edp-cal__select"
                    value={viewMonth}
                    onChange={(e) => onMonthChange(Number(e.target.value))}
                    aria-label="Month"
                  >
                    {MONTHS.map((name, i) => (
                      <option key={name} value={i} disabled={monthDisabled(i)}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="edp-cal__select-wrap">
                  <span className="sr-only">Year</span>
                  <select
                    className="edp-cal__select edp-cal__select--year"
                    value={viewYear}
                    onChange={(e) => onYearChange(Number(e.target.value))}
                    aria-label="Year"
                  >
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <button
                type="button"
                className="edp-cal__nav"
                onClick={() => shiftMonth(1)}
                disabled={viewYear === today.getFullYear() + YEAR_SPAN - 1 && viewMonth === 11}
                aria-label="Next month"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="edp-cal__weekdays" aria-hidden>
              {WEEKDAYS.map((d, i) => (
                <span key={`${d}-${i}`}>{d}</span>
              ))}
            </div>

            <div className="edp-cal__grid" role="grid">
              {cells.map((cell) => {
                if (cell.type === 'pad') {
                  return <span key={cell.key} className="edp-cal__pad" />;
                }
                const isPast = cell.iso < todayIso;
                const isToday = cell.iso === todayIso;
                const isSelected = cell.iso === value;
                return (
                  <button
                    key={cell.key}
                    type="button"
                    role="gridcell"
                    className={[
                      'edp-cal__day',
                      isToday ? 'is-today' : '',
                      isSelected ? 'is-selected' : '',
                    ].filter(Boolean).join(' ')}
                    disabled={isPast}
                    aria-pressed={isSelected}
                    aria-label={formatLong(cell.iso)}
                    onClick={() => selectDay(cell.iso)}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="edp-simple__countdown">
        {!value && <p className="edp-simple__muted">Add a date to see days remaining.</p>}
        {value && left != null && left < 0 && (
          <p className="edp-simple__muted">This date has passed. Choose a new exam date.</p>
        )}
        {value && left === 0 && (
          <p className="edp-simple__big">Exam is <strong>today</strong> — all the best!</p>
        )}
        {value && left > 0 && (
          <>
            <p className="edp-simple__big">
              <strong>{left}</strong> day{left === 1 ? '' : 's'} left
            </p>
            <p className="edp-simple__muted">{formatLong(value)}</p>
          </>
        )}
      </div>
    </div>
  );
}
