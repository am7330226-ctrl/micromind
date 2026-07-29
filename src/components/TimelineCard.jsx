/**
 * TimelineCard.jsx — Today's task timeline (Stitch "Card D")
 * Shows completed + upcoming tasks as a vertical timeline.
 * Upcoming tasks are rendered at 50% opacity.
 */

import { useMemo } from 'react';
import { useAppState } from '../store.jsx';

// Color coding per priority quadrant
const PRIORITY_META = {
  urgent:    { color: '#a04100', bg: 'bg-[#a04100]/5', border: 'border-[#a04100]',  dot: 'bg-[#a04100]',  ring: 'ring-[#a04100]/20',  badge: 'bg-[#a04100]/10 text-[#a04100]', label: 'Do First'    },
  important: { color: '#630ed4', bg: 'bg-[#630ed4]/5', border: 'border-[#630ed4]',  dot: 'bg-[#630ed4]',  ring: 'ring-[#630ed4]/20',  badge: 'bg-[#630ed4]/10 text-[#630ed4]', label: 'Schedule'    },
  delegate:  { color: '#005b3d', bg: 'bg-[#005b3d]/5', border: 'border-[#005b3d]',  dot: 'bg-[#005b3d]',  ring: 'ring-[#005b3d]/20',  badge: 'bg-[#005b3d]/10 text-[#005b3d]', label: 'Delegate'    },
  inbox:     { color: '#4a4455', bg: 'bg-[#e7eeff]',   border: 'border-[#ccc3d8]',  dot: 'bg-[#ccc3d8]',  ring: '',                    badge: 'bg-[#e7eeff] text-[#4a4455]',    label: 'Inbox'       },
  eliminate: { color: '#4a4455', bg: 'bg-[#e7eeff]',   border: 'border-[#ccc3d8]',  dot: 'bg-[#ccc3d8]',  ring: '',                    badge: 'bg-[#e7eeff] text-[#4a4455]',    label: 'Avoid'       },
};

function formatTime(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function TimelineCard() {
  const state = useAppState();
  const tasks = (state.tasks || []).filter(t => t && typeof t === 'object');

  const entries = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    const completed = tasks
      .filter(t => t.completed && t.completedAt?.startsWith(todayStr))
      .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));

    const upcoming = tasks
      .filter(t => !t.completed)
      .slice(0, 4);

    return [...completed, ...upcoming].slice(0, 8);
  }, [tasks]);

  // Placeholder entries if the user has no tasks yet
  const PLACEHOLDER = [
    { id: 'p1', text: 'Deep Work: UI Design',      priority: 'important', completed: true,  completedAt: new Date(Date.now() - 4 * 3600000).toISOString() },
    { id: 'p2', text: 'Team Strategy Sync',        priority: 'urgent',    completed: true,  completedAt: new Date(Date.now() - 2 * 3600000).toISOString() },
    { id: 'p3', text: 'Digital Detox Break 🌿',   priority: 'delegate',  completed: true,  completedAt: new Date(Date.now() - 1 * 3600000).toISOString() },
    { id: 'p4', text: 'Draft Newsletter',          priority: 'inbox',     completed: false, completedAt: null },
  ];

  const display = entries.length > 0 ? entries : PLACEHOLDER;

  return (
    <div className="bento-card flex flex-col overflow-hidden" style={{ height: '500px' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 shrink-0">
        <span className="material-symbols-outlined text-[#630ed4]">view_timeline</span>
        <h3 className="text-[20px] font-semibold font-headline">Today's Timeline</h3>
      </div>

      {/* Scrollable timeline */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-6 relative">
        {/* Vertical line */}
        <div className="absolute left-[43px] top-0 bottom-0 w-px bg-[#e7eeff] border-l border-dashed border-[#ccc3d8]" />

        {display.map((task, idx) => {
          const meta = PRIORITY_META[task.priority] || PRIORITY_META.inbox;
          const upcoming = !task.completed;
          return (
            <div key={task.id || idx} className={['flex gap-4 relative', upcoming ? 'opacity-50' : ''].join(' ')}>
              {/* Time label */}
              <div className="w-10 text-right shrink-0 pt-1">
                <p className="text-[12px] font-bold text-[#4a4455] leading-none">
                  {formatTime(task.completedAt) || '—'}
                </p>
              </div>

              {/* Dot */}
              <div className={[
                'w-4 h-4 rounded-full border-4 border-white z-10 mt-1 shrink-0 ring-2',
                meta.dot,
                meta.ring,
              ].join(' ')} />

              {/* Card */}
              <div className={[
                'flex-1 border-l-4 p-3 rounded-r-2xl',
                meta.bg,
                meta.border,
              ].join(' ')}>
                <h4 className="text-[14px] font-medium text-[#111c2d] leading-snug">{task.text}</h4>
                {task.priority && (
                  <span className={[
                    'inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-tight',
                    meta.badge,
                  ].join(' ')}>
                    {meta.label}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {entries.length === 0 && (
          <p className="text-center text-[#4a4455]/50 text-sm pt-20">
            Complete tasks to see your timeline!
          </p>
        )}
      </div>
    </div>
  );
}
