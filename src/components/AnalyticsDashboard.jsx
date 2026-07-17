/**
 * AnalyticsDashboard.jsx — Slide-over analytics panel with custom canvas charts.
 * Renders a bar chart (tasks/day), doughnut (quadrant distribution),
 * and mood+productivity line chart — all drawn with the HTML5 Canvas API.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppState } from '../store.jsx';

const CHART_COLORS = {
  indigo:       '#4f46e5',
  indigoSoft:   'rgba(79,70,229,0.15)',
  emerald:      '#10b981',
  emeraldSoft:  'rgba(16,185,129,0.15)',
  amber:        '#f59e0b',
  amberSoft:    'rgba(245,158,11,0.15)',
  coral:        '#ef4444',
  coralSoft:    'rgba(239,68,68,0.15)',
  textMuted:    '#94a3b8',
  gridLine:     'rgba(0,0,0,0.06)',
};

function getHistoryForRange(history, days) {
  if (!history || history.length === 0) return [];
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  return history.filter(h => h.date >= cutoffStr).sort((a, b) => a.date.localeCompare(b.date));
}

function drawBarChart(canvas, history, days) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.offsetWidth || 500;
  const H = 240;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);

  const labels = [], data = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr  = d.toISOString().split('T')[0];
    const short    = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    labels.push(short);
    const entry = history.find(h => h.date === dateStr);
    data.push(entry ? entry.tasksCompleted : 0);
  }

  const pL=36, pR=12, pT=12, pB=36;
  const cW=W-pL-pR, cH=H-pT-pB;
  const maxVal = Math.max(...data, 1);
  const n = labels.length;
  const gap = Math.max(2, cW/n*0.3);
  const bW  = (cW - gap*(n+1)) / n;

  ctx.strokeStyle = CHART_COLORS.gridLine; ctx.lineWidth = 1;
  for (let i=0; i<=4; i++) {
    const y = pT+cH-(cH/4)*i;
    ctx.beginPath(); ctx.moveTo(pL,y); ctx.lineTo(W-pR,y); ctx.stroke();
    ctx.fillStyle = CHART_COLORS.textMuted;
    ctx.font = '10px Inter,sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(Math.round(maxVal/4*i), pL-6, y+3);
  }

  data.forEach((val,i) => {
    const x   = pL+gap+i*(bW+gap);
    const bH  = (val/maxVal)*cH;
    const y   = pT+cH-bH;
    const grad = ctx.createLinearGradient(x,y,x,pT+cH);
    grad.addColorStop(0, CHART_COLORS.indigo);
    grad.addColorStop(1, 'rgba(79,70,229,0.4)');
    ctx.fillStyle = grad;
    const r = Math.min(bW/2, 4);
    ctx.beginPath();
    ctx.moveTo(x, pT+cH);
    ctx.lineTo(x, y+r);
    ctx.quadraticCurveTo(x,y,x+r,y);
    ctx.lineTo(x+bW-r,y);
    ctx.quadraticCurveTo(x+bW,y,x+bW,y+r);
    ctx.lineTo(x+bW, pT+cH);
    ctx.closePath(); ctx.fill();
    if (val>0) {
      ctx.fillStyle=CHART_COLORS.indigo; ctx.font='bold 10px Inter,sans-serif';
      ctx.textAlign='center'; ctx.fillText(val, x+bW/2, y-4);
    }
    ctx.fillStyle=CHART_COLORS.textMuted; ctx.font='9px Inter,sans-serif';
    ctx.textAlign='center';
    if (days<=7 || i%Math.ceil(days/10)===0) ctx.fillText(labels[i], x+bW/2, H-6);
  });
}

function drawDoughnut(canvas, history) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.offsetWidth || 500;
  const H = 240;
  canvas.width  = W*dpr; canvas.height = H*dpr;
  canvas.style.width  = W+'px'; canvas.style.height = H+'px';
  ctx.scale(dpr, dpr);
  ctx.clearRect(0,0,W,H);

  const totals = { q1:0, q2:0, q3:0, q4:0 };
  history.forEach(h => {
    if (h.quadrantBreakdown) {
      totals.q1 += h.quadrantBreakdown.q1||0;
      totals.q2 += h.quadrantBreakdown.q2||0;
      totals.q3 += h.quadrantBreakdown.q3||0;
      totals.q4 += h.quadrantBreakdown.q4||0;
    }
  });

  const segs = [
    { label:'Do First',  value:totals.q1, color:CHART_COLORS.coral   },
    { label:'Schedule',  value:totals.q2, color:CHART_COLORS.indigo  },
    { label:'Delegate',  value:totals.q3, color:CHART_COLORS.amber   },
    { label:'Eliminate', value:totals.q4, color:CHART_COLORS.textMuted },
  ];
  const total = segs.reduce((s,sg)=>s+sg.value, 0);
  const cx=W*0.35, cy=H/2;
  const outerR=Math.min(cx,cy)-16, innerR=outerR*0.55;

  if (total===0) {
    ctx.beginPath(); ctx.arc(cx,cy,outerR,0,Math.PI*2);
    ctx.arc(cx,cy,innerR,0,Math.PI*2,true);
    ctx.fillStyle=CHART_COLORS.gridLine; ctx.fill();
    ctx.fillStyle=CHART_COLORS.textMuted; ctx.font='12px Inter,sans-serif';
    ctx.textAlign='center'; ctx.fillText('No data yet',cx,cy+4);
    return;
  }

  let angle = -Math.PI/2;
  segs.forEach(seg => {
    if (!seg.value) return;
    const slice = (seg.value/total)*Math.PI*2;
    ctx.beginPath(); ctx.arc(cx,cy,outerR,angle,angle+slice);
    ctx.arc(cx,cy,innerR,angle+slice,angle,true);
    ctx.closePath(); ctx.fillStyle=seg.color; ctx.fill();
    angle += slice;
  });

  ctx.fillStyle='#0f172a'; ctx.font='bold 18px Outfit,sans-serif';
  ctx.textAlign='center'; ctx.fillText(total,cx,cy+2);
  ctx.fillStyle=CHART_COLORS.textMuted; ctx.font='9px Inter,sans-serif';
  ctx.fillText('TOTAL',cx,cy+14);

  const lX=W*0.65; let lY=cy-(segs.length*22)/2+10;
  segs.forEach(seg => {
    ctx.fillStyle=seg.color; ctx.beginPath();
    ctx.arc(lX,lY,5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#0f172a'; ctx.font='11px Inter,sans-serif';
    ctx.textAlign='left'; ctx.fillText(seg.label,lX+12,lY+1);
    ctx.fillStyle=CHART_COLORS.textMuted; ctx.font='bold 11px Inter,sans-serif';
    const pct=total>0?Math.round((seg.value/total)*100):0;
    ctx.fillText(`${seg.value} (${pct}%)`,lX+12,lY+15);
    lY+=30;
  });
}

function drawMoodLine(canvas, history, days) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.offsetWidth || 1020;
  const H = 240;
  canvas.width  = W*dpr; canvas.height = H*dpr;
  canvas.style.width  = W+'px'; canvas.style.height = H+'px';
  ctx.scale(dpr, dpr);
  ctx.clearRect(0,0,W,H);

  const labels=[], moodData=[], taskData=[];
  const today=new Date();
  for (let i=days-1;i>=0;i--) {
    const d=new Date(today); d.setDate(d.getDate()-i);
    const dateStr=d.toISOString().split('T')[0];
    const short=d.toLocaleDateString('en-US',{month:'short',day:'numeric'});
    labels.push(short);
    const entry=history.find(h=>h.date===dateStr);
    moodData.push(entry?entry.mood||0:0);
    taskData.push(entry?entry.tasksCompleted||0:0);
  }

  const pL=36,pR=40,pT=16,pB=36;
  const cW=W-pL-pR, cH=H-pT-pB;
  const maxTasks=Math.max(...taskData,1), maxMood=5;

  ctx.strokeStyle=CHART_COLORS.gridLine; ctx.lineWidth=1;
  for (let i=0;i<=4;i++) {
    const y=pT+cH-(cH/4)*i;
    ctx.beginPath(); ctx.moveTo(pL,y); ctx.lineTo(W-pR,y); ctx.stroke();
  }

  function drawLine(data, maxVal, color, fillColor) {
    if (data.length<2) return;
    const pts=data.map((v,i)=>({x:pL+(i/(data.length-1))*cW, y:pT+cH-(v/maxVal)*cH}));
    ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y);
    for (let i=1;i<pts.length;i++) {
      const pr=pts[i-1], cu=pts[i], cpx=(pr.x+cu.x)/2;
      ctx.bezierCurveTo(cpx,pr.y,cpx,cu.y,cu.x,cu.y);
    }
    ctx.strokeStyle=color; ctx.lineWidth=2.5; ctx.stroke();
    ctx.lineTo(pts[pts.length-1].x,pT+cH); ctx.lineTo(pts[0].x,pT+cH);
    ctx.closePath(); ctx.fillStyle=fillColor; ctx.fill();
    pts.forEach(p=>{
      ctx.beginPath(); ctx.arc(p.x,p.y,3,0,Math.PI*2);
      ctx.fillStyle=color; ctx.fill();
      ctx.strokeStyle='#fff'; ctx.lineWidth=1.5; ctx.stroke();
    });
  }

  drawLine(taskData, maxTasks, CHART_COLORS.indigo, CHART_COLORS.indigoSoft);
  drawLine(moodData, maxMood,  CHART_COLORS.amber,  CHART_COLORS.amberSoft);

  ctx.fillStyle=CHART_COLORS.textMuted; ctx.font='9px Inter,sans-serif'; ctx.textAlign='center';
  labels.forEach((lbl,i)=>{
    if (days<=7||i%Math.ceil(days/10)===0) {
      const x=pL+(i/(labels.length-1))*cW; ctx.fillText(lbl,x,H-6);
    }
  });

  ctx.textAlign='right';
  for (let i=0;i<=4;i++) {
    const y=pT+cH-(cH/4)*i;
    ctx.fillStyle=CHART_COLORS.indigo; ctx.font='10px Inter,sans-serif';
    ctx.fillText(Math.round(maxTasks/4*i),pL-6,y+3);
  }
  ctx.textAlign='left';
  for (let i=0;i<=4;i++) {
    const y=pT+cH-(cH/4)*i;
    ctx.fillStyle=CHART_COLORS.amber; ctx.font='10px Inter,sans-serif';
    ctx.fillText(Math.round(maxMood/4*i),W-pR+6,y+3);
  }
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function AnalyticsDashboard({ open, onClose }) {
  const state = useAppState();
  const [range, setRange] = useState(7);

  const barRef  = useRef(null);
  const dntRef  = useRef(null);
  const lineRef = useRef(null);

  const renderCharts = useCallback(() => {
    const history = getHistoryForRange(state.history || [], range);
    drawBarChart(barRef.current,  history, range);
    drawDoughnut(dntRef.current,  history);
    drawMoodLine(lineRef.current, history, range);
  }, [state.history, range]);

  useEffect(() => {
    if (open) {
      setTimeout(renderCharts, 50); // let DOM paint first
    }
  }, [open, renderCharts]);

  const history  = getHistoryForRange(state.history || [], range);
  const streak   = state.streak || 0;
  const totalCmp = history.reduce((s,h)=>s+(h.tasksCompleted||0), 0);
  const best     = history.length > 0
    ? history.reduce((a,b)=>(a.tasksCompleted||0)>=(b.tasksCompleted||0)?a:b)
    : null;
  const moods  = history.filter(h=>h.mood>0).map(h=>h.mood);
  const avgMood = moods.length>0 ? (moods.reduce((a,b)=>a+b,0)/moods.length).toFixed(1) : null;

  if (!open) return null;

  return (
    <>
      <div className="analytics-backdrop visible" id="analytics-backdrop" onClick={onClose} />
      <div id="analytics-panel" className="analytics-panel open" role="dialog" aria-modal="true" aria-label="Analytics Dashboard">
        <div className="analytics-inner">
          {/* Header */}
          <div className="analytics-header">
            <div className="analytics-title-area">
              <span className="analytics-icon">📊</span>
              <div>
                <h2 className="analytics-title">Analytics & Insights</h2>
                <p className="analytics-subtitle">Your productivity at a glance</p>
              </div>
            </div>
            <button id="analytics-close-btn" className="analytics-close" onClick={onClose} aria-label="Close">✕</button>
          </div>

          {/* Range tabs */}
          <div className="analytics-tabs">
            {[7, 30].map(r => (
              <button
                key={r}
                className={`analytics-tab${range===r?' active':''}`}
                data-range={r}
                onClick={() => setRange(r)}
              >
                {r===7 ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>

          {/* Highlight cards */}
          <div className="analytics-highlights">
            <div className="highlight-card">
              <span className="highlight-icon">🔥</span>
              <div className="highlight-data">
                <span className="highlight-value" id="hl-streak">{streak} days</span>
                <span className="highlight-label">Longest Streak</span>
              </div>
            </div>
            <div className="highlight-card">
              <span className="highlight-icon">✅</span>
              <div className="highlight-data">
                <span className="highlight-value" id="hl-total-tasks">{totalCmp}</span>
                <span className="highlight-label">Tasks Completed</span>
              </div>
            </div>
            <div className="highlight-card">
              <span className="highlight-icon">🏆</span>
              <div className="highlight-data">
                <span className="highlight-value" id="hl-best-day">
                  {best ? new Date(best.date+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'}) : '—'}
                </span>
                <span className="highlight-label">Best Day</span>
              </div>
            </div>
            <div className="highlight-card">
              <span className="highlight-icon">😊</span>
              <div className="highlight-data">
                <span className="highlight-value" id="hl-avg-mood">{avgMood ? `${avgMood} ★` : '—'}</span>
                <span className="highlight-label">Avg Mood</span>
              </div>
            </div>
          </div>

          {/* Gamification Badges */}
          <div className="chart-card chart-card-wide" style={{ marginTop: 'var(--space-4)' }}>
            <h3 className="chart-title">🏅 Achievements</h3>
            <div className="badges-grid">
              <div className={`badge-item ${state.badges?.includes('task-crusher') ? '' : 'locked'}`} title="Complete 10 tasks in a single day">
                <span className="badge-icon">🗡️</span>
                <span className="badge-name">Task Crusher</span>
              </div>
              <div className={`badge-item ${state.badges?.includes('7-day-warrior') ? '' : 'locked'}`} title="Reach a 7-day streak">
                <span className="badge-icon">🛡️</span>
                <span className="badge-name">7-Day Warrior</span>
              </div>
              <div className={`badge-item ${state.badges?.includes('focus-master') ? '' : 'locked'}`} title="Log 5 Pomodoro sessions">
                <span className="badge-icon">🍅</span>
                <span className="badge-name">Focus Master</span>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="analytics-grid" style={{ marginTop: 'var(--space-4)' }}>
            <div className="chart-card">
              <h3 className="chart-title">📊 Tasks Completed</h3>
              <div className="chart-container">
                <canvas ref={barRef} id="chart-tasks-bar" style={{ width:'100%', height:240 }} />
              </div>
            </div>
            <div className="chart-card">
              <h3 className="chart-title">🥧 Quadrant Distribution</h3>
              <div className="chart-container">
                <canvas ref={dntRef} id="chart-quadrant-doughnut" style={{ width:'100%', height:240 }} />
              </div>
            </div>
            <div className="chart-card chart-card-wide">
              <h3 className="chart-title">📈 Mood vs Productivity</h3>
              <div className="chart-container">
                <canvas ref={lineRef} id="chart-mood-line" style={{ width:'100%', height:240 }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
