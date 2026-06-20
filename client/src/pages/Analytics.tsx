import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import Card from '../components/Card';
import MetricCard from '../components/MetricCard';
import AnimatedNumber from '../components/AnimatedNumber';

export const Analytics: React.FC = () => {
  const [aiInsights, setAiInsights] = useState<string | null>(() => localStorage.getItem('helix_ai_insights'));
  const [loadingAi, setLoadingAi] = useState(false);
  const [showHeatmapInfo, setShowHeatmapInfo] = useState(false);

  const persistAiInsights = (value: string | null) => {
    setAiInsights(value);
    if (value) localStorage.setItem('helix_ai_insights', value);
  };

  const generateInsights = async () => {
    setLoadingAi(true);
    setAiInsights(null);
    try {
      const res = await api.post('/ai/insights');
      persistAiInsights(res.data.insights);
    } catch {
      setAiInsights('AI insights are not available. Ensure GEMINI_API_KEY is configured.');
    } finally {
      setLoadingAi(false);
    }
  };

  const { data: analytics } = useQuery({
    queryKey: ['dashboardAnalytics'],
    queryFn: async () => {
      const res = await api.get('/analytics/dashboard');
      return res.data;
    }
  });

  const { data: snapshotHistory } = useQuery({
    queryKey: ['snapshotHistory'],
    queryFn: async () => {
      const res = await api.get('/analytics/snapshots/history');
      return res.data;
    }
  });

  const { data: skills } = useQuery({
    queryKey: ['skills'],
    queryFn: async () => {
      const res = await api.get('/skills');
      return res.data;
    }
  });

  const getHeatmapClass = (score: number) => {
    if (score >= 80) return 'bg-secondary-container';
    if (score >= 60) return 'bg-secondary-container/60';
    if (score >= 40) return 'bg-secondary-container/30';
    return 'bg-error/40';
  };

  const generateRetentionHeatmap = () => {
    const sourceScores = Array.isArray(skills) && skills.length > 0
      ? skills.map((skill: any) => Number(skill.effectiveScore ?? skill.masteryScore ?? 0))
      : [];

    if (sourceScores.length === 0) {
      return [
        <div key="empty" className="col-span-8 p-4 text-sm text-on-surface-variant border border-dashed border-primary/25 bg-surface-container-low">
          No skill data recorded yet.
        </div>
      ];
    }

    const squares = [];
    for (let i = 0; i < 72; i++) {
      const score = sourceScores[i % sourceScores.length];
      const colorClass = getHeatmapClass(score);
      squares.push(
        <div key={i} className={`aspect-square border border-black/10 ${colorClass}`} title={`${skills[i % sourceScores.length]?.name || 'Skill'}: ${score}%`} />
      );
    }
    return squares;
  };

  const snapshotPoints = Array.isArray(snapshotHistory) ? [...snapshotHistory].reverse() : [];

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#16a34a';
    if (score >= 60) return '#ca8a04';
    return '#dc2626';
  };

  const trendDots: { x: number; y: number; score: number; label: string; date: string }[] = [];
  const trendLine: string[] = [];
  const trendArea: string[] = [];

  if (snapshotPoints.length > 1) {
    const points = snapshotPoints.map((snapshot: any, index: number) => {
      const x = (index / (snapshotPoints.length - 1)) * 100;
      const score = Math.max(0, Math.min(100, Number(snapshot.readinessScore ?? 0)));
      const y = 100 - score;
      const date = new Date(snapshot.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      trendDots.push({ x, y, score, label: snapshot.timestamp, date });
      return { x, y, score };
    });

    const lineD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    trendLine.push(lineD);
    const areaD = `${lineD} L${points[points.length - 1].x},100 L${points[0].x},100 Z`;
    trendArea.push(areaD);
  }

  const trendDirection = snapshotPoints.length >= 2
    ? Number(snapshotPoints[snapshotPoints.length - 1].readinessScore ?? 0) - Number(snapshotPoints[0].readinessScore ?? 0)
    : 0;

  const topicWeaknesses = Array.isArray(analytics?.topicWeaknesses) ? analytics.topicWeaknesses : [];

  return (
    <div className="px-4 md:px-margin-desktop py-6 max-w-container-max mx-auto w-full space-y-gutter pb-12 text-primary font-body-lg select-none">
      {/* Dashboard Title */}
      <section className="border-b-4 border-primary pb-4 mb-8">
        <h2 className="font-display-lg text-2xl md:text-4xl uppercase tracking-tight">PREPARATION ANALYTICS</h2>
        <p className="font-body-sm text-sm text-on-surface-variant mt-2">Quantitative assessments of study efficiency, cognitive retention, and choke points.</p>
      </section>

      {/* Primary Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
        <MetricCard 
          title="PREPARATION EFFICIENCY" 
          value={analytics?.efficiencyRate != null ? <AnimatedNumber value={parseFloat(analytics.efficiencyRate)} suffix="%" duration={1400} /> : 'N/A'} 
          trend={`${Array.isArray(skills) ? skills.length : 0} skills tracked`} 
          trendDirection="neutral" 
          trendLabel="LIVE DATA" 
        />
        <MetricCard 
          title="MOCK FAILURE RATE" 
          value={analytics?.failureRate != null ? <AnimatedNumber value={parseFloat(analytics.failureRate)} suffix="%" duration={1400} /> : 'N/A'} 
          trend={`${Array.isArray(snapshotHistory) ? snapshotHistory.length : 0} snapshots logged`} 
          trendDirection="neutral" 
          trendLabel="LIVE DATA" 
        />
        <MetricCard 
          title="KNOWLEDGE DECAY RATE" 
          value={analytics?.decayRate != null ? <AnimatedNumber value={parseFloat(analytics.decayRate)} suffix={analytics.decayRate.endsWith('d') ? 'd' : '%'} duration={1400} /> : 'N/A'} 
          trend="Based on actual revision gaps" 
          trendDirection="neutral" 
          trendLabel="LIVE DATA" 
        />
      </section>

      {/* Analytics Grid: Heatmap and Line Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Heatmap Card */}
        <Card className="lg:col-span-1 flex flex-col justify-between shadow-[8px_8px_0px_0px_var(--shadow-color)]">
          <div>
            <div className="flex justify-between items-center mb-6 border-b-2 border-primary pb-3">
              <span className="font-label-caps text-label-caps uppercase font-bold text-on-surface-variant">Cognitive Retention Heatmap</span>
              <button
                type="button"
                onClick={() => setShowHeatmapInfo(!showHeatmapInfo)}
                className="material-symbols-outlined text-primary text-sm cursor-pointer hover:text-primary/70 transition-colors"
              >info</button>
            </div>
            {showHeatmapInfo && (
              <div className="relative">
                <div className="absolute top-2 right-0 z-10 w-72 p-4 bg-surface-container-high text-on-surface text-[11px] leading-relaxed shadow-lg border border-primary/20 rounded-md">
                  <button
                    type="button"
                    onClick={() => setShowHeatmapInfo(false)}
                    className="absolute top-1 right-1 material-symbols-outlined text-sm text-on-surface-variant hover:text-on-surface cursor-pointer"
                  >close</button>
                  <p className="font-bold mb-2 text-xs uppercase tracking-wider">About this heatmap</p>
                  <p className="mb-2">Each of the 72 squares represents one of your skills. The color reflects its current <strong>effective score</strong> based on the spaced-repetition decay formula:</p>
                  <p className="font-mono text-[10px] bg-surface-container-lowest p-2 rounded mb-2">effectiveScore = masteryScore × e<sup>−λ × daysSinceRevision</sup></p>
                  <p className="mb-2">Darker squares mean higher retention; lighter/redder squares indicate knowledge decay from infrequent revision.</p>
                  <p className="text-[10px] text-on-surface-variant">Click the info button again to close.</p>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-8 gap-1 border border-primary/25 p-2 bg-white">
              {generateRetentionHeatmap()}
            </div>
          </div>

          <div className="flex justify-between mt-4 font-label-caps text-[9px] text-on-surface-variant font-bold">
            <span>LOW RETENTION</span>
            <span>TARGET OPTIMIZED</span>
          </div>
        </Card>

        {/* Readiness Trend Chart */}
        <Card className="lg:col-span-2 flex flex-col shadow-[8px_8px_0px_0px_var(--shadow-color)]">
          <div className="flex justify-between items-center mb-6 border-b-2 border-primary pb-3">
            <div className="flex items-center gap-3">
              <span className="font-label-caps text-label-caps uppercase font-bold text-on-surface-variant">Readiness Trend</span>
              {snapshotPoints.length >= 2 && (
                <span className={`font-data-mono text-[11px] font-bold flex items-center gap-1 ${trendDirection >= 0 ? 'text-green-600' : 'text-error'}`}>
                  <span className="material-symbols-outlined text-sm">{trendDirection >= 0 ? 'arrow_upward' : 'arrow_downward'}</span>
                  {trendDirection >= 0 ? '+' : ''}{trendDirection} pts
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-600 rounded-full border border-black"></span>
              <span className="font-data-mono text-[8px] font-bold uppercase text-on-surface-variant">80+ Strong</span>
              <span className="w-2 h-2 bg-yellow-600 rounded-full border border-black ml-1"></span>
              <span className="font-data-mono text-[8px] font-bold uppercase text-on-surface-variant">60-79 Fair</span>
              <span className="w-2 h-2 bg-red-600 rounded-full border border-black ml-1"></span>
              <span className="font-data-mono text-[8px] font-bold uppercase text-on-surface-variant mr-2">&lt;60 Weak</span>
            </div>
          </div>

          <div className="flex-1 bg-white h-52 relative overflow-hidden border-2 border-primary">
            {snapshotPoints.length > 1 ? (
              <div className="absolute inset-0 p-4">
                {/* Y-axis labels */}
                <div className="absolute left-4 top-4 bottom-8 flex flex-col justify-between pointer-events-none z-10">
                  <span className="font-data-mono text-[9px] text-on-surface-variant font-bold">100</span>
                  <span className="font-data-mono text-[9px] text-on-surface-variant font-bold">75</span>
                  <span className="font-data-mono text-[9px] text-on-surface-variant font-bold">50</span>
                  <span className="font-data-mono text-[9px] text-on-surface-variant font-bold">25</span>
                  <span className="font-data-mono text-[9px] text-on-surface-variant font-bold">0</span>
                </div>

                {/* Y-axis line */}
                <div className="absolute left-12 top-4 bottom-8 border-l-2 border-black/20 pointer-events-none"></div>

                {/* Horizontal grid lines */}
                <div className="absolute left-12 right-4 top-4 bottom-8 flex flex-col justify-between pointer-events-none">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="border-t border-black/10 w-full"></div>
                  ))}
                </div>

                {/* Target line at 80 */}
                <div className="absolute left-12 right-4 bottom-[calc(20%+2rem)] pointer-events-none z-10">
                  <div className="border-t-2 border-dashed border-green-500/40 w-full"></div>
                  <span className="absolute -top-3 right-0 font-data-mono text-[8px] text-green-600 font-bold bg-white px-1">TARGET</span>
                </div>

                {/* SVG Chart */}
                <svg className="absolute left-12 right-4 top-4 bottom-8 w-full h-auto" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#16a34a" stopOpacity="0.15" />
                      <stop offset="60%" stopColor="#ca8a04" stopOpacity="0.1" />
                      <stop offset="100%" stopColor="#dc2626" stopOpacity="0.06" />
                    </linearGradient>
                    <filter id="dotShadow">
                      <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.3" />
                    </filter>
                  </defs>
                  {/* Area fill */}
                  {trendArea.map((d, i) => (
                    <path key={`area-${i}`} d={d} fill="url(#areaGrad)" />
                  ))}
                  {/* Line */}
                  {trendLine.map((d, i) => (
                    <path key={`line-${i}`} d={d} stroke="#2563eb" strokeWidth="2.5" fill="none" vectorEffect="non-scaling-stroke" />
                  ))}
                  {/* Data points with score labels */}
                  {trendDots.map((dot, i) => (
                    <g key={`dot-${i}`}>
                      <circle cx={dot.x} cy={dot.y} r="4" fill="white" stroke="#2563eb" strokeWidth="2.5" filter="url(#dotShadow)" />
                      <text x={dot.x} y={dot.y - 8} textAnchor="middle" className="font-data-mono" fontSize="5" fill="currentColor" fontWeight="bold" opacity="0.8">
                        {dot.score}
                      </text>
                      <title>{`${dot.score}/100 — ${dot.date}`}</title>
                    </g>
                  ))}
                  {/* Latest score badge */}
                  {trendDots.length > 0 && (() => {
                    const last = trendDots[trendDots.length - 1];
                    return (
                      <g>
                        <rect x={last.x - 12} y={last.y - 20} width="24" height="10" rx="2" fill={getScoreColor(last.score)} />
                        <text x={last.x} y={last.y - 13} textAnchor="middle" fontSize="5" fill="white" fontWeight="bold">{last.score}</text>
                      </g>
                    );
                  })()}
                </svg>

                {/* X-axis date labels */}
                <div className="absolute left-12 right-4 bottom-1 flex justify-between pointer-events-none z-10">
                  {snapshotPoints.length >= 4 ? (
                    <>
                      <span className="font-data-mono text-[8px] text-on-surface-variant font-bold">
                        {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(snapshotPoints[0].timestamp))}
                      </span>
                      <span className="font-data-mono text-[8px] text-on-surface-variant font-bold">
                        {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(snapshotPoints[Math.floor(snapshotPoints.length / 3)].timestamp))}
                      </span>
                      <span className="font-data-mono text-[8px] text-on-surface-variant font-bold">
                        {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(snapshotPoints[Math.floor((snapshotPoints.length * 2) / 3)].timestamp))}
                      </span>
                      <span className="font-data-mono text-[8px] text-on-surface-variant font-bold">
                        {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(snapshotPoints[snapshotPoints.length - 1].timestamp))}
                      </span>
                    </>
                  ) : (
                    snapshotPoints.map((sp: any, i: number) => (
                      <span key={i} className="font-data-mono text-[8px] text-on-surface-variant font-bold">
                        {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(sp.timestamp))}
                      </span>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-sm text-on-surface-variant bg-surface-container-low gap-2">
                <span className="material-symbols-outlined text-3xl opacity-30">trending_up</span>
                <span>No readiness history captured yet.</span>
                <span className="text-xs opacity-60">Complete a risk scan or log revisions to generate trend data.</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Critical Weakness bars */}
      <section className="border-2 border-primary bg-white shadow-[8px_8px_0px_0px_var(--shadow-color)]">
        <div className="p-4 border-b-2 border-primary flex justify-between items-center bg-secondary-fixed text-on-secondary-container font-bold">
          <h3 className="font-label-caps text-label-caps uppercase tracking-wider">Topic Critical Weakness Breakdowns</h3>
          <span className="material-symbols-outlined text-error">warning</span>
        </div>
        <div className="p-6 bg-white flex flex-col gap-6">
          {topicWeaknesses.length > 0 ? (
            topicWeaknesses.map((bar: any, i: number) => {
              const score = Math.max(0, Math.min(100, Number(bar.risk ?? bar.score ?? 0)));
              const isCritical = score >= 70;
              return (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="flex justify-between font-label-caps text-[10px] font-bold">
                    <span>{bar.topic || bar.label || 'Topic weakness'}</span>
                    <span className="font-data-mono"><AnimatedNumber value={score} suffix="%" duration={1200} /> RISK</span>
                  </div>
                  <div className="h-6 w-full border-2 border-primary bg-surface-container relative shadow-[2px_2px_0px_0px_var(--shadow-color)]">
                    <div
                      className={`h-full border-r-2 border-primary flex items-center justify-end px-3 font-data-mono text-[9px] font-bold uppercase ${isCritical ? 'bg-error text-white' : 'bg-secondary text-on-secondary'}`}
                      style={{ width: `${score}%` }}
                    >
                      Risk Area
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="border-2 border-dashed border-primary p-4 text-sm text-on-surface-variant bg-surface-container-low">
              No topic weaknesses have been logged yet.
            </div>
          )}
        </div>
      </section>

      {/* AI Insights Section */}
      <section className="border-2 border-primary bg-white shadow-[8px_8px_0px_0px_var(--shadow-color)]">
        <div className="p-4 border-b-2 border-primary flex justify-between items-center bg-secondary-fixed text-on-secondary-container font-bold">
          <h3 className="font-label-caps text-label-caps uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined">auto_awesome</span>
            AI-Powered Insights
          </h3>
          <button
            onClick={generateInsights}
            disabled={loadingAi}
            className="bg-primary text-on-primary px-4 py-2 font-label-caps text-[10px] uppercase border-2 border-primary shadow-[2px_2px_0px_0px_var(--shadow-color)] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50"
          >
            {loadingAi ? 'Generating...' : 'Generate Insights'}
          </button>
        </div>
        <div className="p-6">
          {aiInsights ? (
            <div className="max-h-72 overflow-y-auto font-body-sm text-sm space-y-3 pr-2">
              {(() => {
                const lines = aiInsights.split('\n').filter((l: string) => l.trim());
                const sections: { heading: string; points: string[] }[] = [];
                let currentHeading = '';
                let currentPoints: string[] = [];
                lines.forEach((line: string) => {
                  const headingMatch = line.match(/^\*\*(.+?)\*\*/);
                  if (headingMatch) {
                    if (currentHeading) sections.push({ heading: currentHeading, points: currentPoints });
                    currentHeading = headingMatch[1];
                    currentPoints = [];
                    const rest = line.replace(/^\*\*.+?\*\*/, '').trim();
                    if (rest) currentPoints.push(rest);
                  } else {
                    const cleaned = line.replace(/^[-*]\s*/, '').trim();
                    if (cleaned) currentPoints.push(cleaned);
                  }
                });
                if (currentHeading) sections.push({ heading: currentHeading, points: currentPoints });
                return sections.map((s, i) => (
                  <div key={i}>
                    <p className="font-bold text-sm text-primary uppercase tracking-wider mb-1.5">{s.heading}</p>
                    <ul className="space-y-1 ml-1">
                      {s.points.map((p, j) => (
                        <li key={j} className="flex items-start gap-2">
                          <span className="text-primary/40 mt-1 shrink-0">•</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ));
              })()}
            </div>
          ) : (
            <div className="border-2 border-dashed border-primary p-8 text-center text-on-surface-variant text-sm">
              <span className="material-symbols-outlined text-4xl opacity-30 mb-2 block">auto_awesome</span>
              Click "Generate Insights" to get AI-powered analysis of your preparation data.
            </div>
          )}
        </div>
      </section>

      {/* Operational Footer */}
      <div className="flex gap-4 justify-center items-center mt-12">
        <span className="w-3 h-3 bg-green-500 rounded-full border border-black animate-pulse"></span>
        <p className="font-label-caps text-xs font-bold uppercase tracking-widest text-on-surface-variant">ANALYTIC CAPTURE PROTOCOL: SECURE</p>
      </div>
    </div>
  );
};

export default Analytics;
