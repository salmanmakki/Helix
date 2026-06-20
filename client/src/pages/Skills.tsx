import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import { useNavigate } from 'react-router-dom';
import type { Skill } from '../types';

export const Skills: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillMastery, setNewSkillMastery] = useState(80);

  // Query: Fetch all user skills
  const { data: skills } = useQuery<Skill[]>({
    queryKey: ['skills'],
    queryFn: async () => {
      const res = await api.get('/skills');
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

  const { data: revisions } = useQuery({
    queryKey: ['revisions'],
    queryFn: async () => {
      const res = await api.get('/revisions');
      return res.data;
    }
  });

  // Mutation: Add new skill
  const addSkillMutation = useMutation({
    mutationFn: async (newSkill: { name: string; masteryScore: number }) => {
      const res = await api.post('/skills', newSkill);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      queryClient.invalidateQueries({ queryKey: ['readiness'] });
      queryClient.invalidateQueries({ queryKey: ['risk'] });
      setNewSkillName('');
      setNewSkillMastery(80);
      setShowAddModal(false);
    }
  });

  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [editName, setEditName] = useState('');
  const [editMastery, setEditMastery] = useState(80);
  const [deletingSkillId, setDeletingSkillId] = useState<string | null>(null);

  const updateSkillMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; masteryScore?: number } }) => {
      const res = await api.put(`/skills/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      queryClient.invalidateQueries({ queryKey: ['readiness'] });
      queryClient.invalidateQueries({ queryKey: ['risk'] });
      setEditingSkill(null);
    }
  });

  const deleteSkillMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/skills/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      queryClient.invalidateQueries({ queryKey: ['readiness'] });
      queryClient.invalidateQueries({ queryKey: ['risk'] });
      setDeletingSkillId(null);
    }
  });

  const openEditModal = (skill: Skill) => {
    setEditingSkill(skill);
    setEditName(skill.name);
    setEditMastery(skill.masteryScore);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSkill) return;
    const payload: { name?: string; masteryScore?: number } = {};
    if (editName.trim() && editName !== editingSkill.name) payload.name = editName.trim();
    if (editMastery !== editingSkill.masteryScore) payload.masteryScore = editMastery;
    if (Object.keys(payload).length === 0) { setEditingSkill(null); return; }
    updateSkillMutation.mutate({ id: editingSkill._id, data: payload });
  };

  // Calculate Global Health Index (average of effective scores)
  const globalHealth = skills && skills.length > 0
    ? (skills.reduce((acc, curr) => acc + curr.effectiveScore, 0) / skills.length).toFixed(1)
    : 'N/A';

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    addSkillMutation.mutate({
      name: newSkillName,
      masteryScore: newSkillMastery
    });
  };

  // Heatmap generation
  const colors = ['bg-green-100', 'bg-green-300', 'bg-secondary-container', 'bg-error-container'];
  const generateHeatmap = () => {
    const squares = [];
    const heatmapSkills = skills ?? [];

    if (heatmapSkills.length === 0) {
      return [
        <div key="empty" className="col-span-8 sm:col-span-12 md:col-span-16 lg:col-span-24 p-4 text-sm text-on-surface-variant border border-dashed border-primary/25 bg-surface-container-low">
          No skill data recorded yet.
        </div>
      ];
    }

    for (let i = 0; i < 96; i++) {
      const skill = heatmapSkills[i % heatmapSkills.length];
      const score = Number(skill.effectiveScore ?? skill.masteryScore ?? 0);
      const randColor = score >= 80 ? colors[1] : score >= 60 ? colors[0] : score >= 40 ? colors[2] : colors[3];
      squares.push(
        <div 
          key={i} 
          className={`aspect-square border border-primary/20 ${randColor} hover:border-primary cursor-help transition-all`}
          title={`${skill.name}: ${score}% effective score`}
        />
      );
    }
    return squares;
  };

  return (
    <div className="px-4 md:px-margin-desktop py-6 max-w-container-max mx-auto w-full space-y-gutter pb-12 text-primary font-body-lg select-none">
      <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="font-headline-lg text-2xl md:text-3xl uppercase border-b-4 border-primary inline-block mb-2">
            Skill Health Dashboard
          </h2>
          <p className="font-body-lg text-on-surface-variant">Real-time cognitive retention and skill mastery analytics.</p>
        </div>
        <div className="flex gap-4 items-center w-full sm:w-auto justify-between">
          <div className="border-2 border-primary bg-white px-4 py-2 shadow-[2px_2px_0px_0px_var(--shadow-color)] font-data-mono text-sm">
            <span>Global Health Index: </span>
            <span className="text-primary font-bold">{globalHealth}%</span>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="px-4 md:px-6 py-2 text-[10px] md:text-label-caps">
            <span className="material-symbols-outlined text-sm">add</span> <span className="hidden sm:inline">Add Skill</span><span className="sm:hidden">Add</span>
          </Button>
        </div>
      </header>

      {/* Skills Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-12">
        {(skills ?? []).map((skill) => {
          const decay = Math.max(0, skill.masteryScore - skill.effectiveScore);
          return (
            <div 
              key={skill._id} 
              className="bg-white border-2 border-primary shadow-[4px_4px_0px_0px_var(--shadow-color)] p-5 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_var(--shadow-color)] transition-all cursor-default group"
            >
              <div className="flex justify-between items-start mb-6">
                <h3 className="font-headline-md text-xl font-bold uppercase">{skill.name}</h3>
                <span className={`border border-primary px-2 py-0.5 font-label-caps text-[9px] uppercase font-bold ${
                  skill.riskLevel === 'high' ? 'bg-error-container text-on-error-container' : 
                  skill.riskLevel === 'medium' ? 'bg-secondary-container text-on-secondary-container' : 
                  'bg-green-200 text-black'
                }`}>
                  {skill.riskLevel} Risk
                </span>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between border-b border-outline-variant pb-2">
                  <span className="font-label-caps text-xs text-on-surface-variant">Mastery</span>
                  <span className="font-data-mono text-sm font-bold">{skill.masteryScore}%</span>
                </div>
                <div className="flex justify-between border-b border-outline-variant pb-2">
                  <span className="font-label-caps text-xs text-on-surface-variant">Decay</span>
                  <span className={`font-data-mono text-sm font-bold ${decay > 15 ? 'text-error' : 'text-green-700'}`}>
                    {decay}%
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="font-label-caps text-xs font-bold uppercase">Effective Score</span>
                  <span className="text-3xl font-black font-data-mono">{skill.effectiveScore}</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-outline-variant flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEditModal(skill)}
                  className="text-[10px] font-label-caps font-bold uppercase px-3 py-1.5 border border-primary bg-white hover:bg-surface-container transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeletingSkillId(skill._id)}
                  className="text-[10px] font-label-caps font-bold uppercase px-3 py-1.5 border border-primary bg-white text-error hover:bg-error-container transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
        {(!skills || skills.length === 0) && (
          <div className="md:col-span-2 lg:col-span-4 border-2 border-dashed border-primary bg-surface-container-low p-6 text-sm text-on-surface-variant">
            No skills have been added yet. Add real competencies to populate the dashboard.
          </div>
        )}
      </section>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter mb-12">
        <Card className="flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-label-caps text-label-caps uppercase font-bold">Retention Trend</h4>
            <span className="material-symbols-outlined text-primary">timeline</span>
          </div>
          {Array.isArray(snapshotHistory) && snapshotHistory.length > 1 ? (
            <svg viewBox="0 0 300 180" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
              <line x1="0" y1="30" x2="300" y2="30" stroke="#e5e7eb" strokeWidth="1" />
              <line x1="0" y1="80" x2="300" y2="80" stroke="#e5e7eb" strokeWidth="1" />
              <line x1="0" y1="130" x2="300" y2="130" stroke="#e5e7eb" strokeWidth="1" />
              {(() => {
                const pts = [...snapshotHistory].reverse();
                const n = pts.length;
                const pathParts: string[] = [];
                const dots: { x: number; y: number; s: number }[] = [];
                pts.forEach((p: any, i: number) => {
                  const x = (i / (n - 1)) * 280 + 10;
                  const y = 150 - (Math.min(100, Math.max(0, Number(p.readinessScore ?? 0))) / 100) * 120;
                  dots.push({ x, y, s: Number(p.readinessScore ?? 0) });
                  if (i === 0) pathParts.push(`M${x},${y}`);
                  else pathParts.push(`L${x},${y}`);
                });
                const d = pathParts.join(' ');
                const color = dots.length > 1 && dots[dots.length - 1].s >= dots[0].s ? '#16a34a' : '#dc2626';
                return (
                  <>
                    <path d={d} stroke={color} strokeWidth="2.5" fill="none" vectorEffect="non-scaling-stroke" />
                    {dots.map((dot, i) => (
                      <circle key={i} cx={dot.x} cy={dot.y} r="4" fill={color} stroke="white" strokeWidth="1.5" />
                    ))}
                  </>
                );
              })()}
            </svg>
          ) : (
            <div className="flex-1 flex items-center justify-center border-2 border-dashed border-primary bg-surface-container-low">
              <p className="text-sm text-on-surface-variant">No trend data yet. Log revisions to build your retention chart.</p>
            </div>
          )}
        </Card>

        <Card className="flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-label-caps text-label-caps uppercase font-bold">Revision Activity</h4>
            <span className="material-symbols-outlined text-primary">bar_chart</span>
          </div>
          {(() => {
            const revs = Array.isArray(revisions) ? revisions : [];
            if (revs.length === 0) {
              return (
                <div className="flex-1 flex items-center justify-center border-2 border-dashed border-primary bg-surface-container-low">
                  <p className="text-sm text-on-surface-variant">No activity data yet. Start logging revisions to see activity.</p>
                </div>
              );
            }
            const days: { label: string; count: number }[] = [];
            for (let i = 6; i >= 0; i--) {
              const d = new Date();
              d.setDate(d.getDate() - i);
              const key = d.toDateString();
              const count = revs.filter((r: any) => new Date(r.date).toDateString() === key).length;
              days.push({ label: d.toLocaleDateString('en', { weekday: 'short' }), count });
            }
            const maxCount = Math.max(1, ...days.map(d => d.count));
            return (
              <svg viewBox="0 0 300 180" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                {days.map((day, i) => {
                  const barW = 28;
                  const gap = 10;
                  const x = 20 + i * (barW + gap);
                  const barH = (day.count / maxCount) * 120;
                  const y = 155 - barH;
                  const color = day.count > 0 ? '#16a34a' : '#e5e7eb';
                  return (
                    <g key={i}>
                      <rect x={x} y={y} width={barW} height={barH || 2} fill={color} rx="3" />
                      <text x={x + barW / 2} y="172" textAnchor="middle" fontSize="9" fill="#6b7280">{day.label}</text>
                      <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize="8" fill={color}>{day.count || ''}</text>
                    </g>
                  );
                })}
              </svg>
            );
          })()}
        </Card>
      </div>

      {/* Heatmap Section */}
      <Card className="p-6 mb-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h4 className="font-label-caps text-label-caps uppercase font-bold">Cognitive Knowledge Decay Heatmap</h4>
          <div className="flex items-center gap-4">
            <span className="font-label-caps text-[9px] uppercase">RETAINED</span>
            <div className="flex border border-primary">
              <div className="w-4 h-4 bg-green-100"></div>
              <div className="w-4 h-4 bg-green-300"></div>
              <div className="w-4 h-4 bg-secondary-container"></div>
              <div className="w-4 h-4 bg-error-container"></div>
            </div>
            <span className="font-label-caps text-[9px] uppercase">DECAYED</span>
          </div>
        </div>
        
        <div className="grid grid-cols-8 sm:grid-cols-12 md:grid-cols-16 lg:grid-cols-24 gap-2">
          {generateHeatmap()}
        </div>
      </Card>

      {/* Edit Skill Modal */}
      {editingSkill && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 bg-white">
            <div className="flex justify-between items-center mb-6 border-b-2 border-primary pb-3">
              <h3 className="font-headline-md text-xl font-bold uppercase">Edit Competency</h3>
              <button
                onClick={() => setEditingSkill(null)}
                className="material-symbols-outlined text-primary hover:bg-surface-container p-1"
              >
                close
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="font-label-caps text-[10px] text-primary block">SKILL NAME</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border-2 border-primary bg-background p-2 font-body-sm focus:outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-label-caps text-[10px] text-primary block">MASTERY BASELINE (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editMastery}
                  onChange={(e) => setEditMastery(Number(e.target.value))}
                  className="w-full border-2 border-primary bg-background p-2 font-data-mono focus:outline-none"
                  required
                />
              </div>
              <div className="flex gap-4 pt-4">
                <Button type="button" variant="secondary" onClick={() => setEditingSkill(null)} className="flex-1 py-2">Cancel</Button>
                <Button type="submit" className="flex-1 py-2" disabled={updateSkillMutation.isPending}>
                  {updateSkillMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Delete Skill Confirmation */}
      {deletingSkillId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm p-6 bg-white">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-error text-3xl">warning</span>
              <h3 className="font-headline-md text-lg font-bold uppercase">Delete Skill</h3>
            </div>
            <p className="font-body-sm text-sm text-on-surface-variant mb-6">
              Are you sure you want to delete this skill? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <Button type="button" variant="secondary" onClick={() => setDeletingSkillId(null)} className="flex-1 py-2">Cancel</Button>
              <Button
                type="button"
                variant="danger"
                className="flex-1 py-2"
                disabled={deleteSkillMutation.isPending}
                onClick={() => deleteSkillMutation.mutate(deletingSkillId)}
              >
                {deleteSkillMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {skills && skills.some(s => s.riskLevel === 'high') && (
        <div className="bg-primary text-on-primary p-8 border-2 border-primary shadow-[8px_8px_0px_0px_var(--shadow-color)] flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h3 className="font-headline-md text-2xl font-bold mb-2">Critical Decay Detected</h3>
            <p className="font-body-lg text-on-primary text-sm">
              Some skill scores have dropped below the safety threshold. Immediate revision required to prevent mastery reset.
            </p>
          </div>
          <button 
            onClick={() => navigate('/revisions')}
            className="shrink-0 bg-secondary-container text-on-secondary-container border-2 border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] px-8 py-4 font-label-caps text-label-caps font-bold hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all uppercase"
          >
            Start Flash Revisions
          </button>
        </div>
      )}

      {/* Modal - Add Skill */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 bg-white">
            <div className="flex justify-between items-center mb-6 border-b-2 border-primary pb-3">
              <h3 className="font-headline-md text-xl font-bold uppercase">Add Competency</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="material-symbols-outlined text-primary hover:bg-surface-container p-1"
              >
                close
              </button>
            </div>

            <form onSubmit={handleAddSkill} className="space-y-4">
              <div className="space-y-1">
                <label className="font-label-caps text-[10px] text-primary block">SKILL NAME</label>
                <input 
                  type="text" 
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  className="w-full border-2 border-primary bg-background p-2 font-body-sm focus:outline-none"
                  placeholder="e.g. System Design, CN"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-label-caps text-[10px] text-primary block">MASTERY BASELINE (0-100)</label>
                <input 
                  type="number" 
                  min="0"
                  max="100"
                  value={newSkillMastery}
                  onChange={(e) => setNewSkillMastery(Number(e.target.value))}
                  className="w-full border-2 border-primary bg-background p-2 font-data-mono focus:outline-none"
                  required
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
                  disabled={addSkillMutation.isPending}
                >
                  {addSkillMutation.isPending ? 'Saving...' : 'Add Skill'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Skills;
