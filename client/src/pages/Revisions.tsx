import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import type { Revision, Skill } from '../types';

export const Revisions: React.FC = () => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [customSkill, setCustomSkill] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const [revisionType, setRevisionType] = useState('Quiz');
  const [customRevisionType, setCustomRevisionType] = useState('');
  const [duration, setDuration] = useState(30);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [recallScore, setRecallScore] = useState(80);
  const [notes, setNotes] = useState('');

  const revisionTypeOptions = [
    'LeetCode',
    'MockInterview',
    'Quiz',
    'ProjectWork',
    'DBMSRevision',
    'OSRevision',
    'CNRevision',
    'Reading',
    'Flashcards',
    'CodeReview',
    'NotesReview',
    'VideoLecture',
    'BlogPost',
    'Cheatsheet',
    'Whiteboarding',
    'PairProgramming'
  ];

  const commonSkills = [
    'Data Structures & Algorithms', 'Arrays & Strings', 'Linked Lists', 'Trees & Graphs',
    'Dynamic Programming', 'Recursion & Backtracking', 'Sorting & Searching', 'Hash Tables',
    'Stacks & Queues', 'Heaps & Priority Queues', 'Tries', 'Bit Manipulation',
    'System Design', 'Object-Oriented Design', 'Database Design', 'API Design',
    'SQL', 'NoSQL', 'Normalization', 'Indexing', 'Transactions', 'Query Optimization',
    'Operating Systems', 'Process Scheduling', 'Memory Management', 'File Systems',
    'Concurrency & Threading', 'Deadlocks', 'Computer Networks', 'TCP/IP', 'HTTP/HTTPS',
    'DNS', 'Load Balancing', 'Web Security', 'OAuth', 'RESTful APIs', 'GraphQL',
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'React', 'Node.js', 'Express',
    'Docker', 'Kubernetes', 'CI/CD', 'Cloud Computing', 'AWS', 'Microservices',
    'Behavioral Interview', 'Resume & Portfolio', 'Mock Presentation'
  ];

  const { data: skills } = useQuery<Skill[]>({
    queryKey: ['skills'],
    queryFn: async () => {
      const res = await api.get('/skills');
      return res.data;
    }
  });

  const { data: revisions } = useQuery<Revision[]>({
    queryKey: ['revisions'],
    queryFn: async () => {
      const res = await api.get('/revisions');
      return res.data;
    }
  });

  const logRevisionMutation = useMutation({
    mutationFn: async (newRevision: {
      skillId: string;
      revisionType?: string;
      duration: number;
      difficulty: string;
      recallScore: number;
      notes: string;
    }) => {
      const res = await api.post('/revisions', newRevision);
      return res.data;
    },
    onSuccess: (newRev) => {
      queryClient.setQueryData<Revision[]>(['revisions'], (old) => [newRev, ...(old ?? [])]);
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      queryClient.invalidateQueries({ queryKey: ['readiness'] });
      queryClient.invalidateQueries({ queryKey: ['risk'] });

      setSelectedSkill('');
      setRevisionType('Quiz');
      setDuration(30);
      setDifficulty('medium');
      setRecallScore(80);
      setNotes('');
      setShowAddModal(false);
    }
  });

  const [editingRevision, setEditingRevision] = useState<Revision | null>(null);
  const [editRevisionType, setEditRevisionType] = useState('Quiz');
  const [editDuration, setEditDuration] = useState(30);
  const [editDifficulty, setEditDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [editRecallScore, setEditRecallScore] = useState(80);
  const [editNotes, setEditNotes] = useState('');
  const [deletingRevisionId, setDeletingRevisionId] = useState<string | null>(null);

  const updateRevisionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { revisionType?: string; duration?: number; difficulty?: string; recallScore?: number; notes?: string } }) => {
      const res = await api.put(`/revisions/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revisions'] });
      setEditingRevision(null);
    }
  });

  const deleteRevisionMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/revisions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revisions'] });
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      queryClient.invalidateQueries({ queryKey: ['readiness'] });
      queryClient.invalidateQueries({ queryKey: ['risk'] });
      setDeletingRevisionId(null);
    }
  });

  const openEditModal = (rev: Revision) => {
    setEditingRevision(rev);
    setEditRevisionType((rev as any).revisionType || 'Quiz');
    setEditDuration(rev.duration);
    setEditDifficulty(rev.difficulty);
    setEditRecallScore(rev.recallScore);
    setEditNotes(rev.notes || '');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRevision) return;
    const payload: { revisionType?: string; duration?: number; difficulty?: string; recallScore?: number; notes?: string } = {};
    if (editRevisionType !== (editingRevision as any).revisionType) payload.revisionType = editRevisionType;
    if (editDuration !== editingRevision.duration) payload.duration = editDuration;
    if (editDifficulty !== editingRevision.difficulty) payload.difficulty = editDifficulty;
    if (editRecallScore !== editingRevision.recallScore) payload.recallScore = editRecallScore;
    if (editNotes !== (editingRevision.notes || '')) payload.notes = editNotes;
    if (Object.keys(payload).length === 0) { setEditingRevision(null); return; }
    updateRevisionMutation.mutate({ id: editingRevision._id, data: payload });
  };

  const isMongoId = (v: string) => /^[0-9a-fA-F]{24}$/.test(v);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSkill = selectedSkill === '__custom__' ? customSkill.trim() : selectedSkill;
    const finalRevisionType = revisionType === '__custom__' ? customRevisionType.trim() : revisionType;
    if (!finalSkill || !finalRevisionType) return;
    const payload: Record<string, unknown> = {
      revisionType: finalRevisionType,
      duration,
      difficulty,
      recallScore,
      notes
    };
    if (isMongoId(finalSkill)) {
      payload.skillId = finalSkill;
    } else {
      payload.skillName = finalSkill;
    }
    logRevisionMutation.mutate(payload as any);
  };

  const displayRevisions = revisions ?? [];

  const generateDensityHeatmap = (year: number): React.ReactNode[] => {
    const revs = Array.isArray(revisions) ? revisions : [];

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const endDate = new Date(year, 11, 31);
    const startDate = new Date(year, 0, 1);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const days: { date: Date; count: number }[] = [];
    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(endDate);
      d.setDate(d.getDate() - i);
      const count = revs.filter((r: any) => {
        const rd = new Date(r.date);
        return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth() && rd.getDate() === d.getDate();
      }).length;
      days.push({ date: d, count });
    }
    const maxCount = Math.max(1, ...days.map(d => d.count));

    const startDow = days[0].date.getDay();
    const weeks: (typeof days[0] | null)[][] = [];
    let idx = 0;
    while (idx < days.length + startDow) {
      const col: (typeof days[0] | null)[] = [];
      for (let row = 0; row < 7; row++) {
        const dayIdx = idx - startDow;
        if (idx < startDow || dayIdx >= days.length) {
          col.push(null);
        } else {
          col.push(days[dayIdx]);
        }
        idx++;
      }
      weeks.push(col);
    }

    const colMonth: string[] = [];
    let lastYear = '';
    const seenMonths = new Set<string>();
    for (let w = 0; w < weeks.length; w++) {
      let monthLabel = '';
      for (let r = 0; r < 7; r++) {
        const day = weeks[w][r];
        if (!day) continue;
        const m = day.date.toLocaleDateString('en', { month: 'short' });
        const y = String(day.date.getFullYear());
        const key = `${m}-${y}`;
        if (!seenMonths.has(key)) {
          seenMonths.add(key);
          monthLabel = y !== lastYear ? `${m} ${y}` : m;
          lastYear = y;
        }
        if (monthLabel) break;
      }
      colMonth.push(monthLabel);
    }

    const cell = 13;
    const gap = 3;
    const monthGap = 8;
    const padL = 28;
    const padT = 16;

    const colX: number[] = [];
    let accX = 0;
    for (let w = 0; w < weeks.length; w++) {
      if (w > 0 && colMonth[w]) accX += monthGap;
      colX.push(accX);
      accX += cell + gap;
    }

    const svgW = padL + colX[colX.length - 1] + (cell + gap);
    const svgH = padT + 7 * (cell + gap);

    const monthLabels = colMonth.map((label, i) => label ? { col: i, label } : null).filter(Boolean) as { col: number; label: string }[];

    return [
      <svg key="hm" width={svgW} height={svgH} className="block" style={{ minWidth: svgW }}>
        <style>{`rect:hover { opacity: 0.7; }`}</style>
        {monthLabels.map((m, i) => (
          <text key={`m-${i}`} x={padL + colX[m.col]} y="10" fontSize="8" fill="#6b7280" fontWeight="600">{m.label}</text>
        ))}
        {dayLabels.map((l, r) => (
          <text key={`d-${r}`} x="0" y={padT + r * (cell + gap) + cell - 1} fontSize="7" fill="#6b7280">{l}</text>
        ))}
        {weeks.map((col, wi) =>
          col.map((cellData, ri) => {
            const x = padL + colX[wi];
            const y = padT + ri * (cell + gap);
            if (!cellData) return <rect key={`e-${wi}-${ri}`} x={x} y={y} width={cell} height={cell} rx="1.5" fill="transparent" />;
            const intensity = cellData.count > 0 ? Math.min(1, cellData.count / maxCount) : 0;
            const fill = intensity > 0.66 ? '#216e39' : intensity > 0.33 ? '#30a14e' : intensity > 0 ? '#9be9a8' : '#ebedf0';
            const ds = cellData.date.toLocaleDateString('en', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
            const txt = `${ds}: ${cellData.count} revision${cellData.count !== 1 ? 's' : ''}`;
            return (
              <g key={`c-${wi}-${ri}`}>
                <rect
                  x={x} y={y} width={cell} height={cell} rx="1.5" fill={fill}
                  onMouseOver={(e) => setTooltip({ x: e.clientX, y: e.clientY - 30, text: txt })}
                  onMouseMove={(e) => setTooltip({ x: e.clientX, y: e.clientY - 30, text: txt })}
                  onMouseOut={() => setTooltip(null)}
                  style={{ cursor: 'pointer' }}
                />
              </g>
            );
          })
        )}
      </svg>,
      tooltip && (
        <div
          className="fixed z-50 px-2.5 py-1.5 bg-[#1b1f23] text-white text-[11px] font-data-mono rounded pointer-events-none whitespace-nowrap"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
        </div>
      )
    ];
  };

  const noRevisions = !revisions || revisions.length === 0;

  return (
    <div className="px-4 md:px-margin-desktop py-6 max-w-container-max mx-auto w-full space-y-10 pb-12 text-primary font-body-lg select-none">
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-sm py-4 md:py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-primary">
        <div>
          <h2 className="font-headline-lg text-2xl md:text-3xl text-primary font-black uppercase">Revision Tracker</h2>
          <p className="font-body-sm text-sm text-on-surface-variant">Intelligent Spaced Repetition & Performance Audit</p>
        </div>
        <Button onClick={() => { setSelectedSkill(''); setCustomSkill(''); setRevisionType('Quiz'); setCustomRevisionType(''); setShowAddModal(true); }} className="px-4 md:px-6 py-2 md:py-3 text-[10px] md:text-label-caps">
          <span className="material-symbols-outlined text-lg">add</span> <span className="hidden sm:inline">Add Revision</span><span className="sm:hidden">Add</span>
        </Button>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
        {[
          { icon: 'code', title: 'LeetCode', text: noRevisions ? 'No sessions logged' : `${revisions.filter(r => r.revisionType === 'LeetCode').length} sessions` },
          { icon: 'record_voice_over', title: 'Mock Interview', text: noRevisions ? 'No sessions logged' : `${revisions.filter(r => r.revisionType === 'MockInterview').length} sessions` },
          { icon: 'quiz', title: 'Quiz', text: noRevisions ? 'No sessions logged' : `${revisions.filter(r => r.revisionType === 'Quiz').length} sessions` },
          { icon: 'terminal', title: 'Project Work', text: noRevisions ? 'No sessions logged' : `${revisions.filter(r => r.revisionType === 'ProjectWork').length} sessions` }
        ].map((cat, idx) => (
          <div 
            key={idx} 
            className="bg-white border-2 border-primary p-6 shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_var(--shadow-color)] transition-all cursor-pointer"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="material-symbols-outlined text-4xl">{cat.icon}</span>
            </div>
            <h3 className="font-headline-md text-lg font-bold uppercase">{cat.title}</h3>
            <p className="font-body-sm text-xs text-on-surface-variant mt-1">{cat.text}</p>
          </div>
        ))}
      </section>

      <section className="bg-white border-2 border-primary p-8 shadow-[8px_8px_0px_0px_var(--shadow-color)]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-label-caps text-label-caps uppercase font-bold tracking-widest">Revision Density</h3>
          <div className="flex items-center gap-2 font-data-mono text-[9px]">
            <span>Less</span>
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#ebedf0' }}></span>
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#9be9a8' }}></span>
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#30a14e' }}></span>
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#216e39' }}></span>
            <span>More</span>
          </div>
        </div>
        <div className="flex gap-6">
          <div className="flex-1 overflow-x-auto pb-2">
            {generateDensityHeatmap(selectedYear)}
          </div>
          <div className="flex flex-col gap-1 shrink-0">
            {(() => {
              const currentYear = new Date().getFullYear();
              const years = Array.from({ length: currentYear - 2021 }, (_, i) => currentYear - i);
              return years.map(y => (
                <button
                  key={y}
                  onClick={() => setSelectedYear(y)}
                  className={`px-3 py-1 text-[10px] font-bold font-data-mono border-2 transition-all ${
                    selectedYear === y
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-white text-primary border-primary/30 hover:border-primary'
                  }`}
                >
                  {y}
                </button>
              ));
            })()}
          </div>
        </div>
        {(!revisions || revisions.length === 0) && (
          <div className="mt-4 border-2 border-dashed border-primary p-6 text-center bg-surface-container-low">
            <p className="text-sm text-on-surface-variant">No revisions logged yet. Start tracking to see your density heatmap.</p>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        <section className="lg:col-span-2 bg-white border-2 border-primary p-8 shadow-[8px_8px_0px_0px_var(--shadow-color)] relative">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-label-caps text-label-caps uppercase tracking-widest font-bold">Revision Timeline</h3>
          </div>
          <div className="overflow-y-auto max-h-[500px] pr-2">

          {noRevisions ? (
            <div className="border-2 border-dashed border-primary p-12 text-center bg-surface-container-low">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-3 block">history</span>
              <p className="font-body-sm text-sm text-on-surface-variant">No revisions logged yet. Start tracking your preparation.</p>
            </div>
          ) : (
            <div className="relative pl-10 md:pl-12 space-y-6 md:space-y-10">
              <div className="absolute left-[7px] md:left-5 top-0 bottom-0 w-0.5 bg-primary"></div>
              
              {displayRevisions.map((rev) => {
                const formattedDate = new Date(rev.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const skillName = typeof rev.skill === 'object' ? rev.skill.name : 'Technical Concept';
                
                return (
                  <div key={rev._id} className="relative group">
                    <div className="absolute -left-10 md:-left-12 mt-1 w-6 h-6 md:w-8 md:h-8 bg-secondary-container border-2 border-primary flex items-center justify-center z-0 shadow-[1px_1px_0px_0px_var(--shadow-color)]">
                      <span className="material-symbols-outlined text-on-secondary-container text-sm font-bold">
                        {rev.difficulty === 'hard' ? 'bolt' : 'check'}
                      </span>
                    </div>
                    <div className="border-2 border-primary p-4 bg-background shadow-[2px_2px_0px_0px_var(--shadow-color)]">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-headline-md text-lg font-bold uppercase">{skillName}</h4>
                        <span className="font-data-mono text-xs text-on-surface-variant font-bold">{formattedDate}</span>
                      </div>
                      <p className="font-body-sm text-sm text-on-surface-variant mb-4">{rev.notes}</p>
                      <div className="flex gap-2 flex-wrap">
                        <span className="border border-primary bg-white px-2 py-0.5 font-label-caps text-[9px] font-bold">
                          {rev.duration} MINS
                        </span>
                        <span className="border border-primary bg-white px-2 py-0.5 font-label-caps text-[9px] font-bold uppercase">
                          RECALL: {rev.recallScore}%
                        </span>
                        <span className="border border-primary bg-white px-2 py-0.5 font-label-caps text-[9px] font-bold uppercase">
                          {rev.difficulty}
                        </span>
                        <div className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(rev)}
                            className="text-[9px] font-label-caps font-bold uppercase px-2 py-0.5 border border-primary bg-white hover:bg-surface-container transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeletingRevisionId(rev._id)}
                            className="text-[9px] font-label-caps font-bold uppercase px-2 py-0.5 border border-primary bg-white text-error hover:bg-error-container transition-colors"
                          >
                            Del
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        </section>

        <aside className="space-y-gutter">
          <div className="bg-white border-2 border-primary p-6 shadow-[8px_8px_0px_0px_var(--shadow-color)]">
            <h3 className="font-label-caps text-label-caps uppercase tracking-widest mb-6 text-on-surface-variant font-bold">
              Revision Stats
            </h3>
            {noRevisions ? (
              <p className="text-sm text-on-surface-variant">No data available yet.</p>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-secondary-container flex items-center justify-center border-2 border-primary shrink-0 shadow-[2px_2px_0px_0px_var(--shadow-color)]">
                    <span className="material-symbols-outlined text-on-secondary-container font-bold">history</span>
                  </div>
                  <div>
                    <p className="font-headline-md font-bold text-sm">Total Sessions</p>
                    <p className="font-data-mono text-xs text-on-surface-variant font-bold">{revisions.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-secondary-container flex items-center justify-center border-2 border-primary shrink-0 shadow-[2px_2px_0px_0px_var(--shadow-color)]">
                    <span className="material-symbols-outlined text-on-secondary-container font-bold">trending_up</span>
                  </div>
                  <div>
                    <p className="font-headline-md font-bold text-sm">Avg Recall</p>
                    <p className="font-data-mono text-xs text-on-surface-variant font-bold">
                      {Math.round(revisions.reduce((acc, r) => acc + r.recallScore, 0) / revisions.length)}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Edit Revision Modal */}
      {editingRevision && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 bg-white">
            <div className="flex justify-between items-center mb-6 border-b-2 border-primary pb-3">
              <h3 className="font-headline-md text-xl font-bold uppercase">Edit Revision</h3>
              <button
                onClick={() => setEditingRevision(null)}
                className="material-symbols-outlined text-primary hover:bg-surface-container p-1"
              >
                close
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="font-label-caps text-[10px] text-primary block">REVISION TYPE</label>
                <select
                  className="w-full border-2 border-primary bg-background p-2 font-body-sm focus:outline-none"
                  value={editRevisionType}
                  onChange={(e) => setEditRevisionType(e.target.value)}
                >
                  {revisionTypeOptions.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-label-caps text-[10px] text-primary block">DURATION (MINUTES)</label>
                <input
                  type="number"
                  min="1"
                  value={editDuration}
                  onChange={(e) => setEditDuration(Number(e.target.value))}
                  className="w-full border-2 border-primary bg-background p-2 font-data-mono focus:outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-label-caps text-[10px] text-primary block">DIFFICULTY</label>
                <select
                  className="w-full border-2 border-primary bg-background p-2 font-body-sm focus:outline-none"
                  value={editDifficulty}
                  onChange={(e) => setEditDifficulty(e.target.value as any)}
                  required
                >
                  <option value="easy">Easy (λ = 0.02)</option>
                  <option value="medium">Medium (λ = 0.04)</option>
                  <option value="hard">Hard (λ = 0.07)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-label-caps text-[10px] text-primary block">RECALL PERFORMANCE (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editRecallScore}
                  onChange={(e) => setEditRecallScore(Number(e.target.value))}
                  className="w-full border-2 border-primary bg-background p-2 font-data-mono focus:outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-label-caps text-[10px] text-primary block">NOTES & DETAILS</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full border-2 border-primary bg-background p-2 font-body-sm focus:outline-none h-24"
                  placeholder="What key insights did you review?"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <Button type="button" variant="secondary" onClick={() => setEditingRevision(null)} className="flex-1 py-2">Cancel</Button>
                <Button type="submit" className="flex-1 py-2" disabled={updateRevisionMutation.isPending}>
                  {updateRevisionMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Delete Revision Confirmation */}
      {deletingRevisionId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm p-6 bg-white">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-error text-3xl">warning</span>
              <h3 className="font-headline-md text-lg font-bold uppercase">Delete Revision</h3>
            </div>
            <p className="font-body-sm text-sm text-on-surface-variant mb-6">
              Are you sure you want to delete this revision entry? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <Button type="button" variant="secondary" onClick={() => setDeletingRevisionId(null)} className="flex-1 py-2">Cancel</Button>
              <Button
                type="button"
                variant="danger"
                className="flex-1 py-2"
                disabled={deleteRevisionMutation.isPending}
                onClick={() => deleteRevisionMutation.mutate(deletingRevisionId)}
              >
                {deleteRevisionMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 bg-white">
            <div className="flex justify-between items-center mb-6 border-b-2 border-primary pb-3">
              <h3 className="font-headline-md text-xl font-bold uppercase">Log Revision</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="material-symbols-outlined text-primary hover:bg-surface-container p-1"
              >
                close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="font-label-caps text-[10px] text-primary block">CHOOSE TOPIC/SKILL</label>
                {selectedSkill === '__custom__' ? (
                  <input
                    type="text"
                    placeholder="Type custom skill name..."
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    className="w-full border-2 border-primary bg-background p-2 font-body-sm focus:outline-none"
                    required
                    autoFocus
                  />
                ) : (
                  <select 
                    className="w-full border-2 border-primary bg-background p-2 font-body-sm focus:outline-none"
                    value={selectedSkill}
                    onChange={(e) => setSelectedSkill(e.target.value)}
                    required
                  >
                    <option value="">-- Select Skill --</option>
                    {(() => {
                      const userSkillNames = new Set((skills ?? []).map(s => s.name.toLowerCase()));
                      const allOptions: { value: string; label: string }[] = [];
                      (skills ?? []).forEach(s => allOptions.push({ value: s._id, label: s.name }));
                      commonSkills.forEach(s => {
                        if (!userSkillNames.has(s.toLowerCase())) {
                          allOptions.push({ value: s, label: s + ' (quick)' });
                        }
                      });
                      return [
                        ...allOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        )),
                        <option key="__custom__" value="__custom__">-- Add Custom Skill --</option>
                      ];
                    })()}
                  </select>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-label-caps text-[10px] text-primary block">REVISION TYPE</label>
                {revisionType === '__custom__' ? (
                  <input
                    type="text"
                    placeholder="Type custom revision type..."
                    value={customRevisionType}
                    onChange={(e) => setCustomRevisionType(e.target.value)}
                    className="w-full border-2 border-primary bg-background p-2 font-body-sm focus:outline-none"
                    required
                    autoFocus
                  />
                ) : (
                  <select
                    className="w-full border-2 border-primary bg-background p-2 font-body-sm focus:outline-none"
                    value={revisionType}
                    onChange={(e) => setRevisionType(e.target.value)}
                  >
                    {[
                      ...revisionTypeOptions.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      )),
                      <option key="__custom__" value="__custom__">-- Add Custom Type --</option>
                    ]}
                  </select>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-label-caps text-[10px] text-primary block">DURATION (MINUTES)</label>
                <input 
                  type="number" 
                  min="1"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full border-2 border-primary bg-background p-2 font-data-mono focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-label-caps text-[10px] text-primary block">DIFFICULTY</label>
                <select 
                  className="w-full border-2 border-primary bg-background p-2 font-body-sm focus:outline-none"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  required
                >
                  <option value="easy">Easy (λ = 0.02)</option>
                  <option value="medium">Medium (λ = 0.04)</option>
                  <option value="hard">Hard (λ = 0.07)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-label-caps text-[10px] text-primary block">RECALL PERFORMANCE (0-100)</label>
                <input 
                  type="number" 
                  min="0"
                  max="100"
                  value={recallScore}
                  onChange={(e) => setRecallScore(Number(e.target.value))}
                  className="w-full border-2 border-primary bg-background p-2 font-data-mono focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-label-caps text-[10px] text-primary block">NOTES & DETAILS</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border-2 border-primary bg-background p-2 font-body-sm focus:outline-none h-24"
                  placeholder="What key insights did you review? (e.g. transactional levels, B-Trees)"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => setShowAddModal(false)} 
                  className="flex-1 py-2"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 py-2"
                  disabled={logRevisionMutation.isPending}
                >
                  {logRevisionMutation.isPending ? 'Logging...' : 'Log Session'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Revisions;
