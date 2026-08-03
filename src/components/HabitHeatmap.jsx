/**
 * HabitHeatmap.jsx — GitHub-Style 12-Week Productivity Heatmap
 *
 * Renders a 7-row × 12-column grid (84 days) where each cell represents one day.
 * Color intensity is based on tasksCompleted from the history state.
 * Hovering shows a tooltip with the date and completion count.
 */

import { useState, useMemo } from 'react';
import { useAppState } from '../store.jsx';

// Generate 84 day date strings ending today
function generateGrid() {
  const days = [];
  const today = new Date();
  for (let i = 83; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days; // array of 84 ISO date strings, oldest → newest
}

// Color intensity ramp (dark mode, violet-based)
function getCellColor(count) {
  if (!count || count === 0)
    return 'var(--heatmap-empty, rgba(139,92,246,0.06))';
  if (count >= 10) return 'rgba(139,92,246,1)';
  if (count >= 7) return 'rgba(139,92,246,0.80)';
  if (count >= 4) return 'rgba(139,92,246,0.55)';
  if (count >= 2) return 'rgba(139,92,246,0.32)';
  return 'rgba(139,92,246,0.16)';
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export default function HabitHeatmap() {
  const state = useAppState();
  const history = useMemo(() => state.history || [], [state.history]);
  const [tooltip, setTooltip] = useState(null); // { date, count, x, y }

  // Build a lookup map: dateString → tasksCompleted
  const scoreMap = useMemo(() => {
    const map = {};
    history.forEach((h) => {
      map[h.date] = h.tasksCompleted || 0;
    });
    return map;
  }, [history]);

  const grid = useMemo(() => generateGrid(), []);

  // Split into 12 columns of 7 days each
  const weeks = useMemo(() => {
    const cols = [];
    for (let c = 0; c < 12; c++) {
      cols.push(grid.slice(c * 7, c * 7 + 7));
    }
    return cols;
  }, [grid]);

  // Month labels: detect when month changes across the columns
  const monthLabels = useMemo(() => {
    return weeks.map((week) => {
      const first = new Date(week[0] + 'T00:00:00');
      return MONTH_SHORT[first.getMonth()];
    });
  }, [weeks]);

  function handleCellEnter(e, dateStr, count) {
    const d = new Date(dateStr + 'T00:00:00');
    const label = d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'long',
      day: 'numeric',
    });
    setTooltip({ date: label, count, x: e.clientX, y: e.clientY });
  }

  const totalDone = history.reduce((s, h) => s + (h.tasksCompleted || 0), 0);
  const activeDays = history.filter((h) => (h.tasksCompleted || 0) > 0).length;

  return (
    <div className="heatmap-wrapper">
      <div className="heatmap-meta">
        <span className="heatmap-title">📅 Activity Heatmap</span>
        <span className="heatmap-subtitle">
          {totalDone} tasks completed · {activeDays} active days
        </span>
      </div>

      <div className="heatmap-scroll">
        {/* Day labels column */}
        <div className="heatmap-day-labels" aria-hidden="true">
          {DAY_LABELS.map((d) => (
            <span key={d} className="heatmap-day-label">
              {d}
            </span>
          ))}
        </div>

        {/* Grid */}
        <div
          className="heatmap-grid"
          role="grid"
          aria-label="84-day activity heatmap"
        >
          {/* Month header row */}
          <div className="heatmap-month-row" aria-hidden="true">
            {monthLabels.map((m, i) => (
              <span key={i} className="heatmap-month-label">
                {m}
              </span>
            ))}
          </div>

          {/* Cell columns */}
          <div className="heatmap-columns">
            {weeks.map((week, ci) => (
              <div key={ci} className="heatmap-col">
                {week.map((dateStr) => {
                  const count = scoreMap[dateStr] || 0;
                  const isToday =
                    dateStr === new Date().toISOString().split('T')[0];
                  return (
                    <div
                      key={dateStr}
                      role="gridcell"
                      aria-label={`${dateStr}: ${count} tasks`}
                      className={`heatmap-cell${isToday ? ' today' : ''}`}
                      style={{ background: getCellColor(count) }}
                      onMouseEnter={(e) => handleCellEnter(e, dateStr, count)}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="heatmap-legend" aria-hidden="true">
        <span className="heatmap-legend-label">Less</span>
        {[0, 1, 2, 4, 7, 10].map((n) => (
          <div
            key={n}
            className="heatmap-legend-cell"
            style={{ background: getCellColor(n) }}
          />
        ))}
        <span className="heatmap-legend-label">More</span>
      </div>

      {/* Tooltip portal (fixed position) */}
      {tooltip && (
        <div
          className="heatmap-tooltip"
          style={{ left: tooltip.x + 12, top: tooltip.y - 40 }}
          role="tooltip"
        >
          <strong>{tooltip.date}</strong>
          <span>
            {tooltip.count > 0
              ? `${tooltip.count} task${tooltip.count === 1 ? '' : 's'} completed`
              : 'No activity'}
          </span>
        </div>
      )}
    </div>
  );
}
