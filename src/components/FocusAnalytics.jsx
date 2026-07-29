/**
 * FocusAnalytics.jsx — Weekly focus bar chart + stats (Stitch "Card C")
 * Derives data from completed tasks in the store.
 */

import { useMemo } from 'react';
import { useAppState } from '../store.jsx';

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export default function FocusAnalytics() {
  const state = useAppState();
  const tasks = (state.tasks || []).filter(t => t && typeof t === 'object');

  // Aggregate time estimates per weekday for completed tasks
  const weekData = useMemo(() => {
    const today = new Date();
    const todayDow = today.getDay(); // 0=Sun … 6=Sat
    // Build an array indexed Mon→Sun
    const buckets = new Array(7).fill(0);
    tasks.forEach(t => {
      if (!t.completed || !t.completedAt) return;
      const d = new Date(t.completedAt);
      const dow = (d.getDay() + 6) % 7; // shift so Mon=0
      buckets[dow] += t.timeEstimate?.minutes || 30;
    });
    // Highlight today (Mon=0 … Sun=6)
    const todayIdx = (todayDow + 6) % 7;
    return buckets.map((mins, i) => ({
      label: DAY_LABELS[i],
      mins,
      isToday: i === todayIdx,
    }));
  }, [tasks]);

  const maxMins   = Math.max(...weekData.map(d => d.mins), 60);
  const todayMins = weekData.find(d => d.isToday)?.mins || 0;
  const totalHrs  = (weekData.reduce((s, d) => s + d.mins, 0) / 60).toFixed(1);
  const completed = tasks.filter(t => t.completed).length;
  const total     = tasks.length;
  const ratio     = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="bento-card flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="material-symbols-outlined text-[#630ed4]">monitoring</span>
        <h3 className="text-[20px] font-semibold font-headline">Focus Analytics</h3>
      </div>

      {/* Bar chart */}
      <div className="flex items-end justify-between gap-2 mb-6" style={{ height: '12rem' }}>
        {weekData.map(({ label, mins, isToday }) => {
          const heightPct = maxMins > 0 ? Math.round((mins / maxMins) * 100) : 5;
          return (
            <div key={label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <div className="w-full bg-[#f0f3ff] rounded-t-lg relative flex-1 max-h-[160px]">
                <div
                  className={[
                    'absolute bottom-0 w-full rounded-t-lg transition-all duration-500',
                    isToday
                      ? 'bg-[#630ed4] shadow-lg shadow-[#630ed4]/20'
                      : 'bg-[#630ed4]/35 hover:bg-[#630ed4]/60',
                  ].join(' ')}
                  style={{ height: `${heightPct}%` }}
                  title={`${(mins / 60).toFixed(1)}h`}
                />
              </div>
              <span className={[
                'text-[10px] font-bold',
                isToday ? 'text-[#630ed4]' : 'text-[#4a4455]',
              ].join(' ')}>
                {isToday ? 'TODAY' : label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Stat pills */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-[#f0f3ff] rounded-xl">
          <p className="text-[10px] uppercase font-bold text-[#4a4455]">Total Hours</p>
          <p className="text-xl font-bold text-[#111c2d]">{totalHrs}h</p>
        </div>
        <div className="p-3 bg-[#f0f3ff] rounded-xl">
          <p className="text-[10px] uppercase font-bold text-[#4a4455]">Task Ratio</p>
          <p className="text-xl font-bold text-[#630ed4]">{ratio}%</p>
        </div>
        <div className="p-3 bg-[#f0f3ff] rounded-xl col-span-2">
          <p className="text-[10px] uppercase font-bold text-[#4a4455]">Today's Focus</p>
          <p className="text-xl font-bold text-[#111c2d]">{(todayMins / 60).toFixed(1)}h</p>
        </div>
      </div>
    </div>
  );
}
